/**
 * team.ts — the roster behind the Team page, plus the small type vocabulary
 * (teams, sub-teams, roles) the Team components share.
 *
 * Photos live in `src/assets/members/<slug>.<ext>` and are resolved at build
 * time by the `import.meta.glob` map below, so adding a member is two steps:
 *   1. drop a kebab-case photo into src/assets/members/
 *   2. add a row to TEAM_MEMBERS with `photo` set to that file's slug
 * A row whose photo is missing simply falls back to the avatar placeholder.
 */

/* ---------------------------------------------------------------------------
 * 1. TYPES
 * -------------------------------------------------------------------------*/

/** Top-level squads. `All` exists only as a filter option, never on a member. */
export type Team = "Management" | "Mechanical" | "Autonomous";
export type TeamFilter = "All" | Team;

export type SubTeam =
  | "Executive"
  | "Aerodesign"
  | "Wing"
  | "Tail & Stability"
  | "Structure"
  | "Propulsion"
  | "Software"
  | "Hardware"
  | "Computer Vision"
  | "Firmware";

  
export type Bio =
  | "Mechatronics and Robotics\n2026"
  | "Mechatronics and Robotics\n2027"
  | "Mechatronics and Robotics\n2028"
  | "Mechatronics and Robotics\n2029"
  | "Computer and Communications\n2026"
  | "Computer and Communications\n2027"
  | "Computer and Communications\n2028"
  | "Computer and Communications\n2029"
  | "Electromechanics\n2026"
  | "Electromechanics\n2027"
  | "Electromechanics\n2028"
  | "Electromechanics\n2029"
  |"Biomedical Engineering\n2026"
  |"Biomedical Engineering\n2027"
  |"Biomedical Engineering\n2028"
  |"Biomedical Engineering\n2029"
  |"Mechanical Engineering\n2026"
  |"Mechanical Engineering\n2027"
  |"Mechanical Engineering\n2028"
  |"Mechanical Engineering\n2029";

/** Leadership ranks. Drives both card badges and the Leadership/Members split. */
export type Role = "Lead" | "Vice Lead" | "Member";

export interface TeamMember {
  id: string;
  name: string;
  role: Role;
  team: Team;
  subTeam: SubTeam;
  /** For members holding a second position, e.g. "Software Lead". */
  secondRole?: string;
  /** Freeform line(s) shown under the name — write whatever you want here. */
  bio?: Bio
  photo?: string;
  linkedIn?: string;
}

/* 
 * 2. PHOTO RESOLUTION
/*
 * Eagerly import every member photo so Vite fingerprints and bundles them.
 * Keys come back as full relative paths; we re-key them by bare slug.
 */

const photoModules = import.meta.glob<{ default: string }>(
  "../assets/members/*.{jpg,jpeg,png,webp}",
  { eager: true },
);

const PHOTOS: Record<string, string> = Object.fromEntries(
  Object.entries(photoModules).map(([path, mod]) => [
    // "../assets/members/ahmed-saber.jpeg" → "ahmed-saber"
    path.split("/").pop()!.replace(/\.[^.]+$/, ""),
    mod.default,
  ]),
);

/** Resolved photo URL for a member, or undefined if no file matches. */
export function memberPhoto(member: TeamMember): string | undefined {
  return member.photo ? PHOTOS[member.photo] : undefined;
}

/* ---------------------------------------------------------------------------
 * 3. FILTER VOCABULARY  (single source of truth for the FilterBar)
 * -------------------------------------------------------------------------*/

export const TEAM_FILTERS: readonly TeamFilter[] = [
  "All",
  "Management",
  "Mechanical",
  "Autonomous",
] as const;

/** Sub-teams offered once a squad is selected. "All" shows none. */
export const SUB_TEAMS: Record<Team, readonly SubTeam[]> = {
  Management: ["Executive"],
  Mechanical: [
    "Aerodesign",
    "Wing",
    "Tail & Stability",
    "Structure",
    "Propulsion",
  ],
  Autonomous: [
    "Software",
    "Hardware",
    "Computer Vision",
    "Firmware",
  ],
};

/* ---------------------------------------------------------------------------
 * 4. THE ROSTER
 * -------------------------------------------------------------------------*/

export const TEAM_MEMBERS: TeamMember[] = [
  /* ---- Executive leadership ---------------------------------------------- */
  { id: "1", name: "Farah Yasser Harfoush", role: "Lead", team: "Management", subTeam: "Executive", bio: "Mechatronics and Robotics\n2026", photo: "ahmed-baheyeldin" },
  { id: "2", name: "Youssef Hozayen", role: "Lead", team: "Management", subTeam: "Executive", secondRole: "Hardware Lead", bio: "Mechatronics and Robotics\n2027", photo: "norhan-mohammed" },
  { id: "3", name: "Ziad Essam", role: "Lead", team: "Management", subTeam: "Executive", secondRole: "Autonomous Lead", bio: "Computer and Communications\n2026", photo: "peter-ayoub" },
  { id: "4", name: "Mazen Asser", role: "Vice Lead", team: "Autonomous", subTeam: "Executive", secondRole: "Autonomous Vice Lead", bio: "Computer and Communications\n2026", photo: "mazen-amr" },

  /* ---- Autonomous — leads ------------------------------------------------ */
  { id: "5", name: "Mohamed Bassem", role: "Lead", team: "Autonomous", subTeam: "Computer Vision", bio: "Computer and Communications\n2026", photo: "ahmed-saleh" },
  { id: "6", name: "Sara Gharib", role: "Lead", team: "Autonomous", subTeam: "Software", bio:"Biomedical engineering\n2027", photo: "ibrahim-mohamed" },
  { id: "7", name: "Mazen Nazeih", role: "Lead", team: "Autonomous", subTeam: "Software", bio: "Computer and Communications\n2026", photo: "ahmed-ibrahim-anan" },
  { id: "8", name: "Menna Ezzat", role: "Vice Lead", team: "Autonomous", subTeam: "Hardware", bio: "Mechatronics and robotics\n2026", photo: "maram-wael" },
  { id: "9", name: "Lina Tarek", role: "Vice Lead", team: "Autonomous", subTeam: "Hardware", bio: "Mechatronics and robotics\n2027", photo: "lina-tarek" },

  /* ---- Autonomous — members ---------------------------------------------- */
  { id: "10", name: "Rewan Gomaa", role: "Member", team: "Autonomous", subTeam: "Software", bio: "Year 3 — Computer and Communications", photo: "sara-gharib" },
  { id: "11", name: "Zeyad Essam", role: "Member", team: "Autonomous", subTeam: "Software", bio: "Year 2 — Computer and Communications", photo: "zeyad-essam" },
  { id: "12", name: "John Ayman", role: "Member", team: "Autonomous", subTeam: "Software", bio: "Year 2 — Computer and Communications", photo: "john-ayman" },
  { id: "13", name: "Ahmed Saber", role: "Member", team: "Autonomous", subTeam: "Hardware", bio: "Year 3 — Mechatronics", photo: "ahmed-saber" },
  { id: "14", name: "Ahmed Saeed", role: "Member", team: "Autonomous", subTeam: "Hardware", bio: "Year 3 — Mechatronics", photo: "ahmed-saeed" },


  /* ---- Mechanical — leads ------------------------------------------------ */
  { id: "21", name: "Mohamed ElBarbary", role: "Lead", team: "Mechanical", subTeam: "Aerodesign", bio: "Mechanical Engineering\n2026", photo: "mohamed-elbarbary" },
  { id: "22", name: "Rodyna Amr", role: "Lead", team: "Mechanical", subTeam: "Propulsion", bio: "Mechatronics and Robotics\n2028", photo: "rodyna-amr" },
  { id: "23", name: "Mo`men Ashraf", role: "Vice Lead", team: "Mechanical", subTeam: "Structure", bio: "Mechatronics and Robotics\n2027", photo: "momen-ashraf" },
  { id: "25", name: "Youssef Ibrahim", role: "Vice Lead", team: "Mechanical", subTeam: "Structure", bio: "Electromechanics\n2027", photo: "youssef-ibrahim" },


  /* ---- Mechanical — members ---------------------------------------------- */
  { id: "29", name: "Esraa Ahmed", role: "Member", team: "Mechanical", subTeam: "Aerodesign", bio: "Year 3 — Electromechanics", photo: "esraa-ahmed" },
  { id: "30", name: "Farah Harfoush", role: "Member", team: "Mechanical", subTeam: "Aerodesign", bio: "Year 3 — Mechatronics", photo: "farah-harfoush" },
  { id: "31", name: "Hana Waleed", role: "Member", team: "Mechanical", subTeam: "Structure", bio: "Year 3 — Electromechanics", photo: "hana-waleed" },
  { id: "32", name: "Hossam Eldeen", role: "Member", team: "Mechanical", subTeam: "Structure", bio: "Year 2 — Mechatronics", photo: "hossam-eldeen" },
  { id: "33", name: "Lina Tarek", role: "Member", team: "Mechanical", subTeam: "Wing", bio: "Year 2 — Electromechanics", photo: "lina-tarek" },

];
