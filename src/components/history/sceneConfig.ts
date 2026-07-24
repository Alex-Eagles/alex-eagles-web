/**
 * sceneConfig.ts — every tunable number for the History journey, in one place.
 *
 * ─── WHY THIS FILE EXISTS ───────────────────────────────────────────────────
 * The 3D scene has a lot of magic numbers (curve amplitude, camera lag, glow
 * size, dot density…). Scattering them through components makes the scene
 * impossible to re-tune without hunting. They all live here instead.
 *
 * ─── THE PERFORMANCE CONTRACT ───────────────────────────────────────────────
 * This page was built to a hard rule: IT MUST NOT LAG, on desktop or mobile.
 * Three deliberate choices come from that rule, and they're worth knowing
 * before you change anything here:
 *
 *   1. NO REAL-TIME SHADOWS. Shadow maps re-render the scene from the light's
 *      point of view every frame. We use cheap fake "blob" shadows instead —
 *      a dark ellipse under each object. At this camera angle they're
 *      indistinguishable, and they cost essentially nothing.
 *
 *   2. NO BLOOM POST-PROCESSING. The glow around the travelling light is an
 *      additive sprite (a soft radial gradient billboard), not a real bloom
 *      pass. Bloom costs a full extra render of the whole screen every frame
 *      and is the single most common reason WebGL pages die on phones. On a
 *      DARK background a sprite is visually equivalent — which is exactly why
 *      the dark palette was chosen.
 *
 *   3. RENDER ON DEMAND. The canvas uses `frameloop="demand"`, so it draws
 *      ONLY while the scroll position is changing or the camera spring is
 *      still settling. A visitor reading a stop costs zero GPU and zero
 *      battery. This is the single biggest perf win on the page.
 *
 * ─── COLOURS ────────────────────────────────────────────────────────────────
 * three.js needs raw numbers, so it can't read the CSS variables in theme.css.
 * The values below MIRROR those tokens — if you change the brand colour in
 * theme.css, change it here too. (Anything rendered as DOM — labels, portraits,
 * flags — still reads the real CSS tokens and needs no duplication.)
 */

/** Scene palette. Mirrors the dark-mode tokens in `src/styles/theme.css`. */
export const PALETTE = {
  /** Page background — matches `--bg-primary` (#07091c). */
  background: 0x07091c,
  /** Ground plane, a touch lifted from the background so it reads as a surface. */
  ground: 0x0a0d26,
  /** Resting dot-grid colour — barely there until the light approaches. */
  dotIdle: 0x1e2258,
  /** Dot colour at full excitement, directly under the light. */
  dotLit: 0x4fd8ff,
  /** The path ahead of the light — dim indigo, matches `--brand`. */
  pathIdle: 0x2a2e7a,
  /** The path at the light — hot cyan. */
  pathLit: 0x6fe3ff,
  /** Core of the travelling light. Near-white so it reads as genuinely bright. */
  lightCore: 0xd8f6ff,
  /** Outer glow sprite tint. */
  lightGlow: 0x39c6ff,
  /** Props (people, poles) — pale grey, like the reference image. */
  prop: 0x9aa3c7,
  /** Props once the light has passed and the stop has dimmed. */
  propDimmed: 0x2c3160,
} as const;

export type ScenePalette = { [K in keyof typeof PALETTE]: number };

/**
 * Light-mode ENVIRONMENT overrides.
 *
 * ─── WHAT CHANGES AND WHAT DOESN'T ──────────────────────────────────────────
 * In light mode we only re-tint the scene's *background* layer — the page
 * backdrop, the ground plane, the resting (unlit) dot grid, the idle path and
 * the props. The travelling light and everything it lights up (`dotLit`,
 * `pathLit`, `lightCore`, `lightGlow`) are DELIBERATELY left as the same blues,
 * so the blue light and the blue dots trailing it read identically in both
 * themes — only the canvas they move across turns pale.
 *
 * Values come from the light-mode design tokens (the light column of the brand
 * colour-usage map / `theme.css`), so the 3D backdrop matches the rest of the
 * page in light mode:
 *   background  → --bg-primary  (#f7f8ff)  keeps the seam with the page invisible
 *   ground      → --bg-tertiary (#e8e8f9)  a touch deeper, so it reads as surface
 *   dotIdle     → --border-default (#d0d0ed) faint grid on the pale floor
 *   pathIdle    → --border-strong  (#b0b0d8) dim path, a shade more defined
 *   prop        → --text-secondary (#4a4a7a) dark figures, high contrast on white
 *   propDimmed  → --text-muted     (#9090ba) dimmed figures recede toward the bg
 */
const PALETTE_LIGHT_OVERRIDES = {
  background: 0xf7f8ff,
  ground: 0xe8e8f9,
  dotIdle: 0xd0d0ed,
  pathIdle: 0xb0b0d8,
  prop: 0x4a4a7a,
  propDimmed: 0x9090ba,
} satisfies Partial<ScenePalette>;

/** The full light-mode palette: dark blues kept, environment re-tinted pale. */
export const PALETTE_LIGHT: ScenePalette = {
  ...PALETTE,
  ...PALETTE_LIGHT_OVERRIDES,
};

/** Pick the palette for the active theme. Blues are identical either way. */
export function scenePalette(isDark: boolean): ScenePalette {
  return isDark ? PALETTE : PALETTE_LIGHT;
}

/**
 * Path layout. The curve is GENERATED from these — see `journeyCurve.ts`.
 * Stops are laid out marching into -Z, swinging left and right so the light
 * genuinely has curves to bank through (which is the whole point of the page).
 */
export const LAYOUT = {
  /** Distance along -Z between consecutive stops. */
  stopSpacing: 26,
  /** How far left/right the path swings. Bigger = tighter, more dramatic turns. */
  lateralAmplitude: 15,
  /**
   * Controls how quickly the path alternates sides. Deliberately not a clean
   * multiple of π, so the sequence of bends never falls into a visible
   * repeating rhythm over 10 stops.
   */
  lateralFrequency: 1.15,
  /** Straight run-in before the first stop and run-out after the last. */
  leadLength: 20,
  /** Sideways offset from the path centre to the flag pole / crowd / portrait. */
  stopOffset: 7.5,
} as const;

/**
 * Camera rig — the "physics" of the chase cam.
 *
 * The camera is a critically-damped spring chasing a target that sits behind
 * and above the light. Critically damped (ζ = 1) is the important part: it
 * catches up as fast as possible WITHOUT overshooting and wobbling, which is
 * what makes the motion read as a heavy physical camera rather than a lerp.
 *
 * Banking uses the real coordinated-turn relationship, θ = atan(v²·κ / g):
 * the tighter the curve (κ) and the faster the light (v), the harder the
 * camera rolls into it — the same physics that tilts an aircraft through a
 * turn, which felt like the right language for a UAV team's history page.
 */
export const CAMERA = {
  /** How far BEHIND the light the camera sits, along the path tangent. */
  followDistance: 20,
  /** How far ABOVE the path. Sets the isometric-ish downward angle. */
  height: 13,
  /** Camera aims this far AHEAD of the light, so you see what's coming. */
  lookAhead: 12,
  /**
   * Spring stiffness (rad/s). Higher = tighter, more responsive chase;
   * lower = more lag and float. 6 gives a perceptible, deliberate drag.
   */
  stiffness: 6,
  /** Damping ratio. 1 = critically damped — fast settle, ZERO overshoot. */
  damping: 1,
  /** Hard cap on bank angle (radians, ≈23°). Keeps motion sickness in check. */
  maxBank: 0.4,
  /**
   * Scales v²·κ before atan(). This is the one number that decides whether
   * banking reads as expressive or as permanently pinned at the limit.
   *
   * Worked through with realistic values — a brisk scroll is about
   * v ≈ 110 units/s, and the tightest bends here are about κ ≈ 0.03:
   *
   *   gentle  (v=60,  κ=0.02) → atan(0.065) ≈ 0.065 rad ≈  3.7°
   *   brisk   (v=110, κ=0.03) → atan(0.327) ≈ 0.316 rad ≈ 18°
   *   extreme                 → clamped at maxBank        ≈ 23°
   *
   * That spans the useful range, so the roll actually varies with how fast
   * you're scrolling and how tight the bend is. An earlier version multiplied
   * atan()'s result by a large gain, which saturated at maxBank almost
   * constantly and threw away the entire effect.
   */
  bankScale: 0.0009,
  /** Field of view. Narrower on phones so stops still read on a small screen. */
  fov: 42,
  fovMobile: 55,
  /**
   * Below this speed (units/sec) the camera stops banking. Without it, the
   * light creeping at near-zero speed produces jittery micro-rolls.
   */
  bankSpeedFloor: 0.6,
} as const;

/** Travelling light + its glow. */
export const LIGHT = {
  /** Radius of the solid core sphere. */
  coreRadius: 0.55,
  /** Size of the additive glow billboard (our cheap stand-in for bloom). */
  glowSize: 9,
  /** How far back along the path the bright trail fades out, in world units. */
  trailLength: 34,
  /** Light hovers slightly above the ground plane. */
  hoverHeight: 0.9,
} as const;

/**
 * Stop props. `peopleBase` figures always stand at a stop, plus one extra per
 * award won that year — so a visitor can literally see that 2025 was bigger
 * than 2023 without reading a word.
 */
export const STOP = {
  // Tall enough that the flag (flown at the pole TOP) rides ABOVE the image
  // frames, so the two never intersect — the flags occupy the band between the
  // frame tops and the floating label. If you shorten this, the flags drop into
  // the photos; if you lengthen it, raise LABEL.heightAbovePole to keep the
  // label from colliding with the flag. See the flag block in StopOverlays.
  poleHeight: 7.2,
  poleRadius: 0.09,
  personHeight: 1.7,
  personRadius: 0.28,
  /** Figures at a stop with no awards (2013, the founding). */
  peopleBase: 3,
  /** Additional figures per award won. */
  peoplePerAward: 2,
  /** Radius of the crowd cluster around the flag pole. */
  crowdRadius: 2.6,
  /**
   * How close (world units) the light must be for a stop to be fully lit.
   * Also drives the reversible fade — see `stopIntensity` in journeyCurve.ts.
   */
  activationRange: 30,
} as const;

/**
 * Quality tiers, chosen at runtime by the FPS probe in `usePerfTier.ts`.
 *
 * The probe measures real frames on the real device rather than guessing from
 * the user-agent — a 2019 flagship and a 2024 budget phone can report the same
 * "mobile" and perform nothing alike. Tiers only ever reduce COST, never
 * change layout or content, so the page looks like itself at every tier.
 */
export interface QualitySettings {
  /** Device-pixel-ratio ceiling. The strongest single perf lever there is:
   *  dropping dpr 2 → 1.5 cuts pixels drawn by ~44%. */
  maxDpr: number;
  /** Dot grid half-extent, in dots. 40 → an 81×81 grid. */
  dotGridExtent: number;
  /** Spacing between dots in world units. */
  dotSpacing: number;
  /** Radial segments on the path tube. */
  pathRadialSegments: number;
  /** Tube segments per world unit of path length. */
  pathSegmentsPerUnit: number;
  /** Sphere detail for the light core and figure heads. */
  sphereDetail: number;
  /** Whether to draw the fake blob shadows under props. */
  blobShadows: boolean;
  /** Enable MSAA. Off on weak devices — it's a real cost for a subtle gain. */
  antialias: boolean;
}

export const QUALITY: Record<"high" | "medium" | "low", QualitySettings> = {
  high: {
    maxDpr: 2,
    dotGridExtent: 40,
    dotSpacing: 1.7,
    pathRadialSegments: 8,
    pathSegmentsPerUnit: 2.4,
    sphereDetail: 2,
    blobShadows: true,
    antialias: true,
  },
  medium: {
    maxDpr: 1.5,
    dotGridExtent: 28,
    dotSpacing: 2.1,
    pathRadialSegments: 6,
    pathSegmentsPerUnit: 1.6,
    sphereDetail: 1,
    blobShadows: true,
    antialias: false,
  },
  low: {
    maxDpr: 1,
    dotGridExtent: 20,
    dotSpacing: 2.6,
    pathRadialSegments: 4,
    pathSegmentsPerUnit: 1,
    sphereDetail: 0,
    blobShadows: false,
    antialias: false,
  },
};

/**
 * Image frames — one per award, arranged around the flag pole.
 *
 * `minPathClearance` is the important one. Frames are laid out symmetrically
 * around the pole, so the more awards a year won, the further the leftmost
 * frame reaches back toward the path. At a fixed pole offset, 2025's three
 * frames would put the innermost one at 7.5 − 8.8 = −1.3 — i.e. straight
 * through the light's path. So the pole offset ADAPTS to the frame count
 * (see `poleOffsetFor`), keeping every frame at least this far clear of the
 * line no matter how big the year was.
 */
export const FRAME = {
  /** Gap between adjacent frames, in world units. */
  spacing: 4.4,
  /** Height of a frame's centre above the ground. Kept low enough that the
   *  frame's bottom edge floats just above the ground and its top stays clear
   *  below the raised flags (see STOP.poleHeight). */
  height: 3.3,
  /** Minimum distance any frame must keep from the path. */
  minPathClearance: 3.6,
} as const;

/**
 * The floating achievement label — ALL its tunable knobs in one place.
 *
 * ─── TO RESIZE THE TEXT ─────────────────────────────────────────────────────
 * Two independent levers:
 *   • `distanceFactor` scales the WHOLE label uniformly. SMALLER = BIGGER on
 *     screen (it's how far away drei pretends the label is). This is the fast
 *     "make everything bigger/smaller" dial.
 *   • the individual `*Size` values (px) tune each line relative to the others.
 *
 * ─── TO MOVE IT CLOSER TO / FURTHER FROM THE FLAGS ──────────────────────────
 *   • `heightAbovePole` is how far (world units) the label floats above the
 *     pole top. Smaller = closer to the flags. It's bottom-anchored, so the
 *     block always grows upward from here and never dips onto the flags.
 */
export const LABEL = {
  /** Whole-label scale. Smaller ⇒ larger on screen. */
  distanceFactor: 15,
  /** World height of the label's baseline above the pole top. Small because the
   *  pole is now tall (see STOP.poleHeight); this sits the label just above the
   *  flag that flies from the pole top. */
  heightAbovePole: 0.8,
  /** Award headline lines — the big, bold text. */
  titleSize: 28,
  /** "ACHIEVEMENT NN" eyebrow. */
  eyebrowSize: 13,
  /** The year. */
  yearSize: 18,
  /** Competition name under each award. */
  competitionSize: 16,
  /** Founding-year headline ("Started the team"). */
  foundingTitleSize: 35,
  /** Founding-year description. */
  blurbSize: 15,
} as const;

/** Scroll length per stop, in viewport heights. Sets the pace of the journey. */
export const SCROLL_PER_STOP = 0.85;

/** Extra scroll at the start and end so the first/last stop aren't clipped. */
export const SCROLL_PADDING = 0.6;
