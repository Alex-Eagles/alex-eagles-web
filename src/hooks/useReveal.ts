import { useEffect, type RefObject } from "react";
import { useReducedMotion } from "./useReducedMotion";

const REVEALED = "is-revealed";

/**
 * useReveal — scroll-triggered entrance animation for a section.
 *
 * Mark any descendant with `data-reveal` (and optionally `data-reveal-delay`,
 * in milliseconds, to stagger it) and it starts faded/offset, then settles as
 * it scrolls into view. The paired CSS lives in global.css.
 *
 * Notes on the behaviour, since the details matter:
 *  - One-shot. An element that has played is unobserved, so the page never
 *    re-animates when you scroll back up — re-triggering reads as a glitch.
 *  - The `-12%` bottom margin holds the reveal until the element is properly
 *    on screen rather than firing the instant its first pixel appears.
 *  - There's a timeout backstop: if the observer never fires (odd viewport,
 *    element already past the fold on load), content still becomes visible.
 *    Invisible content is a far worse failure than an un-animated reveal.
 *  - Under `prefers-reduced-motion` everything is shown at once, no observer.
 */
export function useReveal(rootRef: RefObject<HTMLElement | null>): void {
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (els.length === 0) return;

    const show = (el: HTMLElement) => {
      const delay = el.dataset.revealDelay;
      if (delay) el.style.transitionDelay = `${delay}ms`;
      el.classList.add(REVEALED);
    };

    if (prefersReduced || !("IntersectionObserver" in window)) {
      els.forEach(show);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          show(entry.target as HTMLElement);
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );

    els.forEach((el) => io.observe(el));
    const backstop = window.setTimeout(() => els.forEach(show), 3500);

    return () => {
      io.disconnect();
      window.clearTimeout(backstop);
    };
  }, [rootRef, prefersReduced]);
}
