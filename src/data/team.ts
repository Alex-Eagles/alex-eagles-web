/**
 * team.ts — the roster behind the Team page.
 *
 * Shape follows the design handoff: a page is one *year*, a year has a
 * leadership trio plus a list of *divisions*, and each division has *sections*
 * whose members are the card grid.
 *
 *   year → leadership[3]
 *        → divisions[] → sections[] → members[]
 *
 * ---------------------------------------------------------------------------
 * FILLING IN A SLOT
 * ---------------------------------------------------------------------------
 * Every slot below ships blank on purpose — a slot with no `name` renders the
 * "Name Surname" placeholder, and one with no `photo` renders the drop-portrait
 * empty state. To fill one in:
 *
 *   1. name:  set `name: "Ziad Essam"`
 *   2. photo: drop a kebab-case file into src/assets/members/<slug>.<ext>
 *             then set `photo: "ziad-essam"`
 *   3. hover reveal (optional): drop a background-removed PNG into
 *             src/assets/members/cutouts/<slug>.png — same slug as the photo.
 *             That alone switches the card from the grayscale→colour hover to
 *             the blue-backdrop cut-out reveal. No code change. Delete the file
 *             and the card reverts.
 *
 * Add or remove slots by editing the arrays — the grid and the jump nav both
 * follow whatever is here.
 */

/* ---------------------------------------------------------------------------
 * 1. TYPES
 * -------------------------------------------------------------------------*/

/** Card role label. Shown in the rest-state pill and again in the hover panel. */
export type Role =
  | "Team Leader"
  | "Vice Lead"
  | "Head of Autonomous"
  | "Section Lead"
  | "Member";

export interface TeamMember {
  id: string;
  /** Blank renders the "Name Surname" placeholder. */
  name: string;
  /** Overrides the big name behind the portrait. Defaults to the first word of `name`. */
  firstName?: string;
  role: Role;
  /** Section the card sits in — stamped on by the builder, shown in the hover panel. */
  department: string;
  /** Defaults to the roster year. Set only to override one person. */
  gradYear?: string;
  /** Slug of the photo in src/assets/members/ */
  photo?: string;
  /**
   * Slug of the background-removed PNG in src/assets/members/cutouts/.
   * Omit it and we look for a cutout under the `photo` slug, so matching
   * filenames pair up automatically. Set it only to point at a different file.
   */
  cutout?: string;
  linkedIn?: string;
}

export interface Section {
  name: string;
  /** Slug used as the anchor id and the jump-nav target. */
  id: string;
  members: TeamMember[];
}

export interface Division {
  /** The oversized "01" / "02" behind the division heading. */
  num: string;
  name: string;
  sections: Section[];
}

export interface YearRoster {
  year: string;
  /** Exactly three: left card, centre card (the raised one), right card. */
  leadership: [TeamMember, TeamMember, TeamMember];
  divisions: Division[];
}

/* ---------------------------------------------------------------------------
 * 2. IMAGE RESOLUTION
 * -------------------------------------------------------------------------*/
/*
 * Eagerly import every member image so Vite fingerprints and bundles them.
 * Keys come back as full relative paths; we re-key them by bare slug.
 * Note `*` does not cross a `/`, so the two globs never overlap.
 */

const bySlug = (mods: Record<string, { default: string }>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(mods).map(([path, mod]) => [
      // "../assets/members/ziad-essam.jpeg" → "ziad-essam"
      path.split("/").pop()!.replace(/\.[^.]+$/, ""),
      mod.default,
    ]),
  );

const PHOTOS = bySlug(
  import.meta.glob<{ default: string }>("../assets/members/*.{jpg,jpeg,png,webp}", {
    eager: true,
  }),
);

const CUTOUTS = bySlug(
  import.meta.glob<{ default: string }>("../assets/members/cutouts/*.{png,webp}", {
    eager: true,
  }),
);

/** Resolved photo URL for a member, or undefined if no file matches. */
export function memberPhoto(member: TeamMember): string | undefined {
  return member.photo ? PHOTOS[member.photo] : undefined;
}

/**
 * Resolved background-removed portrait, or undefined if there isn't one.
 * Presence of this is what puts a card into the blue-backdrop hover mode.
 */
export function memberCutout(member: TeamMember): string | undefined {
  const slug = member.cutout ?? member.photo;
  return slug ? CUTOUTS[slug] : undefined;
}

/* ---------------------------------------------------------------------------
 * 3. DISPLAY HELPERS  (the only place card copy is assembled)
 * -------------------------------------------------------------------------*/

/** Shown when a slot has no name yet. */
export const NAME_PLACEHOLDER = "Name Surname";

export const hasName = (member: TeamMember): boolean => member.name.trim().length > 0;

/** The name on the card — the real one, or the placeholder for an empty slot. */
export function memberName(member: TeamMember): string {
  return hasName(member) ? member.name : NAME_PLACEHOLDER;
}

/**
 * The stretched name behind the portrait. Empty for an unfilled slot — a giant
 * "NAME" behind a placeholder card reads as a bug rather than as a design.
 */
export function memberFirstName(member: TeamMember): string {
  if (!hasName(member)) return "";
  return (member.firstName ?? member.name.split(" ")[0]).toUpperCase();
}

/** "Class of 2026" — per-member override, else the roster year. */
export function memberYearLabel(member: TeamMember, rosterYear: string): string {
  return `Class of ${member.gradYear ?? rosterYear}`;
}

/* ---------------------------------------------------------------------------
 * 4. THE ROSTER
 * -------------------------------------------------------------------------*/

export const slugify = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Ids must be unique across years, since both rosters are built at once. */
let slotCounter = 0;

/**
 * One card slot. `name` comes second so the common edit — typing a name in —
 * is a one-word change near the start of the line.
 */
const slot = (
  role: Role,
  name = "",
  extra: Partial<Omit<TeamMember, "id" | "role" | "name" | "department">> = {},
): Omit<TeamMember, "department"> => ({
  id: `slot-${++slotCounter}`,
  role,
  name,
  ...extra,
});

const section = (name: string, members: Omit<TeamMember, "department">[]): Section => ({
  name,
  id: slugify(name),
  // `department` is always the section name, so it's stamped on here rather
  // than repeated on every row.
  members: members.map((m) => ({ ...m, department: name })),
});

/** The four-slot shape every section starts from. */
const standardSection = (name: string): Section =>
  section(name, [
    slot("Section Lead"),
    slot("Vice Lead"),
    slot("Member"),
    slot("Member"),
  ]);

/** The leadership trio, in render order: [left, centre, right]. */
const leadershipTrio = (): [TeamMember, TeamMember, TeamMember] => [
  { ...slot("Vice Lead"), department: "Team Leadership" },
  { ...slot("Team Leader"), department: "Team Leadership" },
  { ...slot("Head of Autonomous"), department: "Team Leadership" },
];

const ROSTER_2026: YearRoster = {
  year: "2026",
  leadership: leadershipTrio(),
  divisions: [
    {
      num: "01",
      name: "Mechanical",
      sections: ["Aerodesign", "Structure", "Propulsion"].map(standardSection),
    },
    {
      num: "02",
      name: "Autonomous",
      sections: ["Software", "Hardware", "AI"].map(standardSection),
    },
  ],
};

const ROSTER_2025: YearRoster = {
  year: "2025",
  leadership: leadershipTrio(),
  divisions: [
    {
      num: "01",
      name: "Mechanical",
      sections: ["Aerodesign", "Structure", "Propulsion"].map(standardSection),
    },
    {
      num: "02",
      name: "Autonomous",
      sections: ["Software", "Hardware", "AI"].map(standardSection),
    },
  ],
};

/** Display order of the year tabs in the hero. The first one is the default. */
export const ROSTER_YEARS = ["2026", "2025"] as const;
export type RosterYear = (typeof ROSTER_YEARS)[number];

export const ROSTERS: Record<RosterYear, YearRoster> = {
  "2026": ROSTER_2026,
  "2025": ROSTER_2025,
};

/* ---------------------------------------------------------------------------
 * 5. JUMP NAV
 * -------------------------------------------------------------------------*/

export interface NavGroup {
  label: string;
  items: { name: string; href: string }[];
}

/** Leadership, then one group per division — drives the PULL side nav. */
export function navGroups(roster: YearRoster): NavGroup[] {
  return [
    { label: "Leadership", items: [{ name: "Leadership", href: "#leadership" }] },
    ...roster.divisions.map((division) => ({
      label: division.name,
      items: division.sections.map((s) => ({ name: s.name, href: `#${s.id}` })),
    })),
  ];
}
