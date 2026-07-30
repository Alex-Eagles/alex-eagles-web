/**
 * home.ts — mock content for the Home page (stats, latest updates, sponsors).
 * Swap these arrays for a CMS/API later; the components don't care where the
 * data comes from. Note: apostrophes here use the curly ’ form on purpose.
 */

export interface Stat {
  num: string;
  label: string;
}

/** The four figures in the stats bar. */
export const STATS: Stat[] = [
  { num: "2025", label: "Competition Year" },
  { num: "42", label: "Team Members" },
  { num: "380+", label: "Flight Hours" },
  { num: "7", label: "Awards Won" },
];

export interface BlogPost {
  subteam: string;
  /** Accent dot color for the subteam (hex). */
  dotColor: string;
  author: string;
  date: string;
  title: string;
  excerpt: string;
}

/** The three "Latest updates" cards. */
export const LATEST_POSTS: BlogPost[] = [
  {
    subteam: "Airframe",
    dotColor: "#85B7EB",
    author: "M. Khaled",
    date: "WED, 04 JUN 25",
    title: "Carbon wing layup complete",
    excerpt:
      "The main wing spar came out of the autoclave this week. Final mass landed 8% under target while exceeding our spanwise stiffness goal — a major win for the structures crew heading into integration.",
  },
  {
    subteam: "Avionics",
    dotColor: "#AFA9EC",
    author: "S. Nour",
    date: "SAT, 31 MAY 25",
    title: "Telemetry link tuning",
    excerpt:
      "Dialed in the 915 MHz radio and ground station antenna. We held a stable link out to 1.4 km on the test range with zero packet loss across the full mission profile.",
  },
  {
    subteam: "Software",
    dotColor: "#5DCAA5",
    author: "A. Fathy",
    date: "TUE, 27 MAY 25",
    title: "Autonomous waypoint mode",
    excerpt:
      "Our mission planner now flies a full waypoint lap hands-off, including auto-takeoff and loiter. Onboard object-detection integration is the next milestone on the roadmap.",
  },
];

export interface AwardLine {
  /** Placement, where the award has one. Named awards carry no ranking. */
  place?: string;
  title: string;
  competition: string;
}

export interface AwardYear {
  year: string;
  awards: AwardLine[];
}

/**
 * Every competition result, kept chronological to match the History page's
 * source data. This is what the hero ticker scrolls through; the "What we've
 * won" cards lead with FEATURED_AWARDS below instead. 2013 is the founding
 * year and won nothing, so it isn't listed here.
 */
export const AWARD_YEARS: AwardYear[] = [
  {
    year: "2017",
    awards: [
      { place: "2nd Place", title: "Best Design", competition: "SAE Aero Design" },
    ],
  },
  {
    year: "2018",
    awards: [
      { place: "1st Place", title: "Best Design", competition: "SAE Aero Design" },
    ],
  },
  {
    year: "2019",
    awards: [
      { place: "3rd Place", title: "Best Design", competition: "SAE Aero Design" },
    ],
  },
  {
    year: "2020",
    awards: [
      { place: "3rd Place", title: "Overall", competition: "SAE Aero Design" },
    ],
  },
  {
    year: "2021",
    awards: [
      { title: "Best Design Award", competition: "UAVC" },
      { place: "4th Place", title: "Overall", competition: "SAE Aero Design" },
    ],
  },
  {
    year: "2022",
    awards: [
      { place: "1st Place", title: "Best Design", competition: "SAE Aero Design" },
      {
        place: "1st Place",
        title: "Best Presentation",
        competition: "SAE Aero Design",
      },
    ],
  },
  {
    year: "2023",
    awards: [
      { place: "11th Place", title: "Overall", competition: "SAE Aero Design" },
    ],
  },
  {
    year: "2024",
    awards: [{ place: "5th Place", title: "Overall", competition: "UAVC" }],
  },
  {
    year: "2025",
    awards: [
      { place: "5th Place", title: "Overall", competition: "UAVC" },
      { title: "Best Technical Design Report", competition: "UAVC" },
      { title: "Best Technical Design Report", competition: "SUAS" },
    ],
  },
];

/** Newest first, which is the order the ticker shows. */
export const AWARD_YEARS_LATEST_FIRST: AwardYear[] = [...AWARD_YEARS].reverse();

/**
 * A run of title text, optionally picked out in the accent color. Titles are
 * segmented rather than plain strings so a card can highlight the words that
 * name the award ("Technical Design") without the component having to
 * string-match its own copy.
 */
export interface AwardTitlePart {
  text: string;
  accent?: boolean;
}

export interface FeaturedAward extends Omit<AwardLine, "title"> {
  title: AwardTitlePart[];
  year: string;
}

/** The award name both 2025 report wins share, highlight and all. */
const TECHNICAL_DESIGN_REPORT: AwardTitlePart[] = [
  { text: "Best " },
  { text: "Technical Design", accent: true },
  { text: " Report" },
];

/**
 * The three results the homepage leads with — the whole of the 2025 season.
 * The full record lives on the History page, which the section links out to.
 */
export const FEATURED_AWARDS: FeaturedAward[] = [
  {
    place: "5th",
    title: [{ text: "Overall" }],
    competition: "UAVC",
    year: "2025",
  },
  { title: TECHNICAL_DESIGN_REPORT, competition: "UAVC", year: "2025" },
  { title: TECHNICAL_DESIGN_REPORT, competition: "SUAS", year: "2025" },
];

/** One flat line per award, for the hero ticker. */
export const TICKER_RESULTS: string[] = AWARD_YEARS_LATEST_FIRST.flatMap(
  ({ year, awards }) =>
    awards.map((award) =>
      [award.place, award.title, `${award.competition} ${year}`]
        .filter(Boolean)
        .join(" · "),
    ),
);

export interface Sponsor {
  name: string;
  tag: string;
}

/** Sponsor logos for the marquee (placeholder brands). */
export const SPONSORS: Sponsor[] = [
  { name: "ProtoLab", tag: "Rapid prototyping" },
  { name: "AeroComposites", tag: "Carbon airframes" },
  { name: "VoltCore", tag: "Flight batteries" },
  { name: "SkyLink", tag: "Telemetry radios" },
  { name: "Helix", tag: "Custom propellers" },
  { name: "Nimbus", tag: "Compute & CI" },
];
