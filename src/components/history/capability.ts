/**
 * capability.ts — device probing, deliberately free of any three.js imports.
 *
 * ─── WHY THIS IS A SEPARATE FILE FROM usePerfTier.ts ────────────────────────
 * This is not organisational tidiness — it's load-bearing for the bundle.
 *
 * These checks run EAGERLY, before we decide whether to load the 3D scene at
 * all. They therefore live in the main bundle. `useAdaptiveQuality` runs
 * INSIDE the canvas and imports from @react-three/fiber, so it belongs in the
 * lazily-loaded chunk.
 *
 * When both lived in one module, importing `detectCapability` from the page
 * pulled @react-three/fiber — and therefore all of three.js — into the main
 * bundle. The lazy import still "worked", but three.js was already downloaded
 * on every page of the site, which is precisely what the lazy boundary exists
 * to prevent. A single import in a shared module quietly cost ~300KB on the
 * homepage.
 *
 * KEEP THIS FILE FREE OF three.js / @react-three IMPORTS. If you add one, the
 * regression is silent: everything still works, it just gets slower for
 * everyone, everywhere.
 */

export type Tier = "high" | "medium" | "low";

/** Everything that can make us skip WebGL entirely and render the 2D timeline. */
export interface Capability {
  /** False when WebGL2 can't be created — old, locked-down or blocked browsers. */
  webgl: boolean;
  /** True when the visitor asked their OS to minimise motion. */
  reducedMotion: boolean;
  /** Best initial guess at how much this device can handle. */
  tier: Tier;
}

/**
 * Can we get a WebGL2 context?
 *
 * WebGL2 specifically, not WebGL1: three.js dropped its WebGL1 renderer in
 * r163, so a device that only offers WebGL1 would pass a naive `webgl` check
 * and then fail at first render — a black box with a console error, which is
 * far worse than cleanly showing the 2D timeline.
 *
 * The throwaway context is explicitly released. That matters: browsers cap
 * simultaneous live contexts (often ~16), and a leaked probe context can make
 * the REAL canvas fail to initialise later — a black screen that reproduces
 * only after a few navigations and is miserable to debug.
 */
function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Static best-guess tier, from signals that actually correlate with GPU class.
 *
 * Note what this deliberately does NOT do: count requestAnimationFrame
 * callbacks. rAF fires at the DISPLAY's refresh rate, so on an idle page a
 * decade-old phone and a workstation both report a confident 60fps — you'd be
 * measuring the monitor, not the GPU. Real measurement only becomes possible
 * once there's real work to time, which is `useAdaptiveQuality`'s job.
 *
 * Deliberately conservative: starting one tier too low is invisible, while
 * starting too high means the opening seconds stutter before the adaptive
 * pass can correct it — and that's the first impression.
 */
function detectInitialTier(): Tier {
  if (typeof window === "undefined") return "medium";

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };

  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 500;

  // Clear low-end signals: few cores or little RAM.
  if (cores <= 4 || memory <= 2) return "low";

  // Phones and tablets start at medium regardless of reported specs — they're
  // thermally limited, so sustained load matters more than peak capability.
  if (coarsePointer || smallScreen) return "medium";

  if (cores >= 8 && memory >= 8) return "high";
  return "medium";
}

/** One-shot capability check. Safe to call during render. */
export function detectCapability(): Capability {
  const webgl = detectWebGL();
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return { webgl, reducedMotion, tier: detectInitialTier() };
}
