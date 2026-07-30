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
  /**
   * True on a touch screen. Not a proxy for "small" — a tablet is coarse and
   * large — but for "the GPU is in something thermally limited and running off
   * a battery", which is what decides how many pixels it is fair to shade.
   */
  coarsePointer: boolean;
  /**
   * True when the visitor has asked not to be sent heavy things, or is on a
   * connection that cannot carry them. See `detectFrugalConnection`.
   */
  frugal: boolean;
}

/**
 * Has this visitor asked us to go easy on their data, or is their connection
 * too slow to carry the scene?
 *
 * The 3D journey is a ~230KB gzipped chunk that then has to be parsed and have
 * its shaders compiled. That is a fine trade on a wifi connection and a bad one
 * on a metered 3G plan, and the browser will tell us which we are on if asked.
 *
 * ─── TWO SIGNALS, ONE OF WHICH IS AN EXPLICIT REQUEST ───────────────────────
 *   · `saveData` is Data Saver being on. It is not an inference about the
 *     network — it is the visitor having gone into settings and asked sites not
 *     to send them large optional things. A decorative WebGL scene is exactly
 *     what that setting is for, and honouring it is not a judgement call.
 *   · `effectiveType` is the browser's own round-trip-time and bandwidth
 *     estimate, bucketed. `2g` and `slow-2g` mean the chunk would take long
 *     enough that the visitor reaches the section, sees "Preparing the flight
 *     path…", and scrolls past before anything renders — strictly worse than
 *     the timeline they would otherwise have been reading.
 *
 * `3g` is deliberately NOT included. It is slow but survivable, the chunk is
 * fetched well before the section is reached, and cutting it would take the
 * page's centrepiece away from a large share of real mobile visitors.
 *
 * Both live on a non-standard API that Safari and Firefox do not implement, so
 * both are optional and absence means "no reason to hold back" — the default
 * has to be the full experience, or every Safari visitor would be downgraded by
 * a feature detection failing.
 */
function detectFrugalConnection(): boolean {
  if (typeof navigator === "undefined") return false;

  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;

  if (!connection) return false;
  if (connection.saveData) return true;

  return (
    connection.effectiveType === "2g" || connection.effectiveType === "slow-2g"
  );
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

/**
 * The static half of the probe, cached for the life of the page.
 *
 * Neither answer can change without a reload — the browser does not grow WebGL2
 * support or CPU cores mid-visit — and the WebGL half is not free: it builds a
 * canvas, creates a real GL context and throws it away. Two callers now ask
 * (the page, to decide whether the journey exists at all, and the journey
 * itself), and each React StrictMode double-render would ask again, so an
 * uncached probe is several throwaway contexts against a browser limit of
 * roughly sixteen. See detectWebGL for why a leaked probe context is a black
 * screen that only reproduces after a few navigations.
 */
let staticProbe: {
  webgl: boolean;
  tier: Tier;
  coarsePointer: boolean;
} | null = null;

/**
 * One-shot capability check. Safe to call during render, and safe to call from
 * more than one component.
 */
export function detectCapability(): Capability {
  staticProbe ??= {
    webgl: detectWebGL(),
    tier: detectInitialTier(),
    coarsePointer:
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
  };

  // NOT cached: both of these genuinely can change mid-visit — the visitor can
  // flip the OS motion setting, and a phone can walk off wifi onto 2G — and
  // both are cheap property reads.
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return { ...staticProbe, reducedMotion, frugal: detectFrugalConnection() };
}
