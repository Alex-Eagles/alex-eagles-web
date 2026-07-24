/**
 * achievements.ts — THE CONTENT SOURCE for the History page's 3D journey.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  WHERE TO PUT THE ACHIEVEMENT IMAGES                                     ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                          ║
 * ║  1. Drop the image files into:   public/history/                         ║
 * ║                                                                          ║
 * ║  2. Reference them in the `portraits` array of the matching year below,  ║
 * ║     using a path that starts with "/history/" (NOT "public/").           ║
 * ║                                                                          ║
 * ║     Example — 2018 has one award, so one image:                          ║
 * ║         portraits: ["/history/2018-1.jpg"]                                ║
 * ║                                                                          ║
 * ║     Example — 2022 has two awards, so two images:                        ║
 * ║         portraits: ["/history/2022-1.jpg", "/history/2022-2.jpg"]         ║
 * ║                                                                          ║
 * ║  3. That's it. No 3D code changes, ever.                                 ║
 * ║                                                                          ║
 * ║  FORMAT: landscape photos (roughly 3:2). The frames in the scene are     ║
 * ║  landscape and images are cropped to fill, so portrait-orientation       ║
 * ║  photos will be heavily cropped top and bottom.                          ║
 * ║                                                                          ║
 * ║  .webp or .jpg both work. Around 800px wide is plenty — the frames are   ║
 * ║  small on screen, and smaller files mean a faster page.                  ║
 * ║                                                                          ║
 * ║  Any path that doesn't resolve shows a neutral placeholder with the year ║
 * ║  on it, so a missing or misspelled file never breaks the layout.         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  WHERE TO PUT THE AIRCRAFT RENDERS                                       ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                          ║
 * ║  1. Drop the render into:   public/history/vehicles/                     ║
 * ║                                                                          ║
 * ║  2. Add it to `vehicles` on the matching year, with the render's REAL    ║
 * ║     pixel size and where it should stand:                                ║
 * ║                                                                          ║
 * ║         vehicles: [{                                                     ║
 * ║           name: "Do3soka",                                               ║
 * ║           render: "/history/vehicles/do3soka.webp",                      ║
 * ║           width: 563, height: 240,   // the file's real size             ║
 * ║           alongPoles: 0.1,           // 0 = 1st pole, 1 = last pole      ║
 * ║           forwardOffset: 2.2,        // how far toward the viewer        ║
 * ║           displayWidth: 200,         // how big to draw it               ║
 * ║         }],                                                              ║
 * ║                                                                          ║
 * ║  Each aircraft then stands ON THE GROUND between that year's flag        ║
 * ║  poles. No label is drawn — `name` is the alt text. Years with no        ║
 * ║  `vehicles` simply don't show any, and nothing else about the stop       ║
 * ║  moves.                                                                  ║
 * ║                                                                          ║
 * ║  A year can list SEVERAL. Give them different `forwardOffset`s as well   ║
 * ║  as different `alongPoles` — the poles are narrower than an aircraft,    ║
 * ║  so depth, not sideways distance, is what stops two overlapping.         ║
 * ║                                                                          ║
 * ║  They can never sink into or float above the floor — that is handled in  ║
 * ║  CSS, not by a number you have to re-tune.                               ║
 * ║                                                                          ║
 * ║  FORMAT: WebP with a TRANSPARENT background, and TRIMMED so the aircraft ║
 * ║  touches the edges of the file. Transparent padding left in the file     ║
 * ║  becomes dead space in the scene and shrinks the aircraft on screen.     ║
 * ║  ~600px on the long edge is plenty; these land around 10KB.              ║
 * ║                                                                          ║
 * ║  Don't downscale below that hoping for a smaller file — it backfires.    ║
 * ║  Resampling softens the clean edges WebP compresses well, so a 420px     ║
 * ║  copy of this render encodes LARGER than the 563px original.             ║
 * ║                                                                          ║
 * ║  Renders, NOT .glb models — see the `Vehicle` type below for why.        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ─── EDIT THIS FILE, NOT THE 3D CODE ────────────────────────────────────────
 * Everything a visitor reads on the History page comes from the array below.
 * The 3D scene (curve shape, stop spacing, camera timing, scroll length) is
 * all DERIVED from this array at runtime — so adding, removing or reordering
 * an entry Just Works.
 *
 * ─── ONE STOP = ONE YEAR ────────────────────────────────────────────────────
 * Years where the team won more than once (2021, 2022, 2025) list every award
 * in `awards[]` and render as a VISUALLY BIGGER stop — more people in the
 * crowd, and one image frame per award, arranged around the flag pole:
 *
 *        [ Image 1 ]   🚩pole + text   [ Image 2 ]
 *
 * So the size of a moment on the path is a real signal, not decoration:
 * 2025 is the biggest stop because 2025 was the biggest year.
 *
 * ─── ABOUT THE COPY ─────────────────────────────────────────────────────────
 * `blurb` is intentionally EMPTY for every year except 2013, because 2013 is
 * the only one we were given a description for. Nothing here is invented —
 * every place, award name and competition came from the team directly. When a
 * stop has no blurb the label falls back to listing the awards, which keeps
 * the layout complete without asserting anything untrue. Fill blurbs in
 * freely; the layout already reserves room and nothing shifts.
 */

/** Which competition an award was won at. */
export type Competition = "SAE Aero Design" | "UAVC" | "SUAS";

/** A single award. A year may have several. */
export interface Award {
  /** Placement, e.g. "1st Place". Omitted for named awards with no ranking. */
  place?: string;
  /** What the award was for, e.g. "Best Design". */
  title: string;
  /** Where it was won. */
  competition: Competition;
}

/**
 * The aircraft the team flew that year, hovering above its stop.
 *
 * ─── WHY THIS IS A RENDER AND NOT A 3D MODEL ────────────────────────────────
 * A .glb per year would mean shipping a GLTF loader plus a Draco decoder that
 * nothing else on the site needs, several hundred KB per aircraft, and a
 * texture/mesh upload landing exactly as the camera arrives at the stop — the
 * same hitch the photo frames are DOM images to avoid (see StopOverlays).
 *
 * It would also read wrong: every solid object in this scene is an untextured
 * primitive (capsule people, cylinder poles), so one photoreal mesh among them
 * looks like a bug rather than a centrepiece.
 *
 * A trimmed transparent WebP costs ~13KB, decodes off the main thread, stays
 * crisp at any zoom and needs no new dependency.
 */
export interface Vehicle {
  /**
   * The aircraft's name. NOT drawn on screen — the scene shows the aircraft
   * with no label. This is the alt text, so it still has to be accurate: it's
   * what a screen-reader user gets instead of the image.
   */
  name: string;
  /**
   * Transparent-background render, in `public/history/vehicles/`.
   *
   * FORMAT: WebP with a real alpha channel, trimmed so the aircraft touches
   * the edges of the canvas — any transparent padding baked into the file
   * becomes dead space in the scene and shrinks the aircraft on screen.
   * Roughly 600px on the long edge is plenty.
   */
  render: string;
  /**
   * The render's REAL pixel dimensions.
   *
   * Set on the <img> so the browser knows the aspect ratio before the file
   * arrives and reserves the right box immediately — without them the element
   * reflows the moment the image decodes, which inside a 3D-transformed
   * overlay shows up as the aircraft visibly popping into place.
   *
   * These must match the file. If you re-export at a different size, update
   * them.
   */
  width: number;
  height: number;
  /**
   * WHERE IT PARKS, along the line between the stop's flag poles.
   *
   * 0 = standing at the FIRST pole, 1 = at the LAST pole, 0.5 = midway. So on
   * 2025, whose poles are UAVC then SUAS, 0.1 is "between the poles, hard over
   * by the UAVC pole" and 0.9 is the same by the SUAS pole.
   *
   * Expressed as a fraction rather than a distance so it keeps its meaning if
   * the poles are ever moved further apart — the aircraft stay in proportion
   * instead of drifting off their poles. Values outside 0..1 extrapolate
   * beyond the poles, which is allowed but rarely what you want.
   *
   * A stop with only ONE pole ignores this: both ends of the line are the same
   * point, so the aircraft simply stands at that pole.
   */
  alongPoles: number;
  /**
   * How far IN FRONT of the poles it stands, in world units — measured back
   * along the path toward the oncoming camera. Bigger = nearer the viewer.
   *
   * This is also what keeps two aircraft at one stop from overlapping. The
   * poles are only ~2 units apart, which is narrower than an aircraft, so
   * separating them sideways alone is not enough: giving them different
   * forward offsets puts them at different DEPTHS, and one reads as standing
   * in front of the other rather than through it.
   */
  forwardOffset: number;
  /**
   * Rendered width in px before VEHICLE.scale — the aircraft's apparent SIZE
   * in the scene.
   *
   * Per-vehicle because the real aircraft are not the same size: the
   * fixed-wing has a far wider span than the quadcopter, and giving them a
   * shared width would draw them as though they were equally big.
   */
  displayWidth: number;
}

/** One stop on the path — one year of the team's history. */
export interface Achievement {
  /** Stable key. Also drives the "ACHIEVEMENT 03" counter (index + 1). */
  id: string;
  /** Calendar year, shown as the stop's timestamp. */
  year: string;
  /** Headline for the stop — the year's defining moment. */
  title: string;
  /**
   * Optional supporting sentence. Empty for most years by design (see above).
   * Safe to fill in later without touching any other file.
   */
  blurb?: string;
  /** Every award won this year. Length drives the stop's visual weight. */
  awards: Award[];
  /**
   * Image frames standing in the scene at this stop — see the box at the top
   * of this file for how to add real photos.
   *
   * Convention: ONE IMAGE PER AWARD, so a year that won twice shows two
   * frames flanking the flag pole. Years with no awards (2013) still get one
   * frame. The scene lays them out automatically however many there are.
   */
  portraits: string[];
  /**
   * The aircraft flown this year, parked on the ground at the stop. Optional:
   * a year without any simply doesn't render one, and nothing else about the
   * stop moves. A year may list several — see `alongPoles` for how they're
   * spaced out between the flag poles.
   */
  vehicles?: Vehicle[];
}

export const achievements: Achievement[] = [
  {
    id: "2013-founded",
    year: "2013",
    title: "Started the team",
    blurb:
      "Established in 2013, Alex Eagles is a dynamic and diverse group of 40 engineering students from Alexandria University, specializing in various fields, such as mechanical and computer engineering.",
    awards: [],
    portraits: ["/history/very-oldimage-2016-cropped.webp"],
  },
  {
    id: "2017-sae-design",
    year: "2017",
    title: "2nd Place — Best Design",
    awards: [
      { place: "2nd Place", title: "Best Design", competition: "SAE Aero Design" },
    ],
    portraits: ["/history/sae-2017.webp"],
  },
  {
    id: "2018-sae-design",
    year: "2018",
    title: "1st Place — Best Design",
    awards: [
      { place: "1st Place", title: "Best Design", competition: "SAE Aero Design" },
    ],
    portraits: ["/history/sae-2018.webp"],
  },
  {
    id: "2019-sae-design",
    year: "2019",
    title: "3rd Place — Best Design",
    awards: [
      { place: "3rd Place", title: "Best Design", competition: "SAE Aero Design" },
    ],
    portraits: ["/history/sae-2019.webp"],
  },
  {
    id: "2020-sae-overall",
    year: "2020",
    title: "3rd Place — Overall",
    awards: [
      { place: "3rd Place", title: "Overall", competition: "SAE Aero Design" },
    ],
    portraits: ["/history/sae-2020.webp"],
  },
  {
    id: "2021-uavc-sae",
    year: "2021",
    title: "Best Design Award",
    awards: [
      { title: "Best Design Award", competition: "UAVC" },
      { place: "4th Place", title: "Overall", competition: "SAE Aero Design" },
    ],
    // Two awards → two frames: [ Image 1 ]  pole  [ Image 2 ]
    portraits: ["/history/sae-2021.webp"],
  },
  {
    id: "2022-sae-double",
    year: "2022",
    title: "1st Place — Best Design",
    awards: [
      { place: "1st Place", title: "Best Design", competition: "SAE Aero Design" },
      {
        place: "1st Place",
        title: "Best Presentation",
        competition: "SAE Aero Design",
      },
    ],
    // Two awards → two frames: [ Image 1 ]  pole  [ Image 2 ]
    portraits: ["/history/sae-2022-1.webp", "/history/sae-2022-2.webp"],
  },
  {
    id: "2023-sae-overall",
    year: "2023",
    title: "11th Place — Overall",
    awards: [
      { place: "11th Place", title: "Overall", competition: "SAE Aero Design" },
    ],
    portraits: ["/history/suas-2023.webp"],
  },
  {
    id: "2024-uavc",
    year: "2024",
    title: "5th Place",
    awards: [{ place: "5th Place", title: "Overall", competition: "UAVC" }],
    portraits: ["/history/uavc-2024.webp"],
  },
  {
    id: "2025-uavc-suas",
    year: "2025",
    title: "5th Place — Overall",
    awards: [
      { place: "5th Place", title: "Overall", competition: "UAVC" },
      { title: "Best Technical Design Report", competition: "UAVC" },
      { title: "Best Technical Design Report", competition: "SUAS" },
    ],
    // Three awards → three frames, arranged around the pole.
    portraits: [
      "/history/uavc-2025.webp",
      "/history/suas-2025.webp",
    ],
    // Both 2025 aircraft stand between the two flag poles: the fixed-wing
    // over by the UAVC pole, the quadcopter by the SUAS pole and a step
    // further forward so the two never overlap.
    vehicles: [
      {
        name: "Do3soka",
        render: "/history/vehicles/do3soka.webp",
        width: 563,
        height: 240,
        alongPoles: 0.1,
        forwardOffset: 2.2,
        displayWidth: 200,
      },
      {
        name: "Itay",
        render: "/history/vehicles/itay.webp",
        width: 400,
        height: 281,
        alongPoles: 0.9,
        forwardOffset: 4.6,
        displayWidth: 132,
      },
    ],
  },
];

/**
 * The Egyptian flag. Flown on the founding stop (2013), which has no
 * competition of its own — it's the birth of an Egyptian team, so the national
 * flag is the right marker there.
 *
 * Rendered as a DOM <img> rather than a WebGL texture — crisp at any size, zero
 * GPU texture upload.
 */
export const FLAG_SRC = "/history/Flags/eg-flag.webp";

/**
 * The logo flown on a stop's flag pole, per competition.
 *
 * UAVC restyles its logo every year, so its flag depends on BOTH the
 * competition and the year. SAE and SUAS use one logo throughout.
 *
 * Keep these filenames in sync with public/history/. A missing file falls back
 * to the Egyptian flag rather than a broken image (see resolveFlag below).
 */
export function competitionLogo(
  competition: Competition,
  year: string,
): string {
  switch (competition) {
    case "SUAS":
      return "/history/Flags/suas.webp";
    case "SAE Aero Design":
      return "/history/Flags/sae-logo.svg";
    case "UAVC":
      // Only the years the team actually attended UAVC (2021, 2024, 2025)
      // have a logo on disk. Any other year would 404 → Egyptian fallback.
      return `/history/Flags/UAVC-logo-${year}.svg`;
  }
}

/** Which way a flag drapes from its pole. */
export type FlagSide = "left" | "right";

/** One flag pole at a stop: a competition, its logo, and which way it drapes. */
export interface Pole {
  competition: Competition | "Egypt";
  logo: string;
  side: FlagSide;
}

/**
 * The flag poles for a stop — ONE PER DISTINCT COMPETITION.
 *
 * A year won at two different competitions (2021: UAVC + SAE, 2025: UAVC +
 * SUAS) gets TWO poles; a year won only at SAE — even twice, like 2022 — gets
 * ONE. Duplicate competitions collapse to a single pole.
 *
 * Draping: a lone pole's flag faces right; a pair opens outward, first flag
 * left, second right, so the stop reads symmetrically.
 *
 * The founding year (no awards) flies the Egyptian flag instead.
 */
export function polesFor(achievement: Achievement): Pole[] {
  if (achievement.awards.length === 0) {
    return [{ competition: "Egypt", logo: FLAG_SRC, side: "right" }];
  }

  // Distinct competitions, in the order they first appear.
  const seen = new Set<Competition>();
  const competitions: Competition[] = [];
  for (const award of achievement.awards) {
    if (!seen.has(award.competition)) {
      seen.add(award.competition);
      competitions.push(award.competition);
    }
  }

  return competitions.map((competition, index) => ({
    competition,
    logo: competitionLogo(competition, achievement.year),
    // One pole → right. Two+ → alternate left/right so they open outward.
    side:
      competitions.length === 1
        ? "right"
        : index % 2 === 0
          ? "left"
          : "right",
  }));
}
