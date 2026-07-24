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
 */

import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useScrollProgress } from "./useScrollProgress";
// From capability.ts, NOT usePerfTier.ts — the latter imports three.js, which
// would defeat the lazy boundary below and ship ~300KB to every page.
import { detectCapability, type Tier } from "./capability";
import { SCROLL_PER_STOP, SCROLL_PADDING } from "./sceneConfig";
import WebGLBoundary from "./WebGLBoundary";
import Timeline2D from "./Timeline2D";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { achievements } from "@/data/achievements";

// three.js is pulled in only when we actually mount the scene.
const JourneyScene = lazy(() => import("./JourneyScene"));

/** Tracks whether we're on a small/touch screen, for FOV and layout. */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

export default function HistoryJourney() {
  const { containerRef, progressRef, subscribe, isActive } = useScrollProgress();
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();

  // Capability is probed once. It can't change for the life of the page, and
  // re-probing would mean creating throwaway WebGL contexts repeatedly.
  const capability = useMemo(() => detectCapability(), []);

  const [tier, setTier] = useState<Tier>(capability.tier);
  const [gaveUp, setGaveUp] = useState(false);
  const [crashed, setCrashed] = useState(false);

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

  const canRender3D =
    capability.webgl && !reducedMotion && !gaveUp && !crashed;

  // Every escape hatch lands here: the full history, as readable text.
  if (!canRender3D) return <Timeline2D isFallback />;

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
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* The canvas is INSET below the fixed navbar (md+ only — the navbar is
            hidden on mobile). This is the structural fix for the label-under-
            navbar problem: because the 3D canvas and its DOM label overlay
            physically start below the navbar, a label floating above a stop can
            never render into the navbar's space. No per-frame clamping, no
            fighting the projection. The strip above shows the page background,
            which is the same deep navy as the scene, so the seam is invisible. */}
        <div className="absolute inset-x-0 bottom-0 top-0 md:top-[104px]">
          <WebGLBoundary
            fallback={<SceneMessage>Loading the timeline…</SceneMessage>}
            onError={() => setCrashed(true)}
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
                  isMobile={isMobile}
                  reducedMotion={reducedMotion}
                />
              )}
            </Suspense>
          </WebGLBoundary>
        </div>

        <ScrollHint />
      </div>
    </div>
  );
}

/** Centred status text, shown while the scene loads or if it bails out. */
function SceneMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="font-mono text-caption uppercase tracking-[0.14em] text-fg-muted">
        {children}
      </span>
    </div>
  );
}

/**
 * A quiet nudge that this section is scroll-driven.
 *
 * Pinned sections are genuinely confusing without one — the page stops moving
 * while the scene changes, and a visitor can reasonably conclude it's stuck.
 * It fades out on its own once they've started, so it never nags.
 */
function ScrollHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setVisible(false);
    window.addEventListener("scroll", onScroll, { passive: true, once: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <span className="font-mono text-caption uppercase tracking-[0.16em] text-fg-muted">
        Scroll to follow the path
      </span>
    </div>
  );
}
