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
}

export const achievements: Achievement[] = [
  {
    id: "2013-founded",
    year: "2013",
    title: "Started the team",
    blurb:
      "Established in 2013, Alex Eagles is a dynamic and diverse group of 40 engineering students from Alexandria University, specializing in various fields, such as mechanical and computer engineering.",
    awards: [],
    portraits: ["/history/very-oldimage-2016-cropped.jpg"],
  },
  {
    id: "2017-sae-design",
    year: "2017",
    title: "2nd Place — Best Design",
    awards: [
      { place: "2nd Place", title: "Best Design", competition: "SAE Aero Design" },
    ],
    portraits: ["/history/sae-2017.png"],
  },
  {
    id: "2018-sae-design",
    year: "2018",
    title: "1st Place — Best Design",
    awards: [
      { place: "1st Place", title: "Best Design", competition: "SAE Aero Design" },
    ],
    portraits: ["/history/sae-2018.png"],
  },
  {
    id: "2019-sae-design",
    year: "2019",
    title: "3rd Place — Best Design",
    awards: [
      { place: "3rd Place", title: "Best Design", competition: "SAE Aero Design" },
    ],
    portraits: ["/history/sae-2019.jpeg"],
  },
  {
    id: "2020-sae-overall",
    year: "2020",
    title: "3rd Place — Overall",
    awards: [
      { place: "3rd Place", title: "Overall", competition: "SAE Aero Design" },
    ],
    portraits: ["/history/sae-2020.png"],
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
    portraits: ["/history/sae-2021.png"],
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
    portraits: ["/history/sae-2022-1.jpeg", "/history/sae-2022-2.jpeg"],
  },
  {
    id: "2023-sae-overall",
    year: "2023",
    title: "11th Place — Overall",
    awards: [
      { place: "11th Place", title: "Overall", competition: "SAE Aero Design" },
    ],
    portraits: ["/history/suas-2023.jpg"],
  },
  {
    id: "2024-uavc",
    year: "2024",
    title: "5th Place",
    awards: [{ place: "5th Place", title: "Overall", competition: "UAVC" }],
    portraits: ["/history/uavc-2024.jpg"],
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
      "/history/uavc-2025.jpeg",
      "/history/suas-2025.png",
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
export const FLAG_SRC = "/history/eg-flag.png";

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
      return "/history/suas.png";
    case "SAE Aero Design":
      return "/history/sae-logo.png";
    case "UAVC":
      // Only the years the team actually attended UAVC (2021, 2024, 2025)
      // have a logo on disk. Any other year would 404 → Egyptian fallback.
      return `/history/UAVC-logo-${year}.png`;
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
