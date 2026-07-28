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
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ─── WHY THIS USED TO FIRE ON PERFECTLY HEALTHY DEVICES ─────────────────────
 * ═══════════════════════════════════════════════════════════════════════════
 * The measurement here is wall-clock time BETWEEN frames. Under a normal
 * always-on render loop that is a fair proxy for how long a frame took. Under
 * `frameloop="demand"` — which this scene uses, and which is its single biggest
 * performance win — it is not. A demand-driven canvas draws only when someone
 * calls invalidate(), so the gap between two frames conflates two completely
 * different things:
 *
 *     "this frame was expensive"        ← what we want to detect
 *     "nobody asked for a frame yet"    ← says nothing about the GPU
 *
 * The old thresholds turned that ambiguity into a bug with three sharp edges:
 *
 *   1. THE 45fps BAR WAS ABOVE SOME DISPLAYS' NATIVE RATE. A frame was called
 *      slow at >22ms, but a 30Hz panel — or a laptop in battery-saver, or a
 *      browser that has dropped to half v-sync under load — delivers 33ms
 *      frames when it is working perfectly. Every single frame counted as
 *      slow, nothing ever eroded the streak, and 24 of them arrive in under a
 *      second. Two downgrades and a give-up all landed inside ~2.5s of
 *      scrolling. The scene didn't fail on those machines; it was healthy and
 *      got switched off.
 *
 *   2. NO WARM-UP. The first frames of a WebGL scene compile shaders, upload
 *      textures and build geometry. They are always slow, they are slow
 *      exactly once, and they were being counted.
 *
 *   3. THE STREAK WAS TOO SHORT TO MEAN "SUSTAINED". 24 frames is under half a
 *      second — comfortably inside one thermal blip, one garbage collection,
 *      or one image decode.
 *
 * That combination is why the fallback appeared to strike at random: it needed
 * a couple of seconds of *apparent* slowness, and several ordinary conditions
 * supply that without the device being slow at all.
 *
 * ─── WHAT IT DOES NOW ───────────────────────────────────────────────────────
 * It calibrates against the device instead of against a fixed number. A frame
 * counts as slow only when it is worse than BOTH:
 *
 *   • an absolute floor (~25fps), which no healthy display sits below, and
 *   • a multiple of the best frame time this device has actually demonstrated
 *
 * The second test is what makes a 30Hz panel safe: its best frame is 33ms, so
 * its own bar moves out to ~60ms, and it is judged against what it has proven
 * it can do rather than against a desktop. Add a warm-up period and a streak
 * long enough to outlast a hitch, and the remaining trigger is what was
 * intended all along — a device that is genuinely, continuously unable to draw
 * this scene.
 */

import { useCallback, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Tier } from "./capability";

const TIER_ORDER: Tier[] = ["high", "medium", "low"];

/**
 * Absolute floor. Below ~25fps is bad on any display, whatever its refresh
 * rate. Deliberately well clear of 33.3ms so a 30Hz panel — and a 60Hz one
 * that has halved to 30 under v-sync — never register as slow at all.
 */
const ABSOLUTE_SLOW_MS = 40;

/**
 * ...and it must also be this much worse than the best this device has shown
 * us. This is the term that calibrates to the hardware: a machine is compared
 * against its own demonstrated capability, not against a desktop's.
 */
const RELATIVE_SLOW_FACTOR = 1.8;

/**
 * Frames slower than this are demand-render pauses, not slow renders — nobody
 * asked for a frame. Raised well above the old value because the gap after a
 * scroll stops is unbounded, and anything we misclassify here is pure noise.
 */
const IDLE_FRAME_MS = 200;

/**
 * Consecutive slow frames before acting. At ~25fps this is roughly 3.5 seconds
 * of unbroken slowness — long enough that a GC pause, a texture decode or a
 * thermal blip cannot reach it.
 */
const SLOW_STREAK_LIMIT = 90;

/** A comfortable frame erodes this much of the streak: recovery beats decay. */
const STREAK_EROSION = 4;

/**
 * Frames to ignore after mount. Shader compilation, texture upload and the
 * first geometry build all land here, they are slow by nature, and they happen
 * once. Judging a device on them measures start-up cost, not capability.
 */
const WARMUP_FRAMES = 60;

/** Below this a reading is implausible as a real frame; don't let it set the floor. */
const MIN_PLAUSIBLE_MS = 4;

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
  const warmupRef = useRef(0);
  /** Best (smallest) plausible frame gap seen — this device's demonstrated floor. */
  const bestRef = useRef(Number.POSITIVE_INFINITY);

  const reset = useCallback(() => {
    slowStreakRef.current = 0;
    lastTimeRef.current = 0;
    // Keep `bestRef`: a downgrade doesn't change what the display can do, and
    // re-learning the floor from scratch would spend the next tier's warm-up
    // judging the device against nothing.
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

    // Warm-up: measure nothing until the scene has stopped doing its one-time
    // start-up work. Counted in real frames, so it can't be skipped by a
    // device that renders slowly.
    if (warmupRef.current < WARMUP_FRAMES) {
      warmupRef.current += 1;
      if (delta >= MIN_PLAUSIBLE_MS) {
        bestRef.current = Math.min(bestRef.current, delta);
      }
      return;
    }

    if (delta >= MIN_PLAUSIBLE_MS) {
      bestRef.current = Math.min(bestRef.current, delta);
    }

    // Slow means worse than an absolute floor AND worse than a clear multiple
    // of what this device has already proven it can do. A display running
    // healthily at its own native rate can never satisfy the second test.
    const relativeBar = bestRef.current * RELATIVE_SLOW_FACTOR;
    const slowBar = Math.max(ABSOLUTE_SLOW_MS, relativeBar);

    if (delta > slowBar) {
      slowStreakRef.current += 1;
    } else {
      // Any comfortable frame erodes the streak: we only act on SUSTAINED
      // slowness, not the occasional expensive frame.
      slowStreakRef.current = Math.max(0, slowStreakRef.current - STREAK_EROSION);
      return;
    }

    if (slowStreakRef.current < SLOW_STREAK_LIMIT) return;

    const index = TIER_ORDER.indexOf(tier);
    if (index < TIER_ORDER.length - 1) {
      reset();
      // Give the new tier its own warm-up. Changing dpr rebuilds the drawing
      // buffer and changing the grid rebuilds geometry, so the frames straight
      // after a downgrade are start-up frames again — and counting them is how
      // one downgrade used to cascade into giving up entirely.
      warmupRef.current = 0;
      onDowngrade(TIER_ORDER[index + 1]);
    } else {
      // Already at the cheapest tier and still struggling — stop rendering 3D
      // and hand over to the 2D timeline.
      settledRef.current = true;
      onGiveUp();
    }
  });
}
