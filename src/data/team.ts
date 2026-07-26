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
 *   2. photo: drop a kebab-case file into src/assets/members/photos/<slug>.<ext>
 *             then set `photo: "ziad-essam"`
 *   3. hover reveal (optional): drop a background-removed WebP into
 *             src/assets/members/cutouts/<slug>.webp — same slug as the photo.
 *             That alone switches the card from the grayscale→colour hover to
 *             the blue-backdrop cut-out reveal. No code change. Delete the file
 *             and the card reverts.
 *
 *             If the background-removal tool hands you an SVG, run it through
 *             `node scripts/cutout-svg-to-webp.mjs src/assets/members/cutouts`
 *             first — those exports embed the photo twice at full resolution
 *             (~2.5 MB each) and browsers rasterise their mask at the SVG's
 *             declared size, so the portrait looks pixelated on the card.
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
  | "Vice Lead of Autonomous"
  | "EM Integration Lead"
  | "Section Lead"
  | "Vice Section Lead"
  | "Member";

/**
 * Rank tier — the *visual* weight of a card, derived from its role. This is what
 * makes the hierarchy legible at a glance: execs and division heads get the
 * biggest cards, section leads a raised lead-row card, vices a lighter lead
 * treatment, and members the standard grid card.
 */
export type Tier = "exec" | "head" | "lead" | "vice" | "member";

/** Map a role onto its visual tier. One place, so the card never guesses. */
export function roleTier(role: Role): Tier {
  switch (role) {
    case "Team Leader":
    case "Vice Lead":
    case "EM Integration Lead":
      return "exec";
    case "Head of Autonomous":
      return "head";
    case "Vice Lead of Autonomous":
    case "Vice Section Lead":
      return "vice";
    case "Section Lead":
      return "lead";
    default:
      return "member";
  }
}

/** True for any card that should sit in the raised "lead row" above members. */
export const isLeadTier = (tier: Tier): boolean =>
  tier === "lead" || tier === "vice" || tier === "head";

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
  /** Slug of the photo in src/assets/members/photos/ */
  photo?: string;
  /**
   * Slug of the background-removed cut-out in src/assets/members/cutouts/.
   * Omit it and we look for a cutout under the `photo` slug, so matching
   * filenames pair up automatically. Set it only to point at a different file.
   */
  cutout?: string;
  linkedIn?: string;
  /**
   * Academic major, from the roster intake form — e.g. "Mechatronics",
   * "Computer and Communication Engineering". Not the same thing as
   * `department` (that's the sub-team, e.g. "Hardware"). Captured for
   * completeness; no card shows it yet — nowhere on the design has a slot
   * for it currently.
   */
  major?: string;
}

/**
 * The icon shown on a sub-team's info chip. Keys map to an SVG in the
 * SubTeamIcon component; the section name's slug is the default, so most
 * sections never set this.
 */
export type SubTeamIconKey =
  | "software"
  | "hardware"
  | "computer-vision"
  | "structure"
  | "aerodesign"
  | "wing"
  | "tail-stability"
  | "propulsion";

export interface Section {
  name: string;
  /** Slug used as the anchor id and the jump-nav target. */
  id: string;
  members: TeamMember[];
  /**
   * One or two sentences on what this sub-team does — revealed from the info
   * chip beside the title. Omit and no chip renders.
   */
  blurb?: string;
  /** Overrides the info-chip icon. Defaults to the section's slug. */
  icon?: SubTeamIconKey;
  /**
   * Nested sub-groups — e.g. Aerodesign → Wing, Tail & Stability. When present,
   * the section renders as a parent block: its own `members` first (the aero
   * "core"), then each subsection as an indented, labelled group. Leave empty
   * for a flat section.
   */
  subsections?: Section[];
}

export interface Division {
  /** The oversized "01" / "02" behind the division heading. */
  num: string;
  name: string;
  /**
   * The people who run the division — Head / Vice — rendered as a raised lead
   * row directly under the division title, above the working sections. Empty
   * for a division with no dedicated heads.
   */
  heads?: TeamMember[];
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
  import.meta.glob<{ default: string }>("../assets/members/photos/*.{jpg,jpeg,png,webp}", {
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

/**
 * The role text shown on the card. A generic "Section Lead" doesn't say which
 * section, so it's swapped for the sub-team-specific title — "Structure Lead",
 * "Aerodesign Lead" — using the section name already stamped onto `department`.
 * Every other role (Vice Section Lead, Member, the exec titles) shows as-is.
 */
export function memberRoleLabel(member: TeamMember): string {
  if (member.role === "Section Lead") return `${member.department} Lead`;
  return member.role;
}

/* ---------------------------------------------------------------------------
 * 4. THE ROSTER
 * -------------------------------------------------------------------------*/

export const slugify = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/**
 * Per-sub-team accent color, resolved through the centralized `--team-*` tokens
 * in theme.css (so the whole palette is edited in one place). Falls back to the
 * brand accent for anything without its own token (e.g. "Team Leadership").
 */
export function subTeamAccent(name: string): string {
  return `var(--team-${slugify(name)}, #3d3ecc)`;
}

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

const section = (
  name: string,
  members: Omit<TeamMember, "department">[],
  opts: { blurb?: string; icon?: SubTeamIconKey; subsections?: Section[] } = {},
): Section => ({
  name,
  id: slugify(name),
  // `department` is always the section name, so it's stamped on here rather
  // than repeated on every row.
  members: members.map((m) => ({ ...m, department: name })),
  ...(opts.blurb ? { blurb: opts.blurb } : {}),
  ...(opts.icon ? { icon: opts.icon } : {}),
  ...(opts.subsections?.length ? { subsections: opts.subsections } : {}),
});

/**
 * Split a member list into the raised lead row and the member grid, in one
 * pass, so page code never re-derives the rule. Leads/vices/heads float up;
 * everyone else stays in the grid — original order preserved within each.
 */
export function splitByTier(members: TeamMember[]): {
  leads: TeamMember[];
  vices: TeamMember[];
  grid: TeamMember[];
} {
  const leads: TeamMember[] = [];
  const vices: TeamMember[] = [];
  const grid: TeamMember[] = [];
  for (const m of members) {
    const tier = roleTier(m.role);
    if (tier === "lead" || tier === "head") leads.push(m);
    else if (tier === "vice") vices.push(m);
    else grid.push(m);
  }
  return { leads, vices, grid };
}

/** A division-head card (Head / Vice), stamped with the division name. */
const head = (
  role: Role,
  name: string,
  division: string,
  extra: Partial<Omit<TeamMember, "id" | "role" | "name" | "department">> = {},
): TeamMember => ({ ...slot(role, name, extra), department: division });

const ROSTER_2026: YearRoster = {
  year: "2026",
  leadership: [
    {
      ...slot("Vice Lead", "Youssef Hozayen", {
        photo: "youssef-hozayen-2026",
        linkedIn: "https://www.linkedin.com/in/youssef-hozayen-4047812b1/",
        gradYear: "2027",
        major: "Mechatronics and robotics engineering",
      }),
      department: "Team Leadership",
    },
    {
      ...slot("Team Leader", "Farah Harfoush", {
        photo: "farah-harfoush-2026",
        linkedIn: "https://www.linkedin.com/in/farah-harfoush-9297ab280",
        gradYear: "2026",
        major: "Mechatronics and Robotics",
      }),
      department: "Team Leadership",
    },
    { ...slot("EM Integration Lead", "Ziad Essam", {
        photo: "ziad-essam",
        linkedIn: "https://www.linkedin.com/in/ziad-essam-a202b3244",
      }), department: "Team Leadership" },
  ],
  divisions: [
    {
      num: "01",
      name: "Mechanical",
      sections: [
        section("Aerodesign", [
          slot("Section Lead", "Mohamed Elbarbary", {
            photo: "mohamed-barbary",
            linkedIn: "https://www.linkedin.com/in/muhammed-barbary",
            gradYear: "2026",
            major: "Mechanical",
          }),
          slot("Member", "Dani Georges", {
            photo: "dani-georges",
            linkedIn: "https://www.linkedin.com/in/dani-georges-813989276",
            gradYear: "2027",
            major: "Electromechanical",
          }),
          slot("Member", "Yahia Haitham", {
            photo: "yahia-haitham",
            linkedIn: "https://www.linkedin.com/in/yahia-haitham-377202292/",
            gradYear: "2028",
            major: "Mechatronics & Robotics",
          }),
        ], {
          blurb:
            "We shape how the aircraft flies — the aerodynamics of the whole airframe. We set the wing and tail geometry, run the analysis, and tune for lift, drag, and stable, efficient performance.",
        }),
        section("Structure", [
          slot("Section Lead", "Mira Barsoum", {
            linkedIn: "https://www.linkedin.com/in/mira-barsoum-457531297/",
            gradYear: "2026",
            major: "Mechatronics and Robotics",
          }),
          slot("Vice Section Lead", "Momen Ashraf", {
            photo: "momen-ahraf",
            linkedIn: "https://www.linkedin.com/in/mo-men-ashraf-b73647423/",
            gradYear: "2027",
            major: "Mechatronics",
          }),
          // Also promoted to vice, per the intake form.
          slot("Vice Section Lead", "Youssef Ibrahim", {
            photo: "youssef-ibrahim-2026",
            linkedIn: "https://www.linkedin.com/in/youssef-ibrahim-ba6761354/",
            gradYear: "2027",
            major: "Electromechanical",
          }),
          slot("Member", "Amr Hosny", {
            photo: "amr-hosny",
            linkedIn: "https://www.linkedin.com/in/amr-monib-4740361b7",
            gradYear: "2028",
            major: "Electromechanical",
          }),
        ], {
          blurb:
            "We design and build the airframe that holds everything together — sizing the load-bearing structure, choosing materials, and manufacturing the parts so the aircraft stays light and survives every flight.",
        }),
        // Co-leads — Hana and Rodyna run Propulsion together, no vice.
        section("Propulsion", [
          slot("Section Lead", "Hana Waleed", {
            photo: "hana-waleed-2026",
            linkedIn: "https://www.linkedin.com/in/hana-waleed-4688b1379/",
            gradYear: "2028",
            major: "Mechatronics",
          }),
          slot("Section Lead", "Rodyna Amr", {
            photo: "rodyna-amr-2026",
            linkedIn: "https://www.linkedin.com/in/rodyna-amr-5843772b0",
            gradYear: "2028",
            major: "Mechatronics",
          }),
        ], {
          blurb:
            "We power the aircraft — selecting motors and propellers, sizing the powertrain, and matching thrust to the mission so it takes off, climbs, and cruises reliably.",
        }),
      ],
    },
    {
      num: "02",
      name: "Autonomous",
      // Ziad Essam also heads Autonomous, on top of his top-level EM Integration Lead card.
      heads: [
        head("Head of Autonomous", "Ziad Essam", "Autonomous", {
          photo: "ziad-essam",
          linkedIn: "https://www.linkedin.com/in/ziad-essam-a202b3244",
        }),
        head("Vice Lead of Autonomous", "Mazen Asser", "Autonomous", {
          photo: "mazen-asser-2026",
          linkedIn: "https://www.linkedin.com/in/mazen-asser-8751a3244/",
          gradYear: "2026",
          major: "Computer and communication",
        }),
      ],
      sections: [
        section("AI", [
          slot("Section Lead", "Mohamed Bassem", {
            photo: "mohamed-bassem-2026",
            linkedIn: "https://www.linkedin.com/in/mohamed-bassem-abbas/",
            gradYear: "2026",
            major: "Computer & Communication Engineering",
          }),
          slot("Member", "Abdelrahman Aboelwafa", {
            photo: "abdelrahman-yasser",
            linkedIn: "https://www.linkedin.com/in/abdelrahmanaboelwafa",
            gradYear: "2028+",
            major: "CCE",
          }),
          slot("Member", "Ahmed ElMetwalli", {
            photo: "ahmed-elmetwalli",
            linkedIn: "https://www.linkedin.com/in/ahmed-el-mitwally-71385433b/",
            gradYear: "2028",
            major: "Computer and Communications",
          }),
          slot("Member", "Dina Shiha", {
            photo: "dina-shiha",
            linkedIn: "https://www.linkedin.com/in/dina-shiha-822b43203",
            gradYear: "2026",
            major: "Electromechanical Engineering",
          }),
          slot("Member", "Fai Raafat", {
            photo: "fai-raafat",
            linkedIn: "https://linkedin.com/in/fai-rotan-6832b835a",
            gradYear: "2027",
            major: "CCE",
          }),
          slot("Member", "Reem Eldalil", {
            photo: "reem-eldalil-2026",
            linkedIn: "https://eg.linkedin.com/in/reem-eldalil-645127223",
            gradYear: "2027",
            major: "Mechatronics",
          }),
          // Submitted the form, no photo yet.
          slot("Member", "Hossam Eldin Elshazly", {
            linkedIn: "https://www.linkedin.com/in/hossam-eldeen-2158a4284/",
            gradYear: "2027",
            major: "Computer and communication",
          }),
        ], {
          blurb:
            "We give the aircraft its eyes — detecting and tracking targets from the onboard camera, and turning raw images into the information the autonomy stack acts on.",
          icon: "computer-vision",
        }),
        // Youssef Hozayen also runs Hardware, on top of his top-level Vice Lead card.
        section("Hardware", [
          slot("Section Lead", "Youssef Hozayen", {
            photo: "youssef-hozayen-2026",
            linkedIn: "https://www.linkedin.com/in/youssef-hozayen-40478",
            gradYear: "2027",
            major: "Mechatronics and robotics engineering",
          }),
          slot("Vice Section Lead", "Menna Ezzat", {
            photo: "menna-ezzat-2026",
            linkedIn: "https://www.linkedin.com/in/menna-ezzat-bba468267/",
            gradYear: "2026",
            major: "Mechatronics",
          }),
          slot("Vice Section Lead", "Lina Tarek", {
            linkedIn: "https://www.linkedin.com/in/lina-ahmed-baa06a232",
            gradYear: "2027",
            major: "Mechatronics and Robotics",
          }),
          slot("Member", "Rewan Gomaa", {
            photo: "rewan-gomaa",
            linkedIn: "https://www.linkedin.com/in/rewan-mohamed-b5549624a/",
            gradYear: "2027",
            major: "Mechatronics",
          }),
          slot("Member", "Youssef Mohamed Fawzy", {
            photo: "youssef-fawzy",
            linkedIn: "https://www.linkedin.com/in/youssef-fawzy-1b93242a6/",
            gradYear: "2027",
            major: "Mechatronics and robotics",
          }),
          slot("Member", "Youssef Morgan", {
            photo: "youssef-morgan",
            linkedIn: "https://www.linkedin.com/in/youssefadell11",
            gradYear: "2027",
            major: "Mechatronics and Robotics Engineering",
          }),
        ], {
          blurb:
            "We build the electronics that make the aircraft think — the avionics, sensors, power systems, and wiring that connect the flight computer to everything on board.",
        }),
        // Co-leads — Mazen and Sara run Software together, no vice.
        section("Software", [
          slot("Section Lead", "Mazen Nazeih", {
            photo: "mazen-nazieh",
            linkedIn: "https://www.linkedin.com/in/mazen-nazeih-85a3b4277/",
            gradYear: "2026",
            major: "Computer and Communication",
          }),
          slot("Section Lead", "Sara Yasser Gharib", {
            photo: "sara-gharib-2026",
            linkedIn: "https://www.linkedin.com/in/sara-gharib-93a742322",
            gradYear: "2027",
            major: "Biomedical",
          }),
          slot("Member", "Ahmed Hisham EL Tantawy", {
            photo: "ahmed-tantawy",
            linkedIn: "https://www.linkedin.com/in/ahmed-tantawy-154025318/",
            gradYear: "2027",
            major: "Electromechanics",
          }),
          slot("Member", "Mariyam Ramadan", {
            photo: "mariyam-ramdan",
            linkedIn: "https://www.linkedin.com/in/mariyam-ramadan",
            gradYear: "2027",
            major: "Mechatronics",
          }),
          slot("Member", "Ahmed Ibrahim"),
          // Submitted the form, no photo yet.
          slot("Member", "Tarek Mohamed", {
            linkedIn: "https://www.linkedin.com/in/tarek-mohamed-elsaye",
            gradYear: "2027",
            major: "Computer and Communication",
          }),
        ], {
          blurb:
            "We write the software that flies the aircraft on its own — the control and navigation stack, mission logic, and the ground station that plans and monitors every autonomous flight.",
        }),
      ],
    },
  ],
};

/**
 * The real 2025 roster. Leadership titles for the trio are a best-guess mapping
 * of last year's three executives onto the design's three leadership slots —
 * confirm the names/titles before this goes public.
 */
const ROSTER_2025: YearRoster = {
  year: "2025",
  leadership: [
    { ...slot("Vice Lead", "Norhan Mohammed", { photo: "norhan-mohammed" }), department: "Team Leadership" },
    { ...slot("Team Leader", "Ahmed Baheyeldin", { photo: "ahmed-baheyeldin" }), department: "Team Leadership" },
    { ...slot("EM Integration Lead", "Peter Ayoub", { photo: "peter-ayoub" }), department: "Team Leadership" },
  ],
  divisions: [
    {
      num: "01",
      name: "Mechanical",
      sections: [
        section(
          "Structure",
          [
            slot("Section Lead", "Mohamed Fathallah", { photo: "mohamed-fathallah" }),
            slot("Vice Section Lead", "Ehdaa Farahat", { photo: "ehdaa-farahat" }),
            slot("Member", "Hana Waleed", { photo: "hana-waleed" }),
            slot("Member", "Hossam Eldeen", { photo: "hossam-eldeen" }),
            slot("Member", "Reem Eldalil", { photo: "reem-eldalil" }),
          ],
          {
            blurb:
              "We design and build the airframe that holds everything together — sizing the load-bearing structure, choosing materials, and manufacturing the parts so the aircraft stays light and survives every flight.",
          },
        ),
        // Aerodesign owns Wing and Tail & Stability; Hattan leads the aero core.
        section(
          "Aerodesign",
          [
            slot("Section Lead", "Hattan Yosry", { photo: "hattan-yosry" }),
            slot("Member", "Esraa Ahmed", { photo: "esraa-ahmed" }),
            slot("Member", "Farah Harfoush", { photo: "farah-harfoush" }),
            slot("Member", "Rodyna Amr", { photo: "rodyna-amr" }),
          ],
          {
            blurb:
              "We shape how the aircraft flies — the aerodynamics of the whole airframe. We set the wing and tail geometry, run the analysis, and tune for lift, drag, and stable, efficient performance.",
            subsections: [
              section(
                "Wing",
                [
                  slot("Section Lead", "Abdelrahman Arafat", { photo: "abdelrahman-arafat" }),
                  slot("Vice Section Lead", "Abdelghfour Alaa", { photo: "abdelghfour-alaa" }),
                  slot("Member", "Lina Tarek", { photo: "lina-tarek" }),
                  slot("Member", "Mira Barsoum", { photo: "mira-barsoum" }),
                  slot("Member", "Youssef Ibrahim", { photo: "youssef-ibrahim" }),
                ],
                {
                  blurb:
                    "We design the wing — airfoil selection, planform, and geometry — to generate the lift the aircraft needs while keeping drag low.",
                },
              ),
              section(
                "Tail & Stability",
                [
                  slot("Section Lead", "Osama Mohamed", { photo: "osama-mohamed" }),
                  slot("Member", "Mo'men Ashraf", { photo: "momen-ashraf" }),
                  slot("Member", "Moamen Nawara", { photo: "moamen-nawara" }),
                ],
                {
                  blurb:
                    "We design the tail and control surfaces, and make sure the aircraft stays stable and controllable through every phase of flight.",
                },
              ),
            ],
          },
        ),
        section(
          "Propulsion",
          [
            slot("Section Lead", "Adham Amr", { photo: "adham" }),
            slot("Vice Section Lead", "Youssef Hozayen", { photo: "youssef-hozayen" }),
            slot("Member", "Mohamed Brbry", { photo: "mohamed-brbry" }),
            slot("Member", "Rana", { photo: "rana" }),
          ],
          {
            blurb:
              "We power the aircraft — selecting motors and propellers, sizing the powertrain, and matching thrust to the mission so it takes off, climbs, and cruises reliably.",
          },
        ),
      ],
    },
    {
      num: "02",
      name: "Autonomous",
      // Ahmed Saleh heads Autonomous; Ibrahim Mohamed is his vice (and also CV lead).
      heads: [
        head("Head of Autonomous", "Ahmed Saleh", "Autonomous", { photo: "ahmed-saleh" }),
        head("Vice Lead of Autonomous", "Ibrahim Mohamed", "Autonomous", { photo: "ibrahim-mohamed" }),
      ],
      sections: [
        section(
          "Software",
          [
            slot("Section Lead", "Maram Wael", { photo: "maram-wael" }),
            slot("Vice Section Lead", "Ann Tarek", { photo: "ann-tarek" }),
            slot("Member", "Mazen Nazeih", { photo: "mazen-amr" }),
            slot("Member", "Sara Gharib", { photo: "sara-gharib" }),
            slot("Member", "Zeyad Essam", { photo: "zeyad-essam" }),
            slot("Member", "John Ayman", { photo: "john-ayman" }),
          ],
          {
            blurb:
              "We write the software that flies the aircraft on its own — the control and navigation stack, mission logic, and the ground station that plans and monitors every autonomous flight.",
          },
        ),
        section(
          "Hardware",
          [
            slot("Section Lead", "Ahmed Anan", { photo: "ahmed-ibrahim-anan" }),
            slot("Member", "Ahmed Saber", { photo: "ahmed-saber" }),
            slot("Member", "Ahmed Saeed", { photo: "ahmed-saeed" }),
            slot("Member", "Menna Ezzat", { photo: "menna-ezzat" }),
          ],
          {
            blurb:
              "We build the electronics that make the aircraft think — the avionics, sensors, power systems, and wiring that connect the flight computer to everything on board.",
          },
        ),
        section(
          "Computer Vision",
          [
            slot("Section Lead", "Ibrahim Mohamed", { photo: "ibrahim-mohamed" }),
            slot("Member", "Mazen Asser", { photo: "mazen-asser" }),
            slot("Member", "Eyad Ashraf", { photo: "eyad-ashraf" }),
            slot("Member", "Mohamed Bassem", { photo: "mohamed-bassem" }),
            slot("Member", "Peter Mina", { photo: "peter-mina" }),
            slot("Member", "Mohamed Elzayat", { photo: "mohamed-elzayat" }),
          ],
          {
            blurb:
              "We give the aircraft its eyes — detecting and tracking targets from the onboard camera, and turning raw images into the information the autonomy stack acts on.",
          },
        ),
      ],
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
  // A parent section and its subsections both get a nav row; subsections are
  // prefixed so the Wing/Tail entries read as living under Aerodesign.
  const sectionItems = (sections: Section[]): { name: string; href: string }[] =>
    sections.flatMap((s) => [
      { name: s.name, href: `#${s.id}` },
      ...(s.subsections ?? []).map((sub) => ({
        name: `— ${sub.name}`,
        href: `#${sub.id}`,
      })),
    ]);

  return [
    { label: "Leadership", items: [{ name: "Leadership", href: "#leadership" }] },
    ...roster.divisions.map((division) => ({
      label: division.name,
      items: sectionItems(division.sections),
    })),
  ];
}
