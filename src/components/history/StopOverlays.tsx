/**
 * StopOverlays — the HTML pinned into the 3D scene: labels, frames, flags.
 *
 * ─── WHY THESE ARE DOM AND NOT WEBGL ────────────────────────────────────────
 * This is the "hybrid" half of the page's architecture, and it buys a lot:
 *
 *   • Photos stay <img> tags. The browser lazy-loads and decodes them off the
 *     main thread. As WebGL textures they'd each need a synchronous decode and
 *     GPU upload the first time they appeared — which lands as a visible hitch
 *     at precisely the worst moment, when the light arrives at an achievement.
 *   • Text stays real text: crisp at any zoom, selectable, translatable, and
 *     readable by screen readers and search engines.
 *   • The flag's colours stay exact, with no texture upload at all.
 *   • Everything here can be styled with the site's real CSS tokens.
 *
 * ─── HOW THE FRAMES ARE ORIENTED ────────────────────────────────────────────
 * Each frame is rotated by `stop.facing` so its surface is PERPENDICULAR to
 * the path and its normal points back down the line — straight at the camera,
 * which is chasing the light along that same line. Frame edges therefore
 * square up with the path instead of sitting at an arbitrary world angle.
 *
 * This is a static rotation baked per stop, NOT a per-frame billboard. The
 * frame stays honestly planted in the world, so when the camera banks through
 * a curve the frame rolls with the scene like a real object would. A billboard
 * would counter-rotate to keep facing the lens and instantly read as fake.
 *
 * ─── HOW MULTIPLE IMAGES ARE ARRANGED ───────────────────────────────────────
 * One frame per award, spread along the stop's `right` axis — which is
 * perpendicular to the path, and therefore runs left-to-right across the
 * screen from the approaching camera's point of view. The pole sits in the
 * centre gap, giving the requested arrangement:
 *
 *        [ Image 1 ]   🚩pole + label   [ Image 2 ]
 *
 * ─── OPACITY IS NOT REACT STATE ─────────────────────────────────────────────
 * Fade opacity changes every frame. Driving it through React would re-render
 * this subtree ~60×/second. Instead each element is written to directly via a
 * ref inside useFrame — one style write per element per frame.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { FRAME, LABEL, STOP, VEHICLE } from "./sceneConfig";
import { frameSlots, stopIntensity } from "./journeyCurve";
import type { StopPlacement } from "./StopProps";
import type { Achievement } from "@/data/achievements";

/** Stops further than this (in world units) aren't mounted at all. */
const WINDOW_RANGE = STOP.activationRange * 2.2;

/**
 * A single image frame, with a graceful placeholder.
 *
 * Real photos may not exist yet, so a failed load must not produce a broken-
 * image icon or collapse the layout. A failure swaps to a styled placeholder
 * of identical dimensions showing the year. Drop real files into
 * `public/history/` and they appear with no code change and nothing moving.
 */
function Portrait({ src, year }: { src: string; year: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="w-full h-full flex items-center justify-center rounded-[6px] border border-[var(--border-subtle)]"
        style={{
          background:
            "linear-gradient(150deg, var(--bg-elevated), var(--bg-surface))",
        }}
      >
        <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--text-muted)]">
          {year}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover rounded-[6px]"
    />
  );
}

interface StopOverlaysProps {
  stops: StopPlacement[];
  achievements: Achievement[];
  uRef: React.MutableRefObject<number>;
  pathLength: number;
}

export default function StopOverlays({
  stops,
  achievements,
  uRef,
  pathLength,
}: StopOverlaysProps) {
  // Which stops are currently mounted. Changes a handful of times per journey.
  const [visible, setVisible] = useState<number[]>([0, 1]);

  /**
   * The DOM nodes we write opacity to each frame.
   *
   * NB: each drei <Html> portals its children OUT of the canvas into a sibling
   * DOM layer, so there's no single wrapper we could fade. (And we can't wrap
   * them in a <div> here — inside <Canvas> every JSX tag must be a three.js
   * object.) So each stop registers its individual elements instead.
   */
  const nodesRef = useRef(new Map<number, HTMLElement[]>());

  useFrame(() => {
    const u = uRef.current;

    const next: number[] = [];
    stops.forEach((stop, index) => {
      const distance = (u - stop.u) * pathLength;
      if (Math.abs(distance) <= WINDOW_RANGE) next.push(index);

      // Direct DOM writes — deliberately bypassing React (see file header).
      const nodes = nodesRef.current.get(index);
      if (nodes) {
        const intensity = stopIntensity(distance);
        const opacity = String(intensity);
        const visibility = intensity < 0.01 ? "hidden" : "visible";
        for (const node of nodes) {
          node.style.opacity = opacity;
          // Once invisible, stop the browser hit-testing and compositing it.
          node.style.visibility = visibility;
        }
      }
    });

    // Only touch React state when the mounted SET actually changes.
    setVisible((current) =>
      current.length === next.length &&
      current.every((value, i) => value === next[i])
        ? current
        : next,
    );
  });

  return (
    <>
      {visible.map((index) => {
        const stop = stops[index];
        const achievement = achievements[index];
        if (!stop || !achievement) return null;

        return (
          <StopOverlay
            key={achievement.id}
            index={index}
            stop={stop}
            achievement={achievement}
            registerNodes={(nodes) => {
              if (nodes) nodesRef.current.set(index, nodes);
              else nodesRef.current.delete(index);
            }}
          />
        );
      })}
    </>
  );
}

interface StopOverlayProps {
  index: number;
  stop: StopPlacement;
  achievement: Achievement;
  registerNodes: (nodes: HTMLElement[] | null) => void;
}

function StopOverlay({
  index,
  stop,
  achievement,
  registerNodes,
}: StopOverlayProps) {
  // Collected fresh each render — the number of frames varies per stop, so a
  // fixed set of refs won't do.
  const collected = useRef<HTMLElement[]>([]);
  collected.current = [];
  const collect = (node: HTMLElement | null) => {
    if (node) collected.current.push(node);
  };

  // No dependency array on purpose: the element list is rebuilt every render,
  // so the parent's map must be refreshed every render too.
  useEffect(() => {
    registerNodes(collected.current);
    return () => registerNodes(null);
  });

  const anchors = useMemo(() => {
    // Frames + label cluster around the stop's precomputed centre (poleBase),
    // shared with StopProps so props, poles, frames and text never disagree
    // about where the stop is.
    const poleBase = stop.poleBase;

    // A multi-competition stop with one frame per competition lays its frames
    // out in SCREEN space (screenRight), matching how its poles are placed, so
    // portrait[0] sits under competition[0]'s flag on the LEFT and they read
    // left-to-right in label order. Single-competition stops keep using `right`
    // so their lone photo still alternates sides down the path.
    const frameAxis =
      stop.poles.length > 1 && stop.frameCount > 1 ? stop.screenRight : stop.right;
    const frames = frameSlots(stop.frameCount).map((slot) => {
      const position = poleBase
        .clone()
        .addScaledVector(frameAxis, slot * FRAME.spacing);
      return [position.x, FRAME.height, position.z] as [number, number, number];
    });

    // Per-pole flag anchor: right at the pole's TOP. The flag div is
    // top-anchored, so the cloth hangs down from the pole top like a real flag.
    const flags = stop.poles.map((pole) => ({
      position: [pole.base.x, STOP.poleHeight, pole.base.z] as [
        number,
        number,
        number,
      ],
      logo: pole.logo,
      side: pole.side,
    }));

    return {
      // Floats LABEL.heightAbovePole above the pole tops, bottom-anchored so it
      // grows upward and never dips onto the flags. Tune the gap in sceneConfig.
      label: [
        poleBase.x,
        STOP.poleHeight + LABEL.heightAbovePole,
        poleBase.z,
      ] as [number, number, number],
      // The aircraft, parked on the ground beside the stop's FIRST photo
      // frame (UAVC in 2025) — anchored to that frame rather than to the pole,
      // so it stays beside it however many photos the year ends up with.
      //
      // Two offsets, each on a deliberately different axis:
      //   • sideways on `screenRight`, NOT on `frameAxis`. screenRight never
      //     flips with path parity, so a negative lateralOffset is toward the
      //     left of the PAGE on every stop; frameAxis would put it on the
      //     right half the time.
      //   • forward on −`tangent`, i.e. back toward the oncoming camera, so
      //     the aircraft stands in FRONT of the frame instead of level with it.
      //
      // Y is 0: the element is bottom-anchored in CSS below, so the aircraft
      // meets the floor exactly regardless of how big it's rendered.
      vehicle: (() => {
        const firstSlot = frameSlots(stop.frameCount)[0];
        const parked = poleBase
          .clone()
          .addScaledVector(frameAxis, firstSlot * FRAME.spacing)
          .addScaledVector(stop.screenRight, VEHICLE.lateralOffset)
          .addScaledVector(stop.tangent, -VEHICLE.forwardOffset);
        return [parked.x, 0, parked.z] as [number, number, number];
      })(),
      frames,
      flags,
    };
  }, [stop]);

  const counter = String(index + 1).padStart(2, "0");

  // Every frame and flag shares the stop's facing rotation, so they all square
  // up to the path and to each other.
  const facing: [number, number, number] = [0, stop.facing, 0];

  return (
    // <group>, not <div> — this subtree lives inside <Canvas>, so every tag
    // must be a three.js object. The DOM only appears inside <Html>.
    <group>
      {/* ── Floating label ──────────────────────────────────────────────────
          No `transform`, so the text renders through the normal 2D pipeline and
          stays perfectly crisp. The inner div is BOTTOM-anchored
          (translate -50% x, -100% y) so the block grows UPWARD from its anchor,
          always sitting cleanly above the flags below it. The navbar is kept
          clear structurally instead — the whole canvas is inset below the
          navbar (see HistoryJourney), so the label physically cannot reach it.
          No scrim: the text reads fine against the dark floor on its own. */}
      <Html
        position={anchors.label}
        distanceFactor={LABEL.distanceFactor}
        zIndexRange={[20, 10]}
      >
        <div
          ref={collect}
          style={{
            opacity: 0,
            transform: "translate(-50%, -100%)",
            // Soft shadow, NOT a box scrim — keeps the headlines legible over
            // the dotted floor without the ugly dark rectangle behind them.
            textShadow: "0 2px 10px rgba(0,0,0,0.75)",
          }}
          className="pointer-events-none select-none text-center w-[320px]"
        >
          <div
            className="font-mono tracking-[0.18em] text-[var(--sky)] uppercase mb-1"
            style={{ fontSize: LABEL.eyebrowSize }}
          >
            Achievement {counter}
          </div>
          <div
            className="font-mono text-[var(--text-secondary)] mb-2"
            style={{ fontSize: LABEL.yearSize }}
          >
            {achievement.year}
          </div>

          {achievement.awards.length > 0 ? (
            // Every award this year won — not just the first. Each is its own
            // headline line, with its competition beneath, so multi-award years
            // (2021, 2022, 2025) read completely.
            <ul className="list-none p-0 m-0 space-y-2">
              {achievement.awards.map((award, i) => (
                <li key={i}>
                  <div
                    className="font-display font-bold leading-[1.08] text-[var(--text-primary)] tracking-[-0.01em]"
                    style={{ fontSize: LABEL.titleSize }}
                  >
                    {award.place ? `${award.place} — ` : ""}
                    {award.title}
                  </div>
                  <div
                    className="font-mono tracking-[0.1em] text-[var(--text-secondary)] uppercase mt-0.5"
                    style={{ fontSize: LABEL.competitionSize }}
                  >
                    {award.competition}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            // Founding year — a real headline and description rather than a
            // list of awards it never had.
            <>
              <div
                className="font-display font-bold leading-[1.08] text-[var(--text-primary)] tracking-[-0.01em]"
                style={{ fontSize: LABEL.foundingTitleSize }}
              >
                {achievement.title}
              </div>
              {achievement.blurb && (
                <p
                  className="font-sans leading-[1.5] text-[var(--text-secondary)] mt-2 mb-0 line-clamp-4"
                  style={{ fontSize: LABEL.blurbSize }}
                >
                  {achievement.blurb}
                </p>
              )}
            </>
          )}
        </div>
      </Html>

      {/* ── Image frames ────────────────────────────────────────────────────
          `transform` puts these genuinely into the 3D scene so they share the
          camera's perspective; `facing` squares them to the path. Landscape
          3:2, because the team's photos are all shot landscape. */}
      {anchors.frames.map((position, i) => (
        <Html
          key={i}
          position={position}
          rotation={facing}
          transform
          scale={1.6}
          zIndexRange={[9, 0]}
        >
          <div
            ref={collect}
            style={{ opacity: 0 }}
            className="pointer-events-none select-none"
          >
            <div
              className="w-[150px] h-[100px] p-[3px] rounded-[8px]"
              style={{
                background:
                  "linear-gradient(160deg, rgba(111,227,255,0.5), rgba(60,64,181,0.25))",
                // A purely DARK drop shadow, no coloured glow. Cast down and
                // out so the frame reads as floating ABOVE the ground.
                boxShadow:
                  "0 26px 46px rgba(0,0,0,0.72), 0 10px 20px rgba(0,0,0,0.5)",
              }}
            >
              <Portrait
                src={achievement.portraits[i] ?? ""}
                year={achievement.year}
              />
            </div>

            {/* Cast shadow — a soft, dark, blurred ellipse sitting below the
                frame. Replaces the old cyan "reflection", which read as a glow;
                a dark shadow instead sells the frame as floating above the
                ground. */}
            <div
              aria-hidden="true"
              className="w-[128px] h-[16px] mx-auto mt-[12px] rounded-[50%]"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(0,0,0,0.55), rgba(0,0,0,0) 72%)",
                filter: "blur(3px)",
              }}
            />
          </div>
        </Html>
      ))}

      {/* ── The year's aircraft ─────────────────────────────────────────────
          Only rendered for years that have a render on file; everything else
          about the stop is identical whether or not one exists.

          A transparent WebP, not a 3D model — see the Vehicle type in
          achievements.ts for the reasoning. `transform` puts it genuinely in
          the scene and `facing` squares it to the path, exactly like the photo
          frames, so it shares their perspective and banks with the camera
          through curves instead of floating in screen space.

          ─── DELIBERATELY THE CHEAPEST THING ON THE STOP ───────────────────
          The <img> IS the faded element — no wrapper divs, no name plate, no
          animation. That means:
            • one DOM node, so the per-frame fade does one style write here,
              not three;
            • no `filter`, which would make the browser re-run a per-pixel blur
              on a large transparent bitmap on every one of those opacity
              writes — by far the most expensive thing this element could do;
            • no CSS animation and no `will-change`, so the compositor never
              allocates a layer for it or wakes up to repaint it. The aircraft
              is parked: once drawn, it costs nothing until the fade moves.

          `translateY(-50%)` cancels drei's centring so the element's BOTTOM
          edge lands on the anchor — the same trick the flags use below. The
          anchor is at ground level, so the aircraft sits exactly on the floor
          whatever VEHICLE.width is, with no magic offset to re-tune.

          The intrinsic width/height attributes are the file's real pixel size:
          they give the browser the aspect ratio before the bytes arrive, so
          the element never reflows when the image decodes. */}
      {achievement.vehicle && (
        <Html
          position={anchors.vehicle}
          rotation={facing}
          transform
          scale={VEHICLE.scale}
          zIndexRange={[9, 0]}
        >
          <img
            ref={collect}
            src={achievement.vehicle.render}
            // Named, not decorative: this is the team's own aircraft, so the
            // alt text carries real information for screen readers even though
            // nothing is drawn on screen.
            alt={`${achievement.vehicle.name}, the aircraft flown in ${achievement.year}`}
            loading="lazy"
            decoding="async"
            draggable={false}
            width={achievement.vehicle.width}
            height={achievement.vehicle.height}
            className="block pointer-events-none select-none"
            style={{
              opacity: 0,
              transform: "translateY(-50%)",
              width: VEHICLE.width,
              height: "auto",
              maxWidth: "none",
            }}
          />
        </Html>
      )}

      {/* ── Competition flags — one per pole ────────────────────────────────
          Each flag flies its competition's logo (or the Egyptian flag on the
          founding stop) as a plain RECTANGLE fixed to the pole: one straight
          edge tied to the pole and the whole cloth streaming out to the side.

          Anchored at the POLE TOP. drei's <Html transform> CENTRES its content
          on the anchor by default (an internal translate(-50%,-50%)), so a raw
          translateX(0) would put the pole through the flag's middle. We undo
          that half-shift deliberately:

            • a right-flying flag  → translate(+50%, +50%): its LEFT edge lands
              exactly on the pole and its TOP edge sits at the pole tip, so the
              cloth hangs down-and-to-the-RIGHT.
            • a left-flying flag   → translate(-50%, +50%): mirror image, its
              RIGHT edge on the pole, cloth streaming LEFT.

          A lone pole always flies right; a two-pole stop flies its flags
          outward (left pole left, right pole right) so they never overlap.
          Because the element is already rotated to `facing`, its local X runs
          along the flag's own plane and "+X" reads as screen-right whichever
          way the path heads.

              flies right              flies left
              ┃▔▔▔▔┃                    ┃▔▔▔▔┃
              ┃logo ┃                    ┃ logo┃
              ┃▁▁▁▁┃                    ┃▁▁▁▁┃
              ┃                                ┃
              ┃ (pole)                  (pole) ┃          */}
      {anchors.flags.map((flag, i) => {
        const fliesLeft = flag.side === "left"; // pole on the flag's right
        return (
          <Html
            key={i}
            position={flag.position}
            rotation={facing}
            transform
            scale={1.6}
            zIndexRange={[9, 0]}
          >
            <div
              ref={collect}
              style={{
                opacity: 0,
                // Cancel drei's centring so the flag's inner edge lands ON the
                // pole and its top edge sits at the pole tip (see block above).
                transform: fliesLeft
                  ? "translate(-50%, 50%)"
                  : "translate(50%, 50%)",
              }}
              className="pointer-events-none select-none"
            >
              {/* Plain rectangular flag. Adjust w-[..]/h-[..] to resize it. */}
              <div
                className="w-[64px] h-[40px] rounded-[2px] overflow-hidden"
                style={{
                  filter: "drop-shadow(0 5px 10px rgba(0,0,0,0.55))",
                }}
              >
                <img
                  src={flag.logo}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            </div>
          </Html>
        );
      })}
    </group>
  );
}
