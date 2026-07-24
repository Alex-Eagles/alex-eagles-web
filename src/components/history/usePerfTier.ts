/**
 * usePerfTier.ts — real, measured adaptation once the scene is rendering.
 *
 * This module imports @react-three/fiber, so it is only ever reachable from
 * inside the lazily-loaded 3D chunk. The eager, three-free device probing
 * lives in `capability.ts` — see that file for why the split matters to the
 * bundle. Don't merge them back together.
 *
 * ─── PHASE 2 OF THE PERF STRATEGY ───────────────────────────────────────────
 * `capability.ts` makes an educated guess before the first frame. This is the
 * part that actually MEASURES, by timing real frames while the GPU is doing
 * real work, and stepping quality down when the device can't keep up.
 *
 * If it's already at the cheapest tier and still struggling, it gives up and
 * the page falls back to the 2D timeline. Nobody gets a slideshow.
 */

import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Tier } from "./capability";

const TIER_ORDER: Tier[] = ["high", "medium", "low"];

/** Frame budget in ms. Above this the device is missing its refresh target. */
const SLOW_FRAME_MS = 22; // ≈45fps
/** Consecutive slow frames before we act. Absorbs one-off hitches (GC, decode). */
const SLOW_STREAK_LIMIT = 24;
/** Frames slower than this are ignored — they're idle gaps, not slow renders. */
const IDLE_FRAME_MS = 120;

/**
 * Watches real frame times while the scene renders and steps quality down when
 * the device can't keep up. Must be used INSIDE the R3F canvas.
 *
 * Downgrades are one-way. Oscillating between tiers because the framerate sits
 * right on a threshold would be far more distracting than simply running at
 * the lower tier.
 */
export function useAdaptiveQuality(
  tier: Tier,
  onDowngrade: (next: Tier) => void,
  onGiveUp: () => void,
) {
  const lastTimeRef = useRef(0);
  const slowStreakRef = useRef(0);
  const settledRef = useRef(false);

  const reset = useCallback(() => {
    slowStreakRef.current = 0;
    lastTimeRef.current = 0;
  }, []);

  useFrame(() => {
    if (settledRef.current) return;

    const now = performance.now();
    const last = lastTimeRef.current;
    lastTimeRef.current = now;

    if (last === 0) return;

    const delta = now - last;

    // With frameloop="demand" the gap between renders is huge whenever the
    // user pauses scrolling. Those gaps say nothing about GPU speed — discard
    // them, or every reading pause would look like a performance collapse.
    if (delta > IDLE_FRAME_MS) {
      slowStreakRef.current = 0;
      return;
    }

    if (delta > SLOW_FRAME_MS) {
      slowStreakRef.current += 1;
    } else {
      // Any comfortable frame erodes the streak: we only act on SUSTAINED
      // slowness, not the occasional expensive frame.
      slowStreakRef.current = Math.max(0, slowStreakRef.current - 2);
      return;
    }

    if (slowStreakRef.current < SLOW_STREAK_LIMIT) return;

    const index = TIER_ORDER.indexOf(tier);
    if (index < TIER_ORDER.length - 1) {
      reset();
      onDowngrade(TIER_ORDER[index + 1]);
    } else {
      // Already at the cheapest tier and still struggling — stop rendering 3D
      // and hand over to the 2D timeline.
      settledRef.current = true;
      onGiveUp();
    }
  });
}
