/**
 * useScrollProgress — turns page scroll into the single number `u` (0 → 1)
 * that drives the entire History journey.
 *
 * ─── WHY THIS ISN'T REACT STATE ─────────────────────────────────────────────
 * The obvious implementation is `const [progress, setProgress] = useState(0)`
 * updated on scroll. Don't. That re-renders the React tree on every scroll
 * event — up to 60 times a second, every one of them reconciling components
 * whose output didn't meaningfully change. On a phone that alone can cost more
 * than the 3D rendering does.
 *
 * Instead progress is written to a REF, and interested parties are notified
 * through a tiny subscription. React never re-renders while you scroll; the
 * 3D scene simply reads `ref.current` inside its animation frame. The only
 * React state here is `isPinned`, which flips at most twice per visit.
 *
 * ─── WHY rAF-COALESCED ──────────────────────────────────────────────────────
 * Browsers can fire scroll events faster than they paint, especially on
 * high-refresh trackpads. Reading layout (`getBoundingClientRect`) on every
 * one of those is wasted work and risks layout thrash. We coalesce to one
 * measurement per animation frame — the most the screen can possibly show.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface ScrollProgress {
  /** Attach to the tall scroll container that the scene is pinned inside. */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Live progress 0 → 1. Read `.current` — it does NOT trigger re-renders. */
  progressRef: React.MutableRefObject<number>;
  /** Subscribe to changes. Returns an unsubscribe function. */
  subscribe: (listener: () => void) => () => void;
  /** True while the pinned scene is on screen. Used to skip work when it isn't. */
  isActive: boolean;
}

export function useScrollProgress(): ScrollProgress {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const listenersRef = useRef(new Set<() => void>());
  const frameRef = useRef<number | null>(null);
  const [isActive, setIsActive] = useState(false);

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /** Measure scroll position and publish it. One call per frame, maximum. */
    const measure = () => {
      frameRef.current = null;
      const rect = container.getBoundingClientRect();

      // The container is several viewports tall; the scene is sticky inside it.
      // Scrollable distance is everything beyond the one viewport the sticky
      // element occupies.
      const scrollable = rect.height - window.innerHeight;
      const next =
        scrollable > 0 ? Math.min(Math.max(-rect.top / scrollable, 0), 1) : 0;

      // Skip the notification if nothing meaningfully moved. Sub-pixel scroll
      // noise would otherwise wake the renderer for an invisible change.
      if (Math.abs(next - progressRef.current) < 0.00001) return;

      progressRef.current = next;
      listenersRef.current.forEach((listener) => listener());
    };

    const onScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(measure);
    };

    // Only listen while the scene is actually on screen. Scrolling through the
    // rest of the site costs nothing at all.
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting);
        if (entry.isIntersecting) measure();
      },
      { rootMargin: "100px" },
    );
    observer.observe(container);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    measure();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return { containerRef, progressRef, subscribe, isActive };
}
