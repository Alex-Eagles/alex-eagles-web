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
  /** Props (the flag poles) — pale grey, like the reference image. */
  prop: 0x9aa3c7,
  /** Props once the light has passed and the stop has dimmed. */
  propDimmed: 0x2c3160,
} as const;

export type ScenePalette = { [K in keyof typeof PALETTE]: number };

/**
 * Light-mode overrides — the ENVIRONMENT *and* the light itself.
 *
 * ─── THE ENVIRONMENT HALF ───────────────────────────────────────────────────
 * Values come from the light-mode design tokens (the light column of the brand
 * colour-usage map / `theme.css`), so the 3D backdrop matches the rest of the
 * page in light mode:
 *   background  → --bg-primary  (#f7f8ff)  keeps the seam with the page invisible
 *   ground      → --bg-tertiary (#e8e8f9)  a touch deeper, so it reads as surface
 *   dotIdle     → --border-default (#d0d0ed) faint grid on the pale floor
 *   pathIdle    → --border-strong  (#b0b0d8) dim path, a shade more defined
 *   prop        → --text-secondary (#4a4a7a) dark figures, high contrast on white
 *   propDimmed  → --text-muted     (#9090ba) dimmed figures recede toward the bg
 *
 * ─── THE LIGHT HALF, AND WHY IT USED TO BE LEFT ALONE ───────────────────────
 * This block once deliberately kept the travelling light and everything it
 * paints (`lightCore`, `lightGlow`, `pathLit`, `dotLit`) at their dark-mode
 * blues, on the theory that the light should "read identically in both themes
 * — only the canvas turns pale". That reasoning does not survive contact with
 * a pale canvas.
 *
 * Those four are all HOT values: a near-white core (#d8f6ff) and hot cyans
 * (#4fd8ff / #6fe3ff). They were picked to be the brightest thing in a
 * near-black scene, and brightness is the entire mechanism by which they read
 * as light. Put a near-white core on a #f7f8ff floor and there is nothing left
 * to see — you are drawing white on white. The light didn't get subtle in light
 * mode; it disappeared, and its trail went with it.
 *
 * On a pale ground the intensity axis simply flips. A bright source is
 * perceived by how far it departs from the surface around it, and on white the
 * only available direction is DOWN — deeper and more saturated. So light mode
 * gets the same hue family carried by depth instead of by brightness, anchored
 * on the page's own light-mode blue (`--sky` #1d4ed8) so the scene's light
 * belongs to the same system as the timeline markers on the page below it.
 *
 * The intensity ORDER is preserved exactly, just mirrored:
 *   dark  → core #d8f6ff (near-white) > pathLit #6fe3ff > dotLit #4fd8ff > idle
 *   light → core #1436a8 (deepest)    < pathLit #1a48c8 < dotLit #2358d4 < idle
 * So the trail is still hotter than the floor dots, and the core is still the
 * most intense point on the screen. Only the direction of "more" changed.
 *
 * Contrast against the pale floor: core ≈ 9.3:1 on the page background, path
 * ≈ 7:1 and dots ≈ 5.5:1 on the ground plane — all comfortably clear of the
 * washed-out cyans they replace, which measured well under 1.5:1.
 *
 * NB: darkening these colours is only half the fix. The glow sprites blend
 * ADDITIVELY, which on a white background adds up to white no matter what
 * colour you feed it — see `glowStyle` below.
 */
const PALETTE_LIGHT_OVERRIDES = {
  background: 0xf7f8ff,
  ground: 0xe8e8f9,
  dotIdle: 0xd0d0ed,
  pathIdle: 0xb0b0d8,
  prop: 0x4a4a7a,
  propDimmed: 0x9090ba,
  /** Deepest point of the light — also the inner glow sprite's tint. */
  lightCore: 0x1436a8,
  /** The wide halo. A shade brighter than the core so it fades out cleanly. */
  lightGlow: 0x2b62dd,
  /** The trail at the light. Deeper than the dots — it's the hotter of the two. */
  pathLit: 0x1a48c8,
  /** Floor dots directly under the light. Sits closest to --sky. */
  dotLit: 0x2358d4,
} satisfies Partial<ScenePalette>;

/** The full light-mode palette: pale environment, and a light carried by depth. */
export const PALETTE_LIGHT: ScenePalette = {
  ...PALETTE,
  ...PALETTE_LIGHT_OVERRIDES,
};

/** Pick the palette for the active theme. */
export function scenePalette(isDark: boolean): ScenePalette {
  return isDark ? PALETTE : PALETTE_LIGHT;
}

/**
 * How the travelling light's glow sprites are composited, per theme.
 *
 * ─── ADDITIVE BLENDING CANNOT WORK ON A WHITE FLOOR ─────────────────────────
 * The glow is two soft radial sprites blended ADDITIVELY — the cheap stand-in
 * for a real bloom pass (see TravellingLight's header for why bloom is off the
 * table). Additive means `result = source + destination`, and that is genuinely
 * how light behaves *on a dark background*: overlapping brightness sums toward
 * white, exactly as bloom would.
 *
 * On a near-white destination it degenerates completely. #f7f8ff is already at
 * ~0.97 of the channel range, so adding ANY colour to it clamps straight to
 * pure white. Not faint — mathematically absent. The glow sprites in light mode
 * were not merely low-contrast, they were painting white on white, and worse,
 * they were doing it OVER the core sphere and washing that out too. This is why
 * simply darkening `lightCore` would have accomplished almost nothing on its
 * own: the additive halo would have erased the darker core right back to white.
 *
 * TravellingLight's own header called this years ago — "on a light background
 * this trick falls apart and you'd be forced into real bloom". It's half right.
 * You are forced off ADDITIVE, but not into bloom, because on a pale surface a
 * glow doesn't brighten anything — there's no headroom left to brighten into.
 * It tints. A blue lamp on white paper photographs as a saturated blue core
 * washing out to white, which is ordinary alpha compositing of a saturated
 * colour through the same gradient ramp. Same texture, same two sprites, same
 * cost — one blending constant.
 *
 * The three.js constant itself is resolved in TravellingLight. This file is
 * imported by HistoryJourney, which must never pull three.js into the main
 * bundle, so it stays a plain boolean here.
 */
export interface GlowStyle {
  /** True → AdditiveBlending (dark). False → NormalBlending (light). */
  additive: boolean;
  /** Opacity of the wide, soft outer halo sprite. */
  haloOpacity: number;
  /** Opacity of the tight, hot inner sprite stacked on top of it. */
  coreOpacity: number;
}

export const GLOW: Record<"dark" | "light", GlowStyle> = {
  dark: { additive: true, haloOpacity: 0.55, coreOpacity: 0.9 },
  // Alpha-composited, so these read as literal coverage rather than as added
  // brightness. The halo is pulled back a little: at 0.55 a 9-unit disc of
  // saturated blue laid straight over the pale floor stops being a glow and
  // becomes a flat blue puddle travelling down the page.
  light: { additive: false, haloOpacity: 0.45, coreOpacity: 0.85 },
};

/** Glow compositing for the active theme. */
export function glowStyle(isDark: boolean): GlowStyle {
  return isDark ? GLOW.dark : GLOW.light;
}

/**
 * Ground-shadow strength, per theme.
 *
 * ─── WHY LIGHT MODE NEEDS SO MUCH LESS ──────────────────────────────────────
 * These are black pools, and how heavy black reads depends entirely on what
 * it's sitting on. At 0.5 on the near-black floor (#0a0d26) a shadow is a
 * subtle darkening — most of the contrast is already gone. Put the same 0.5 on
 * the near-white light-mode floor (#e8e8f9) and it becomes an ink stain: the
 * darkest thing on the page by a wide margin, and it reads as a hole in the
 * floor rather than a shadow on it.
 *
 * Real shadows on a bright surface are also genuinely fainter, because there's
 * far more bounced light filling them in. So the light-mode value is not a
 * fudge — it's closer to correct.
 */
export const SHADOW = {
  /**
   * ⬅ FLAG-POLE shadows, dark mode. (In light mode the poles cast none — see
   * `poleShadowsInLight`.)
   */
  poleOpacity: 0.6,
  /**
   * ⬅ AIRCRAFT shadows, DARK mode. Deliberately heavier than the poles'.
   *
   * The two are separate dials because they're doing different jobs. A pole's
   * shadow is incidental; an aircraft's is load-bearing — it's the only thing
   * proving a flat billboard is standing on the floor rather than hovering in
   * front of it. It also has to survive being spread over a wingspan, where
   * the same opacity that reads as solid under a narrow post looks thin.
   */
  vehicleDarkOpacity: 7.0,
  /**
   * ⬅ AIRCRAFT shadows, LIGHT mode. Much lower: black on a near-white floor
   * reads far heavier than the same value on a near-black one.
   */
  vehicleLightOpacity: 1.0,
  /**
   * Whether the flag poles cast shadows in LIGHT mode.
   *
   * Off, deliberately. A pole is a thin stick, so its shadow is a small dark
   * ellipse with nothing above it wide enough to explain it. On the near-black
   * floor that's invisible; on the pale one, a dozen of them scattered across
   * the journey read as smudges on the floor rather than shadows.
   *
   * The aircraft keep theirs because those are silhouette-shaped and sit under
   * an object big enough to justify them — they still do their job, which is
   * proving the aircraft is standing on the ground.
   *
   * Dark mode is unaffected: poles keep their shadows there.
   */
  poleShadowsInLight: false,
} as const;

/** Aircraft contact-shadow strength for the active theme. */
export function vehicleShadowOpacity(isDark: boolean): number {
  return isDark ? SHADOW.vehicleDarkOpacity : SHADOW.vehicleLightOpacity;
}

/** Whether the flag poles should cast shadows in the active theme. */
export function showPoleShadows(isDark: boolean): boolean {
  return isDark || SHADOW.poleShadowsInLight;
}

/**
 * DOM-overlay depth cues, per theme.
 *
 * ─── THE SAME LESSON AS `SHADOW`, ONE LAYER UP ──────────────────────────────
 * `SHADOW` above fixes the WebGL blob shadows for light mode. The overlays —
 * labels, photo frames, flags — are DOM, so they never went through that fix
 * and kept firing dark-mode values at a near-white floor. Every value below is
 * the DOM half of the same rule: how heavy a shadow reads depends entirely on
 * what it sits on.
 *
 * ─── WHY THE LABEL SHADOW WAS THE WORST OF THEM ─────────────────────────────
 * A 10px black blur behind the label is a legibility scrim in dark mode: the
 * text is near-white, so the dark halo is the thing separating it from the
 * floor. Flip the theme and BOTH sides invert — the text becomes deep navy and
 * the floor becomes near-white — but the halo stayed black. A dark blur behind
 * dark text does not separate anything; it just bleeds a grey smear out of
 * every glyph. That reads as a glow, it destroys the crispness that keeping
 * this text as real DOM bought in the first place, and it is tiring to look at.
 *
 * Light mode gets a tight, nearly-white lift instead. It has one job — stop the
 * dotted floor grid from interfering with the glyph edges — and at 2px of blur
 * it cannot halo. It needs no more than that: deep navy on the pale floor is
 * already about 14:1, so the shadow is not carrying contrast here, only
 * cleaning up the background behind the letterforms.
 *
 * ─── WHY LIGHT-MODE SHADOWS ARE NAVY, NOT BLACK ─────────────────────────────
 * Pure black against a page whose neutrals are all indigo-tinted reads as a
 * foreign hole punched in the floor. Tinting the shadow with the page's own ink
 * colour (`--text-primary`, #0d1030) keeps it in the family, so it recedes as
 * depth instead of announcing itself as a dark shape.
 */
export interface OverlayStyle {
  /** Legibility scrim under the floating label. */
  labelTextShadow: string;
  /** The photo frame's mat — a thin edge around the picture. */
  frameMat: string;
  /** Drop shadow proving the frame floats above the floor. */
  frameShadow: string;
  /** The soft ellipse pooled on the ground beneath each frame. */
  frameCastShadow: string;
  /** Flags are small and hang in mid-air, so they get their own lighter dial. */
  flagShadow: string;
}

const OVERLAY_DARK: OverlayStyle = {
  labelTextShadow: "0 2px 10px rgba(0,0,0,0.75)",
  frameMat:
    "linear-gradient(160deg, rgba(111,227,255,0.5), rgba(60,64,181,0.25))",
  frameShadow: "0 26px 46px rgba(0,0,0,0.72), 0 10px 20px rgba(0,0,0,0.5)",
  frameCastShadow:
    "radial-gradient(ellipse at center, rgba(0,0,0,0.55), rgba(0,0,0,0) 72%)",
  flagShadow: "drop-shadow(0 5px 10px rgba(0,0,0,0.55))",
};

const OVERLAY_LIGHT: OverlayStyle = {
  labelTextShadow: "0 1px 2px rgba(255,255,255,0.9)",
  // The cyan edge is a lit highlight; there is nothing lighting it on a pale
  // floor, so at 50% alpha it just goes pastel and looks accidental. Light mode
  // uses the brand indigo at a strength that reads as a deliberate mat.
  frameMat:
    "linear-gradient(160deg, rgba(60,64,181,0.34), rgba(60,64,181,0.16))",
  frameShadow: "0 18px 34px rgba(13,16,48,0.16), 0 6px 12px rgba(13,16,48,0.10)",
  frameCastShadow:
    "radial-gradient(ellipse at center, rgba(13,16,48,0.18), rgba(13,16,48,0) 72%)",
  flagShadow: "drop-shadow(0 4px 8px rgba(13,16,48,0.18))",
};

/** Depth cues for the DOM overlays in the active theme. */
export function overlayStyle(isDark: boolean): OverlayStyle {
  return isDark ? OVERLAY_DARK : OVERLAY_LIGHT;
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
  /** Sideways offset from the path centre to the flag poles / portraits. */
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

/** Stop props — the flag poles standing at each stop. */
export const STOP = {
  // Tall enough that the flag (flown at the pole TOP) rides ABOVE the image
  // frames, so the two never intersect — the flags occupy the band between the
  // frame tops and the floating label. If you shorten this, the flags drop into
  // the photos; if you lengthen it, raise LABEL.heightAbovePole to keep the
  // label from colliding with the flag. See the flag block in StopOverlays.
  poleHeight: 7.2,
  poleRadius: 0.09,
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
  /** Sphere detail for the travelling light's core. */
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
 * The team's aircraft, PARKED ON THE GROUND at the stop.
 *
 * ─── ALMOST NOTHING LIVES HERE, ON PURPOSE ──────────────────────────────────
 * Where each aircraft stands, how big it is drawn and how far forward it sits
 * are all properties of THAT AIRCRAFT, not of the scene — a year may park two
 * of different sizes in different places. So they live with the aircraft in
 * achievements.ts (`alongPoles`, `forwardOffset`, `displayWidth`) and only the
 * shared projection scale is left here.
 *
 * They are deliberately static: no hover, no bob, no label.
 *
 * ─── GROUND CONTACT IS NOT A MAGIC NUMBER ───────────────────────────────────
 * An aircraft's Y anchor is 0 and the element is bottom-anchored in CSS (see
 * StopOverlays), so its wheels meet the floor exactly, whatever size it is
 * drawn at. Resizing one therefore cannot make it sink or float — no constant
 * needs re-tuning when the art changes.
 */
export const VEHICLE = {
  /** Matches the frames' scale so the aircraft sit at their visual depth. */
  scale: 1.6,
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

/**
 * How many segments the progress rail is divided into.
 *
 * Deliberately FEWER than there are achievements. One segment per stop would
 * give ten slivers that each creep forward by a tenth — a readout too fine to
 * glance at, which is the only way anyone ever reads a progress indicator.
 * Five chunky segments answer "roughly how far in am I" instantly, and at ten
 * achievements each one stands for a pair.
 *
 * It does NOT have to divide the achievement count evenly. The rail groups
 * stops with `Math.floor`, so an eleventh year simply makes one segment cover
 * three stops instead of two rather than breaking the layout.
 */
export const PROGRESS_SEGMENTS = 5;

/** Scroll length per stop, in viewport heights. Sets the pace of the journey. */
export const SCROLL_PER_STOP = 0.85;

/** Extra scroll at the start and end so the first/last stop aren't clipped. */
export const SCROLL_PADDING = 0.6;
