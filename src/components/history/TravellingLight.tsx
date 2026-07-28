/**
 * TravellingLight — the blue light that carries you through the team's history.
 *
 * ─── THE GLOW IS FAKE, ON PURPOSE ───────────────────────────────────────────
 * The "correct" way to make something glow in three.js is a bloom
 * post-processing pass: render the scene, extract bright pixels, blur them
 * across several downsampled buffers, composite back. It looks superb and it
 * costs an entire extra pass over the screen every frame. It is the single
 * most common reason a WebGL page runs at 20fps on a phone.
 *
 * We use additive sprites instead — two soft radial gradients stacked, drawn
 * on top of the scene. On a DARK background additive blending is genuinely
 * how light behaves: overlapping brightness sums toward white, exactly as
 * bloom would. The result is near-indistinguishable here for a rounding error
 * of the cost.
 *
 * ─── AND WHY LIGHT MODE COMPOSITES DIFFERENTLY ──────────────────────────────
 * This header used to end by conceding that on a light background the trick
 * "falls apart and you'd be forced into real bloom". Half of that is true: it
 * does fall apart, because adding anything to a #f7f8ff floor clamps to pure
 * white, so both sprites rendered as literally nothing while still washing out
 * the core sphere underneath them.
 *
 * But the conclusion doesn't follow. Bloom is a way to make something look
 * BRIGHTER than the surface around it, and on a near-white surface there is no
 * headroom left to be brighter into. What a glow does on white paper is tint:
 * a saturated core washing out to the paper. That is plain alpha compositing of
 * the same gradient through a saturated colour — same texture, same two
 * sprites, same cost, one blending constant. So light mode keeps every bit of
 * the cheap approach and just stops pretending it's adding light.
 *
 * See `glowStyle` / `PALETTE_LIGHT_OVERRIDES` in sceneConfig for the numbers.
 *
 * ─── WHY SPRITES AND NOT PLANES ─────────────────────────────────────────────
 * A glow must always face the camera, or you'd catch it edge-on and watch it
 * vanish — especially bad here, since our camera deliberately banks and rolls.
 * three's Sprite billboards on the GPU as part of its normal transform, so we
 * never touch a quaternion from JS.
 */

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  NormalBlending,
  SRGBColorSpace,
  type Group,
} from "three";
import {
  LIGHT,
  glowStyle,
  type QualitySettings,
  type ScenePalette,
} from "./sceneConfig";

/**
 * Falloff of the glow at normalised radius `r`, 0 at the centre and 1 at the
 * sprite's edge.
 *
 * Two Gaussians summed: a tight one for the hot core and a wide one for the
 * spill. That is the shape real bloom produces — a concentrated centre with a
 * long, gentle tail — and it is why the light reads as EMITTING rather than as
 * a painted disc with a soft edge.
 *
 * Both are renormalised so the result is exactly 0 at r = 1. A Gaussian never
 * truly reaches zero, and the residue matters here: left in, every pixel of the
 * sprite's square quad would carry a little brightness, and with additive
 * blending on a dark floor that is a faintly glowing RECTANGLE around the ball.
 * The subtraction is what guarantees the glow ends as a circle.
 */
function glowFalloff(r: number): number {
  const gaussian = (x: number, k: number) => Math.exp(-k * x * x);
  const normalised = (x: number, k: number) =>
    (gaussian(x, k) - gaussian(1, k)) / (1 - gaussian(1, k));

  return 0.55 * normalised(r, 2.6) + 0.45 * normalised(r, 11);
}

/**
 * Generates the soft radial gradient used by both glow sprites.
 *
 * Drawn once into an offscreen canvas and uploaded as a single texture shared
 * by both sprites — one upload for the life of the page.
 *
 * ─── WHY SO MANY STOPS ──────────────────────────────────────────────────────
 * This was five hand-placed colour stops, and a canvas gradient interpolates
 * LINEARLY between them. Five stops over a curve this steep means five straight
 * segments, and each junction is a discontinuity in the first derivative — a
 * faint ring at every one, banding on a dark background where the eye is most
 * sensitive to it. Sampling the real curve densely costs nothing: it happens
 * once, at mount, into a 256px canvas.
 */
function createGlowTexture(): CanvasTexture {
  const size = 256;
  const stops = 64;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;
  const centre = size / 2;
  const gradient = ctx.createRadialGradient(
    centre,
    centre,
    0,
    centre,
    centre,
    centre,
  );

  for (let i = 0; i <= stops; i++) {
    const r = i / stops;
    gradient.addColorStop(r, `rgba(255,255,255,${glowFalloff(r).toFixed(4)})`);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * Draw order for the glow sprites, and the reason they ignore the depth buffer.
 *
 * ─── THE HARD HORIZONTAL LINE BEHIND THE BALL ───────────────────────────────
 * The halo is a 9-unit billboard centred on a light that hovers 0.9 units above
 * the floor. So it hangs 3.6 units BELOW the ground plane — and the ground is
 * an opaque, depth-writing mesh (see GroundDots). Every halo fragment under
 * y = 0 failed the depth test and was discarded, which cut the glow off along
 * the sprite's intersection with the floor. A camera-facing quad meeting a
 * horizontal plane intersects in a horizontal line, and that line, projected,
 * is exactly the sharp edge that sat just under the ball in every screenshot,
 * in both themes, on every device. It was geometry, not colour.
 *
 * Turning off `depthTest` is the fix, and it is also the physically honest one:
 * light spills ONTO a floor, it does not stop at it. The glow now washes over
 * the ground, the dot grid and the path the same way it washes over everything
 * else.
 *
 * What that trades away is occlusion — a pole passing between the camera and
 * the light no longer blocks the halo. That is the correct trade twice over:
 * the camera chases the light from behind, so almost nothing is ever in front
 * of it, and a bright glow bleeding around a thin pole is what a real one does.
 *
 * `renderOrder` then guarantees the sprites are drawn AFTER the opaque scene
 * and in the right order between themselves (wide halo first, hot core over
 * it). Without it, two sprites at the identical distance are sorted by
 * whichever order three happens to walk them in.
 */
const GLOW_RENDER_ORDER = 10;

interface TravellingLightProps {
  quality: QualitySettings;
  /** The scene controller moves this group along the path each frame. */
  groupRef: React.RefObject<Group>;
  /** Active-theme palette. The light re-tints with it — see the header. */
  palette: ScenePalette;
  /** Selects the compositing mode for the glow sprites. */
  isDark: boolean;
}

export default function TravellingLight({
  quality,
  groupRef,
  palette,
  isDark,
}: TravellingLightProps) {
  const invalidate = useThree((state) => state.invalidate);
  const glowTexture = useMemo(createGlowTexture, []);

  // Textures hold GPU memory — release it when the page unmounts. Without
  // this, navigating between routes repeatedly would leak a texture each time.
  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

  const glow = glowStyle(isDark);
  const blending = isDark ? AdditiveBlending : NormalBlending;

  const glowColor = useMemo(
    () => new Color(palette.lightGlow),
    [palette.lightGlow],
  );
  const coreColor = useMemo(
    () => new Color(palette.lightCore),
    [palette.lightCore],
  );

  // The canvas is frameloop="demand", so it only draws when something asks it
  // to. A theme flip changes no scroll position and settles no spring, so
  // without this the new colours would sit in the materials unseen until the
  // visitor happened to scroll.
  // (Block body, not a concise arrow: React treats an effect's return value as
  // a cleanup function, and matches how GroundDots/JourneyPath do the same.)
  useEffect(() => {
    invalidate();
  }, [palette, isDark, invalidate]);

  return (
    <group ref={groupRef}>
      {/* Solid core. Basic (unlit) material — this object IS the light source
          conceptually, so shading it would be backwards. */}
      {/* ─── THE SEGMENT COUNT IS A SILHOUETTE BUDGET, NOT A SHADING ONE ────
          This carries a `meshBasicMaterial` in a flat colour, so nothing about
          it is shaded: on screen it is a solid disc of `lightCore`. The ONLY
          thing the geometry decides is the outline.

          It was 8 + detail*4 around, i.e. a 12-sided ball at the tier phones
          run — and a dodecagon's corners are plainly visible on the brightest,
          most-watched object in the scene. The old numbers were budgeting for
          a lit sphere's shading cost, which this sphere does not have.

          24 around at that tier is 864 triangles for the whole ball. The path
          tube beside it is eight thousand. This was never where the frame time
          was going. */}
      <mesh>
        <sphereGeometry
          args={[
            LIGHT.coreRadius,
            16 + quality.sphereDetail * 8,
            12 + quality.sphereDetail * 6,
          ]}
        />
        <meshBasicMaterial color={coreColor} toneMapped={false} />
      </mesh>

      {/* Wide, soft halo — the bulk of the perceived glow.

          ─── THE `key` IS LOAD-BEARING ───────────────────────────────────────
          `blending` is not an ordinary uniform: three bakes the blend equation
          into the material's compiled program, so mutating it on a live
          material needs an explicit `needsUpdate` to force a recompile —
          which there is no declarative way to express here. Keying the sprite
          on the theme sidesteps the question entirely: React unmounts it and
          mounts a fresh one, with a correctly-compiled material, on toggle.
          It costs one remount per theme flip and nothing at all per frame.
          (The texture is NOT remounted with it — it's memoised above and
          shared by both sprites, so no GPU upload happens here either.) */}
      <sprite
        key={isDark ? "halo-dark" : "halo-light"}
        scale={[LIGHT.glowSize, LIGHT.glowSize, 1]}
        renderOrder={GLOW_RENDER_ORDER}
      >
        <spriteMaterial
          map={glowTexture}
          color={glowColor}
          blending={blending}
          transparent
          // Glows must never write depth, or they'd punch a hole in everything
          // drawn behind them.
          depthWrite={false}
          // ...nor READ it. See the note above GLOW_RENDER_ORDER: this is what
          // stops the ground plane slicing a hard horizontal line across the
          // halo.
          depthTest={false}
          toneMapped={false}
          opacity={glow.haloOpacity}
        />
      </sprite>

      {/* Tight, hot inner glow. Stacking two gradients gives a concentrated
          centre with a wide falloff — the shape real bloom produces.
          In light mode this is also what makes the very centre of the light
          the deepest point on screen, since it's tinted with `lightCore`. */}
      <sprite
        key={isDark ? "core-dark" : "core-light"}
        scale={[LIGHT.glowSize * 0.35, LIGHT.glowSize * 0.35, 1]}
        renderOrder={GLOW_RENDER_ORDER + 1}
      >
        <spriteMaterial
          map={glowTexture}
          color={coreColor}
          blending={blending}
          transparent
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
          opacity={glow.coreOpacity}
        />
      </sprite>
    </group>
  );
}
