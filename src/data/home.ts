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
