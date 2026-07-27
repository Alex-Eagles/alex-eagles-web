/**
 * HistoryJourney — the pinned scroll container that hosts the 3D journey,
 * and the gatekeeper that decides whether the 3D journey runs at all.
 *
 * ─── THE PINNING TRICK ──────────────────────────────────────────────────────
 * A tall outer container (several viewport-heights) holds a `sticky` child
 * that is exactly one viewport tall. As you scroll through the container, the
 * child stays fixed on screen while the scroll position advances — and that
 * scroll position is what drives the light along the path.
 *
 * This is pure CSS sticky positioning: no scroll hijacking, no preventDefault,
 * no wheel interception. Native scrolling keeps working exactly as the user
 * (and their trackpad, and their screen reader, and their browser's find-in-
 * page) expects. The scene reads scroll; it never fights it.
 *
 * ─── THE FIVE WAYS THIS DEGRADES ────────────────────────────────────────────
 * The brief was "must not lag, must not error". So the 3D scene is treated as
 * a progressive enhancement with layered escape hatches, in order:
 *
 *   1. No WebGL2            → 2D timeline, three.js never downloads
 *   2. prefers-reduced-motion → 2D timeline
 *   3. Runtime error / context loss → 2D timeline, via WebGLBoundary
 *   4. Sustained low FPS    → quality tier steps down (high → medium → low)
 *   5. Still slow at lowest tier → 2D timeline
 *
 * ─── THE BUNDLE NEVER LOADS UNLESS IT'S USED ────────────────────────────────
 * The scene is a lazy import, so three.js (~150KB gzipped) is fetched only
 * after we've decided this device is actually going to render it. A visitor
 * on a device that can't run it — or one who never scrolls to it — pays
 * nothing at all. It also keeps every OTHER page on the site unaffected.
 *
 * ─── WHERE THE ESCAPE HATCHES LAND, AND WHY IT ISN'T HERE ───────────────────
 * Every one of them renders NOTHING and lets the page continue to its own
 * closing timeline. This component used to render `<Timeline2D isFallback />`
 * instead — but History.tsx already ends with a Timeline2D of its own, so
 * anyone who fell back got the entire milestone list twice, once under a
 * "Milestones" label and again under "The full record".
 *
 * A fallback is only a fallback if the thing it replaces isn't already on the
 * page. The 2D timeline is unconditional content here, so the journey's job
 * when it cannot run is simply to get out of the way.
 *
 * The PRE-MOUNT half of that decision (no WebGL2, or reduced motion) is
 * exported as `useJourneyAvailable` so the page can ask the same question the
 * component would — it needs the answer anyway, to write hero copy that doesn't
 * promise a flight path nobody is going to see.
 */

import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useScrollProgress } from "./useScrollProgress";
// From capability.ts, NOT usePerfTier.ts — the latter imports three.js, which
// would defeat the lazy boundary below and ship ~300KB to every page.
import { detectCapability, type Tier } from "./capability";
import { SCROLL_PER_STOP, SCROLL_PADDING } from "./sceneConfig";
import WebGLBoundary from "./WebGLBoundary";
import JourneyProgressRail from "./JourneyProgressRail";
import ScrollCue from "./ScrollCue";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { achievements } from "@/data/achievements";

// three.js is pulled in only when we actually mount the scene.
const loadScene = () => import("./JourneyScene");
const JourneyScene = lazy(loadScene);

/**
 * Start fetching the scene chunk before anyone needs it.
 *
 * ─── THE PROBLEM THIS SOLVES IS A PHONE ON MOBILE DATA ──────────────────────
 * The chunk is only requested when `hasEntered` flips, i.e. when the visitor
 * has already scrolled to the section. On a desktop connection the ~230KB
 * arrives faster than they can read the heading. On 4G it does not: they reach
 * the journey, get "Preparing the flight path…" for a second or two, and a
 * pinned section that is doing nothing is indistinguishable from a broken one.
 *
 * The hero exists partly to buy that time (see the History page header), but it
 * cannot buy any if nothing has started downloading. This starts it at the top
 * of the page instead, so the bytes are in the module cache before the section
 * is anywhere near the screen — the same trick as `<link rel=prefetch>`, but
 * hitting the exact chunk the lazy boundary will ask for, so there is no risk
 * of prefetching a URL that then doesn't get reused.
 *
 * ─── WHY IT IS IDLE-SCHEDULED AND NOT IMMEDIATE ─────────────────────────────
 * The first seconds of the page belong to the hero: its fonts, its own paint,
 * and on this page the press stills further down. `requestIdleCallback` puts
 * the chunk behind all of that rather than competing with it for a phone's
 * single decode thread and whatever bandwidth it has. The timeout is the
 * backstop for a page that never goes idle — Safari has no rIC at all, hence
 * the setTimeout fallback.
 *
 * Callers must gate this on the journey actually being available: a device that
 * cannot render the scene, or a visitor on Data Saver, must not be sent the
 * bytes at all, which is the entire point of the gate.
 */
function warmSceneChunk(): () => void {
  const idle = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    }
  );

  if (idle.requestIdleCallback) {
    const handle = idle.requestIdleCallback(() => void loadScene(), {
      timeout: 2500,
    });
    return () => idle.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(() => void loadScene(), 1200);
  return () => window.clearTimeout(handle);
}

/**
 * How many times to try mounting the 3D scene before giving up on it.
 *
 * Two, not one: most WebGL failures are transient and external (see the
 * `crashCount` note below). Bounded, so a device that fails deterministically
 * settles onto the 2D timeline immediately rather than looping.
 */
const MAX_SCENE_ATTEMPTS = 2;

/**
 * Can this visitor have the 3D journey at all?
 *
 * The two conditions that are knowable BEFORE anything mounts: the browser can
 * give us a WebGL2 context, and the visitor hasn't asked their system to reduce
 * motion. The runtime failures (a crash, a device too slow even at the lowest
 * quality tier) can't be predicted and are handled inside the component.
 *
 * Exported because the page needs the same answer for its own copy — and
 * because asking it in one place is what stops the page and the component from
 * disagreeing about whether a journey exists. The underlying probe is cached in
 * capability.ts, so two callers cost one probe.
 */
export function useJourneyAvailable(): boolean {
  const reducedMotion = useReducedMotion();
  const capability = useMemo(() => detectCapability(), []);
  return capability.webgl && !reducedMotion && !capability.frugal;
}

/**
 * Aspect ratio of the element the canvas actually fills.
 *
 * MEASURED, not derived from `window.innerWidth / innerHeight`. The canvas is
 * inset below the navbar on desktop and not on mobile, so the window's ratio is
 * wrong on exactly the screens where the framing matters most — and it would go
 * on being wrong the moment anything else about the layout changed.
 *
 * ─── IT IGNORES THE URL BAR, AND THAT IS THE WHOLE JOB ──────────────────────
 * This value feeds `fitScene`, whose output places every pole, photo and flag
 * in the scene. So anything that changes it MOVES THE WORLD.
 *
 * An iPhone 13 is 390x659 with the URL bar showing and 390x744 without, i.e.
 * aspect 0.59 then 0.52 — and the bar slides away and back repeatedly while you
 * scroll, which on a pinned section is the entire time you are looking at it.
 * Re-solving across that gap changes `stopScale` by about 17%, so every flag
 * pole and photo frame in view visibly jumped up and down on each transition.
 * Quantising alone did not save it: the two states land in different buckets.
 *
 * So a height change ON ITS OWN has to clear URL_BAR_SLACK before it counts.
 * Browser chrome sliding in and out is not a change of screen shape and must
 * not be treated as one. A rotation moves the WIDTH, and a genuine resize moves
 * the height much further than a toolbar can, so both still get through.
 *
 * The 0.05 rounding on top means near-identical shapes report the identical
 * number, so a re-measure that finds nothing meaningful re-renders nothing.
 */
const ASPECT_STEP = 0.05;
const URL_BAR_SLACK_PX = 140;

function useCanvasAspect(ref: React.RefObject<HTMLElement>): number {
  const [aspect, setAspect] = useState(16 / 9);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frame = 0;
    let lastWidth = 0;
    let lastHeight = 0;

    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width === 0 || height === 0) return;

      // The gate. Only the FIRST measurement, a width change, or a height
      // change too large to be browser chrome is allowed to move the framing.
      const settled = lastWidth !== 0;
      const chromeOnly =
        width === lastWidth && Math.abs(height - lastHeight) < URL_BAR_SLACK_PX;
      if (settled && chromeOnly) return;

      lastWidth = width;
      lastHeight = height;

      const quantised = Math.round(width / height / ASPECT_STEP) * ASPECT_STEP;
      setAspect((current) =>
        Math.abs(current - quantised) < ASPECT_STEP / 2 ? current : quantised,
      );
    };

    measure();

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(element);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ref]);

  return aspect;
}

export default function HistoryJourney() {
  const { containerRef, progressRef, subscribe, isActive, scrollToProgress } =
    useScrollProgress();
  const canvasBoxRef = useRef<HTMLDivElement>(null);
  const aspect = useCanvasAspect(canvasBoxRef);
  const reducedMotion = useReducedMotion();

  // Capability is probed once. It can't change for the life of the page, and
  // re-probing would mean creating throwaway WebGL contexts repeatedly.
  const capability = useMemo(() => detectCapability(), []);

  const [tier, setTier] = useState<Tier>(capability.tier);
  const [gaveUp, setGaveUp] = useState(false);

  /**
   * How many times the 3D scene has thrown.
   *
   * ─── ONE BAD MOMENT USED TO END THE SCENE FOR THE WHOLE VISIT ─────────────
   * This was a boolean, so the FIRST error — ever, for any reason — retired
   * the 3D journey permanently. Most of what takes a WebGL scene down is
   * transient and not about this page at all: a GPU process restart, a driver
   * reset, a laptop switching graphics cards, a wake from sleep. Every one of
   * those is survivable, and every one of them was being treated as proof that
   * this device can't render the scene.
   *
   * So the first failure now buys a fresh attempt (the boundary below is keyed
   * on this count, which remounts it with a clean slate and rebuilds the
   * canvas). A second failure is taken at face value and the 2D timeline takes
   * over for good — the retry is bounded, so a genuinely broken device can't
   * be caught in a mount/crash loop.
   */
  const [crashCount, setCrashCount] = useState(0);
  const crashed = crashCount >= MAX_SCENE_ATTEMPTS;

  /**
   * Once mounted, the scene stays mounted.
   *
   * Unmounting when it scrolls out of view would destroy and rebuild the WebGL
   * context every time the user scrolls past — an expensive re-initialisation
   * (shader recompiles included) and a reliable way to hit the browser's cap
   * on live contexts. We wait for the first approach, then keep it.
   */
  const [hasEntered, setHasEntered] = useState(false);
  useEffect(() => {
    if (isActive) setHasEntered(true);
  }, [isActive]);


  /**
   * Where each achievement sits along the curve, reported by the scene.
   *
   * The progress rail needs these to fill by achievement rather than by raw
   * scroll distance, and it can't derive them without three.js — which this
   * file must not import (see the header). `setStopUs` is passed straight down
   * as the callback: a setState function is referentially stable, so the
   * scene's publishing effect doesn't re-fire on every render. One state
   * update per visit, in the same category as `tier` and `hasEntered`.
   */
  const [stopUs, setStopUs] = useState<number[] | null>(null);

  // `frugal` is in here as well as in useJourneyAvailable — the page gate means
  // this component should never mount for a Data Saver visitor, and a second
  // check costs a property read to guarantee the bytes are never requested even
  // if it somehow does.
  const canRender3D =
    capability.webgl &&
    !capability.frugal &&
    !reducedMotion &&
    !gaveUp &&
    !crashed;

  // Fetch the chunk on idle rather than on arrival, so a phone on mobile data
  // has it in cache before the section is reached — see warmSceneChunk. Gated
  // on exactly the conditions that decide whether it will ever be rendered, so
  // a device that will never show the scene never pays a byte for it.
  //
  // Placed after `canRender3D` and before the early return below, which is the
  // only spot that satisfies both constraints: it reads that value, and a hook
  // may not sit after a conditional return.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!canRender3D || hasEntered) return;
    return warmSceneChunk();
  }, [canRender3D, hasEntered]);

  // Every escape hatch lands here, and lands on nothing. The page's own closing
  // timeline is the full history in readable text and is always rendered, so
  // there is nothing for this component to substitute — see the header.
  if (!canRender3D) return null;

  // Scroll length is derived from the number of achievements, so adding a year
  // to achievements.ts lengthens the page automatically and keeps the pacing
  // of each stop identical.
  const viewportHeights =
    achievements.length * SCROLL_PER_STOP + SCROLL_PADDING * 2;

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: `${viewportHeights * 100}vh` }}
    >
      {/* ── The pinned pane ────────────────────────────────────────────────
          `100svh` — the SMALL viewport, i.e. the height with the URL bar
          showing. Of the three units this is the only STABLE one, and stability
          is what a pinned section needs above all:

            vh   the large viewport. Taller than the screen while the bar is up,
                 so the bottom of the scene sits below the fold — the original
                 bug, and what `h-screen` alone does.
            dvh  whatever is visible right now. Correct at every instant and
                 therefore constantly changing: on iOS the bar slides away and
                 back throughout a scroll, and since the canvas fills this box,
                 every one of those changes resized the canvas underneath the
                 scene. Tried it; it is what made the poles bounce.
            svh  constant. Never resizes mid-scroll, and never taller than what
                 is on screen, so nothing is ever cut off either.

          What svh costs is a strip of page below the canvas once the bar
          retracts — and that strip is `--band-deep`, which is the exact colour
          the scene clears to (see PALETTE_LIGHT_OVERRIDES.background). Against
          the ground plane at the bottom of frame it is a difference of a few
          RGB points in either theme, so the seam is not visible.

          `h-screen` stays as the fallback for browsers without `svh`, where it
          is precisely what they had before. */}
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ height: "100svh" }}
      >
        {/* The canvas is INSET below the fixed navbar (md+ only — the navbar is
            hidden on mobile). This is the structural fix for the label-under-
            navbar problem: because the 3D canvas and its DOM label overlay
            physically start below the navbar, a label floating above a stop can
            never render into the navbar's space. No per-frame clamping, no
            fighting the projection. The strip above shows the page background,
            which is the same deep navy as the scene, so the seam is invisible.

            This element is also what `useCanvasAspect` measures — the canvas
            fills it exactly, so its shape IS the framing problem the scene has
            to solve. */}
        <div
          ref={canvasBoxRef}
          className="absolute inset-x-0 bottom-0 top-0 md:top-[104px]"
        >
          <WebGLBoundary
            // Keyed on the attempt count so a failure remounts the boundary
            // with a clean slate rather than latching `hasError` forever.
            key={crashCount}
            fallback={<SceneMessage>Loading the timeline…</SceneMessage>}
            onError={() => setCrashCount((count) => count + 1)}
          >
            <Suspense fallback={<SceneMessage>Preparing the flight path…</SceneMessage>}>
              {hasEntered && (
                <JourneyScene
                  achievements={achievements}
                  progressRef={progressRef}
                  subscribe={subscribe}
                  tier={tier}
                  onDowngrade={setTier}
                  onGiveUp={() => setGaveUp(true)}
                  aspect={aspect}
                  reducedMotion={reducedMotion}
                  onStopUs={setStopUs}
                />
              )}
            </Suspense>
          </WebGLBoundary>
        </div>

        {/* Sits outside the canvas inset above, so it stays vertically centred
            on the viewport rather than on the canvas — the navbar strip would
            otherwise push it 52px low on desktop. */}
        <JourneyProgressRail
          progressRef={progressRef}
          subscribe={subscribe}
          stopUs={stopUs}
          achievements={achievements}
          scrollToProgress={scrollToProgress}
        />

        {/* Stays up for the whole journey. This is ~9 viewports in which the
            page never visibly moves, so "keep scrolling" is the section's
            operating instruction rather than a fact you learn once — and the
            scrollbar can't convey it, having reported steady downward motion
            the entire time the view sat still. It's inside the sticky
            container, so the journey ending removes it with no extra logic. */}
        <ScrollCue label="Scroll to follow the path" />
      </div>
    </div>
  );
}

/** Centred status text, shown while the scene loads or if it bails out. */
function SceneMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="font-mono text-caption uppercase tracking-[0.14em] text-fg-secondary">
        {children}
      </span>
    </div>
  );
}

