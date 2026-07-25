/**
 * JourneyScene — assembles the 3D scene and drives it from scroll.
 *
 * ─── THE RENDER LOOP, IN ORDER ──────────────────────────────────────────────
 * Every frame runs exactly three useFrame callbacks, in a deliberate order set
 * by priority (lower runs first):
 *
 *   -2  SceneController — reads scroll, moves the light, publishes position,
 *                         direction, speed and `u` into shared refs.
 *   -1  ChaseCamera     — springs toward the light and banks into the turn.
 *    0  StopProps / StopOverlays — fade themselves based on `u`.
 *
 * Every priority is ≤ 0 on purpose. In R3F, ANY subscriber with a priority
 * above 0 disables automatic rendering and makes you responsible for calling
 * gl.render() yourself. Using positive numbers for ordering is an easy and
 * confusing way to end up with a permanently black canvas.
 *
 * ─── COMMUNICATION IS VIA REFS, NOT PROPS OR CONTEXT ────────────────────────
 * The light's position changes every frame. Passing it as a prop or through
 * context would re-render the tree at 60fps. Instead the controller MUTATES
 * shared Vector3 instances that the shaders and camera already hold pointers
 * to. Nothing re-renders; the data is simply already where it's needed.
 */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CatmullRomCurve3, FogExp2, Color, type Group, Vector3 } from "three";
import GroundDots from "./GroundDots";
import JourneyPath from "./JourneyPath";
import TravellingLight from "./TravellingLight";
import ChaseCamera from "./ChaseCamera";
import StopProps, {
  type StopPlacement,
  type PolePlacement,
  type VehiclePlacement,
} from "./StopProps";
import StopOverlays from "./StopOverlays";
import VehicleShadows from "./VehicleShadows";
import { buildJourneyCurve, poleOffsetFor } from "./journeyCurve";
import {
  LIGHT,
  QUALITY,
  scenePalette,
  shadowOpacity,
  showPoleShadows,
  type QualitySettings,
  type ScenePalette,
} from "./sceneConfig";
import { useAdaptiveQuality } from "./usePerfTier";
import type { Tier } from "./capability";
import { polesFor, type Achievement } from "@/data/achievements";
import { useTheme } from "@/context/ThemeContext";

/**
 * Lateral distance between the two poles of a two-competition stop.
 *
 * Kept SMALL so both poles sit inside the gap between the two image frames
 * (whose inner edges are ~±1.4 world units from the stop centre) and stay fully
 * visible instead of hiding behind a frame. The flags drape OUTWARD from their
 * poles and ride above the frames, so a tight gap can't make the two cloths
 * collide — that constraint only applied to the old inward-draping flags.
 */
const POLE_PAIR_GAP = 2.0;

/**
 * How quickly the light converges on the scroll position, per second.
 *
 * The light doesn't snap straight to the scroll value: it eases toward it.
 * That gives the light a little inertia of its own — a fast flick-scroll
 * becomes a swift glide rather than a teleport — and it feeds the camera a
 * continuous speed signal, which the banking physics depends on.
 *
 * It still converges to exactly the scroll position when you stop, so the
 * scene remains a pure function of scroll at rest. No drift, no accumulation.
 */
const LIGHT_FOLLOW_RATE = 7;

/** Speed above which we assume a scroll jump rather than real motion. */
const MAX_TRACKED_SPEED = 240;

interface ControllerProps {
  curve: CatmullRomCurve3;
  pathLength: number;
  progressRef: React.MutableRefObject<number>;
  /** Scroll change notifications — the thing that wakes the render loop. */
  subscribe: (listener: () => void) => () => void;
  lightGroupRef: React.RefObject<Group>;
  lightPosRef: React.MutableRefObject<Vector3>;
  lightDirRef: React.MutableRefObject<Vector3>;
  uRef: React.MutableRefObject<number>;
  speedRef: React.MutableRefObject<number>;
  tier: Tier;
  onDowngrade: (next: Tier) => void;
  onGiveUp: () => void;
}

function SceneController({
  curve,
  pathLength,
  progressRef,
  subscribe,
  lightGroupRef,
  lightPosRef,
  lightDirRef,
  uRef,
  speedRef,
  tier,
  onDowngrade,
  onGiveUp,
}: ControllerProps) {
  const invalidate = useThree((state) => state.invalidate);

  useAdaptiveQuality(tier, onDowngrade, onGiveUp);

  /**
   * Wake the render loop when the page scrolls.
   *
   * This is essential, not incidental: with frameloop="demand" the canvas
   * draws nothing until something calls invalidate(). Without this
   * subscription no frame would ever run, so the controller below would never
   * observe the new scroll position — the scene would simply sit frozen.
   * Render-on-demand needs an explicit wake-up source, and scrolling is it.
   */
  useEffect(() => subscribe(() => invalidate()), [subscribe, invalidate]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30);
    const target = progressRef.current;
    const previous = uRef.current;

    // Framerate-independent exponential approach. Using exp() rather than a
    // fixed per-frame fraction means the motion is identical at 30fps and
    // 144fps — a plain lerp would visibly differ between devices.
    const alpha = 1 - Math.exp(-LIGHT_FOLLOW_RATE * delta);
    const u = previous + (target - previous) * alpha;
    uRef.current = u;

    // Speed in world units/sec, low-pass filtered. The raw value is noisy
    // (scroll arrives in bursts) and noisy speed would make the camera's bank
    // angle twitch, since bank depends on v².
    const rawSpeed = ((u - previous) * pathLength) / Math.max(delta, 1e-4);
    const clamped = Math.max(-MAX_TRACKED_SPEED, Math.min(MAX_TRACKED_SPEED, rawSpeed));
    speedRef.current += (clamped - speedRef.current) * 0.25;

    // Publish the light's position and heading by MUTATING the shared vectors
    // that the shaders already point at — no uniform writes, no re-renders.
    curve.getPointAt(u, lightPosRef.current);
    lightPosRef.current.y += LIGHT.hoverHeight;
    curve.getTangentAt(u, lightDirRef.current).normalize();

    if (lightGroupRef.current) {
      lightGroupRef.current.position.copy(lightPosRef.current);
    }

    // Keep drawing while the light is still catching up to the scroll (the
    // camera separately keeps the loop alive until its spring settles).
    if (Math.abs(target - u) > 0.00002) invalidate();
  }, -2);

  return null;
}

/**
 * Applies the scene's background + fog colour and keeps them in sync with the
 * active theme.
 *
 * Both are set on the default scene at mount via the `scene` prop below, but
 * that snapshot doesn't re-run when the theme flips. This lives INSIDE the
 * Canvas so it can mutate the live scene and — crucially, since the canvas
 * renders on demand — call invalidate() to draw the one frame that shows the
 * new colour. Without that nudge a theme toggle would only take effect on the
 * next scroll.
 */
function SceneBackground({ palette }: { palette: ScenePalette }) {
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    (scene.background as Color).set(palette.background);
    (scene.fog as FogExp2).color.set(palette.background);
    invalidate();
  }, [palette, scene, invalidate]);

  return null;
}

/**
 * Repaints the whole canvas when the theme flips.
 *
 * ─── WHY A SINGLE invalidate() ISN'T ENOUGH ─────────────────────────────────
 * With `frameloop="demand"` the render loop is asleep whenever the reader is
 * holding still — which is exactly when someone reaches for the theme toggle.
 * Nothing redraws until something asks, so the scene sits there in its old
 * colours until the next scroll. That is the "it only changes if I refresh"
 * symptom.
 *
 * Every palette consumer does call invalidate() from its own effect, but that
 * correctness rests on each one remembering to — and it breaks down for
 * anything that reads the theme inside useFrame instead of holding it in a
 * material, because there is no palette effect to hang the call on. The
 * aircraft shadows are exactly that case: their opacity is written per frame,
 * so with no frame, no update.
 *
 * Asking centrally removes the requirement from every consumer. Asking across
 * a HANDFUL of consecutive frames, rather than one, also removes an ordering
 * question: sibling effects commit in tree order, so a lone invalidate fired
 * here can be spent on a frame drawn before another consumer has swapped its
 * colour. Four frames on a theme toggle costs nothing and is unconditionally
 * correct.
 */
function ThemeRepaint({ palette }: { palette: ScenePalette }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    let drawn = 0;
    let raf = 0;
    const pump = () => {
      invalidate();
      if (++drawn < 4) raf = requestAnimationFrame(pump);
    };
    pump();
    return () => cancelAnimationFrame(raf);
  }, [palette, invalidate]);

  return null;
}

interface JourneySceneProps {
  achievements: Achievement[];
  progressRef: React.MutableRefObject<number>;
  subscribe: (listener: () => void) => () => void;
  tier: Tier;
  onDowngrade: (next: Tier) => void;
  onGiveUp: () => void;
  isMobile: boolean;
  reducedMotion: boolean;
}

export default function JourneyScene({
  achievements,
  progressRef,
  subscribe,
  tier,
  onDowngrade,
  onGiveUp,
  isMobile,
  reducedMotion,
}: JourneySceneProps) {
  const quality: QualitySettings = QUALITY[tier];

  // The scene mirrors the site theme: in light mode the backdrop, ground, idle
  // dots, idle path and props turn pale, while the travelling light and the
  // blues it lights up stay exactly the same. See `scenePalette`.
  const { isDark } = useTheme();
  const palette = useMemo(() => scenePalette(isDark), [isDark]);
  // Shadows are far weaker in light mode — a 0.5 black pool that reads as
  // grounding on a near-black floor is an ink stain on a near-white one.
  const shadowAlpha = useMemo(() => shadowOpacity(isDark), [isDark]);
  const poleShadows = useMemo(() => showPoleShadows(isDark), [isDark]);

  // Geometry is derived from the CONTENT, so editing achievements.ts reshapes
  // the path automatically — no hand-placed coordinates anywhere.
  const journey = useMemo(
    () => buildJourneyCurve(achievements.length),
    [achievements.length],
  );

  const stops: StopPlacement[] = useMemo(() => {
    const up = new Vector3(0, 1, 0);

    return journey.stopUs.map((u, index) => {
      const tangent = journey.curve.getTangentAt(u, new Vector3()).normalize();

      // `screenRight` always points to the VIEWER's right: the camera chases
      // the light along the tangent, and cross(tangent, up) is the camera's
      // right. It never flips with path parity — so a flag whose cloth streams
      // toward +screenRight looks like it's flying right no matter which side
      // of the path the stop is on. The flag drape uses this below.
      const screenRight = new Vector3().crossVectors(tangent, up).normalize();

      const right = screenRight.clone();

      // Alternate which side of the path each stop sits on. Keeping them all
      // on one side would leave half the frame permanently empty as the
      // camera looks down the path.
      if (index % 2 === 1) right.negate();

      // Rotation that squares a flat frame up to the oncoming camera.
      //
      // A plane's normal points along +Z by default. We want it pointing back
      // down the path (−tangent), i.e. at the camera chasing the light. For a
      // normal (sin θ, 0, cos θ), that gives θ = atan2(−tx, −tz).
      //
      // Note this is a STATIC rotation baked per stop, not a per-frame
      // billboard: the frame stays honestly planted in the world and the
      // camera's bank rolls past it, which is what sells it as a real object
      // standing on the ground rather than a sticker tracking the lens.
      const facing = Math.atan2(-tangent.x, -tangent.z);

      const achievement = achievements[index];
      const anchor = journey.stopPoints[index];

      // Frames come from the photos provided (min 1). The pole offset adapts to
      // that count so a big year's outermost frame never crosses the path.
      const frameCount = Math.max(1, achievement.portraits.length);
      const poleBase = anchor
        .clone()
        .addScaledVector(right, poleOffsetFor(frameCount));

      // One pole per distinct competition, positioned around poleBase. A lone
      // pole sits dead centre; a pair straddles the centre.
      //
      // Multi-competition stops are laid out in SCREEN space (`screenRight`),
      // NOT along the parity-flipped `right`. That guarantees the competitions
      // read left-to-right in the SAME order they're listed in the label (the
      // first-listed competition on the left), on every stop regardless of
      // which way the path happens to be curving. Laying them along `right`
      // instead flipped the pair left↔right on odd-numbered stops.
      //
      // Drape direction then follows each pole's actual screen position: a pole
      // left-of-centre drapes its flag left, right-of-centre drapes right, so
      // the pair opens outward. A single pole always drapes right.
      const poleSpecs = polesFor(achievement);
      const multiPole = poleSpecs.length > 1;
      const poles: PolePlacement[] = poleSpecs.map((spec, i) => {
        // Offsets: 1 pole → [0]; 2 → [−gap/2, +gap/2]; N → centred spread.
        const centred = i - (poleSpecs.length - 1) / 2;
        const base = poleBase
          .clone()
          .addScaledVector(multiPole ? screenRight : right, centred * POLE_PAIR_GAP);
        const screenOffset = base.clone().sub(poleBase).dot(screenRight);
        const side: PolePlacement["side"] = !multiPole
          ? "right"
          : screenOffset < 0
            ? "left"
            : "right";
        return { base, logo: spec.logo, side };
      });

      // Where this year's aircraft park, resolved once here so the <img> in
      // StopOverlays and the contact shadow in StopProps read the SAME point
      // and an aircraft can never drift off its own shadow.
      //
      // `alongPoles` is a fraction from the first pole to the last, so an
      // aircraft stays pinned to its competition's pole if the poles are ever
      // moved apart. lerp covers the single-pole case for free: both ends are
      // the same point. `forwardOffset` then pulls it back along −tangent,
      // toward the oncoming camera.
      const vehicles: VehiclePlacement[] = (achievement.vehicles ?? []).map(
        (vehicle) => ({
          position: poles[0].base
            .clone()
            .lerp(poles[poles.length - 1].base, vehicle.alongPoles)
            .addScaledVector(tangent, -vehicle.forwardOffset),
          shadowRadius: vehicle.shadowRadius,
          shadowMask: vehicle.shadowMask,
          facing,
          groundOffset: vehicle.groundOffset,
        }),
      );

      return {
        anchor,
        right,
        screenRight,
        tangent,
        facing,
        vehicles,
        frameCount,
        poleBase,
        poles,
        u,
      };
    });
  }, [journey, achievements]);

  // Shared mutable state. Created once; mutated in place every frame.
  const lightGroupRef = useRef<Group>(null);
  const lightPosRef = useRef(new Vector3());
  const lightDirRef = useRef(new Vector3(0, 0, -1));
  const uRef = useRef(0);
  const speedRef = useRef(0);

  // Ground plane must comfortably cover the whole journey plus the camera's
  // peripheral vision, or you'd see its edge as the camera banks.
  const groundDepth = journey.length + 160;
  const centerZ = -(journey.length * 0.5);

  // Initial background + fog for mount. Theme changes after mount are handled
  // reactively by <SceneBackground> below.
  const fog = useMemo(() => new FogExp2(palette.background, 0.0085), [palette]);
  const background = useMemo(() => new Color(palette.background), [palette]);

  return (
    <Canvas
      // The core performance decision: draw ONLY when asked. An idle reader
      // costs zero GPU and zero battery.
      frameloop="demand"
      // Cap device pixel ratio by tier. The single strongest perf lever there
      // is — dpr 3 → 1.5 on a phone is a 75% cut in pixels shaded.
      dpr={[1, quality.maxDpr]}
      gl={{
        antialias: quality.antialias,
        powerPreference: "high-performance",
        // No transparency needed — an opaque canvas lets the compositor skip
        // blending the whole surface against the page beneath it.
        alpha: false,
        stencil: false,
        depth: true,
      }}
      camera={{ fov: isMobile ? 55 : 42, near: 0.5, far: 400 }}
      scene={{ background, fog }}
      style={{ touchAction: "pan-y" }}
    >
      {/* Cheap unshaded ambient plus one directional key light. No shadow maps
          anywhere — the blob shadows in StopProps stand in for them. */}
      <ambientLight intensity={1.15} color="#8ea0d8" />
      <directionalLight position={[12, 24, 8]} intensity={1.5} color="#cfe0ff" />

      <SceneBackground palette={palette} />
      <ThemeRepaint palette={palette} />

      <SceneController
        curve={journey.curve}
        pathLength={journey.length}
        progressRef={progressRef}
        subscribe={subscribe}
        lightGroupRef={lightGroupRef}
        lightPosRef={lightPosRef}
        lightDirRef={lightDirRef}
        uRef={uRef}
        speedRef={speedRef}
        tier={tier}
        onDowngrade={onDowngrade}
        onGiveUp={onGiveUp}
      />

      <ChaseCamera
        curve={journey.curve}
        pathLength={journey.length}
        uRef={uRef}
        speedRef={speedRef}
        isMobile={isMobile}
        reducedMotion={reducedMotion}
      />

      <GroundDots
        width={220}
        depth={groundDepth}
        centerZ={centerZ}
        quality={quality}
        lightPosRef={lightPosRef}
        palette={palette}
      />

      <JourneyPath
        curve={journey.curve}
        length={journey.length}
        quality={quality}
        lightPosRef={lightPosRef}
        lightDirRef={lightDirRef}
        palette={palette}
      />

      <TravellingLight quality={quality} groupRef={lightGroupRef} />

      <StopProps
        stops={stops}
        quality={quality}
        uRef={uRef}
        pathLength={journey.length}
        palette={palette}
        shadowOpacity={shadowAlpha}
        showPoleShadows={poleShadows}
      />

      <VehicleShadows
        stops={stops}
        quality={quality}
        uRef={uRef}
        pathLength={journey.length}
        shadowOpacity={shadowAlpha}
      />

      <StopOverlays
        stops={stops}
        achievements={achievements}
        uRef={uRef}
        pathLength={journey.length}
        isDark={isDark}
      />
    </Canvas>
  );
}
