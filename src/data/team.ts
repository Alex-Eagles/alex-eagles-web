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
export type Team = "Executive" | "Mechanical" | "Autonomous";
export type TeamFilter = "All" | Team;

export type MechanicalSubTeam =
  | "Management"
  | "Aerodesign"
  | "Wing"
  | "Tail & Stability"
  | "Structure"
  | "Propulsion";

export type AutonomousSubTeam =
  | "Management"
  | "Software"
  | "Hardware"
  | "Computer Vision"
  | "Firmware";

export type ExecutiveSubTeam = "Management";

export type SubTeam =
  | MechanicalSubTeam
  | AutonomousSubTeam
  | ExecutiveSubTeam;

/** Leadership ranks. Drives both card badges and the Leadership/Members split. */
export type Role = "Lead" | "Vice Lead" | "Member";

export interface TeamMember {
  id: string;
  name: string;
  role: Role;
  team: Team;
  subTeam: SubTeam;
  /** Academic year, e.g. "3". */
  year: string;
  major: string;
  /** Photo slug — the filename (no extension) in src/assets/members/. */
  photo?: string;
  linkedIn?: string;
}

/* ---------------------------------------------------------------------------
 * 2. PHOTO RESOLUTION
 * -------------------------------------------------------------------------*/

/**
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
  "Executive",
  "Mechanical",
  "Autonomous",
] as const;

/** Sub-teams offered once a squad is selected. "All" shows none. */
export const SUB_TEAMS: Record<Team, readonly SubTeam[]> = {
  Executive: ["Management"],
  Mechanical: [
    "Management",
    "Aerodesign",
    "Wing",
    "Tail & Stability",
    "Structure",
    "Propulsion",
  ],
  Autonomous: [
    "Management",
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
  { id: "1", name: "Ahmed Baheyeldin", role: "Lead", team: "Executive", subTeam: "Management", year: "4", major: "Mechatronics", photo: "ahmed-baheyeldin" },
  { id: "2", name: "Norhan Mohammed", role: "Vice Lead", team: "Executive", subTeam: "Management", year: "4", major: "Mechatronics", photo: "norhan-mohammed" },
  { id: "3", name: "Peter Ayoub", role: "Lead", team: "Executive", subTeam: "Management", year: "4", major: "Electromechanics", photo: "peter-ayoub" },

  /* ---- Autonomous — leads ------------------------------------------------ */
  { id: "4", name: "Ahmed Saleh", role: "Lead", team: "Autonomous", subTeam: "Management", year: "4", major: "Computer and Communications", photo: "ahmed-saleh" },
  { id: "5", name: "Ibrahim Mohamed", role: "Vice Lead", team: "Autonomous", subTeam: "Computer Vision", year: "4", major: "Computer and Communications", photo: "ibrahim-mohamed" },
  { id: "6", name: "Ahmed Anan", role: "Lead", team: "Autonomous", subTeam: "Hardware", year: "4", major: "Mechatronics", photo: "ahmed-ibrahim-anan" },
  { id: "7", name: "Maram Wael", role: "Lead", team: "Autonomous", subTeam: "Software", year: "4", major: "Computer and Communications", photo: "maram-wael" },
  { id: "8", name: "Ann Tarek", role: "Vice Lead", team: "Autonomous", subTeam: "Software", year: "3", major: "Computer and Communications", photo: "ann-tarek" },

  /* ---- Autonomous — members ---------------------------------------------- */
  { id: "9", name: "Mazen Nazeih", role: "Member", team: "Autonomous", subTeam: "Software", year: "3", major: "Computer and Communications", photo: "mazen-amr" },
  { id: "10", name: "Sara Gharib", role: "Member", team: "Autonomous", subTeam: "Software", year: "3", major: "Computer and Communications", photo: "sara-gharib" },
  { id: "11", name: "Zeyad Essam", role: "Member", team: "Autonomous", subTeam: "Software", year: "2", major: "Computer and Communications", photo: "zeyad-essam" },
  { id: "12", name: "John Ayman", role: "Member", team: "Autonomous", subTeam: "Software", year: "2", major: "Computer and Communications", photo: "john-ayman" },
  { id: "13", name: "Ahmed Saber", role: "Member", team: "Autonomous", subTeam: "Hardware", year: "3", major: "Mechatronics", photo: "ahmed-saber" },
  { id: "14", name: "Ahmed Saeed", role: "Member", team: "Autonomous", subTeam: "Hardware", year: "3", major: "Mechatronics", photo: "ahmed-saeed" },
  { id: "15", name: "Menna Ezzat", role: "Member", team: "Autonomous", subTeam: "Hardware", year: "2", major: "Mechatronics", photo: "menna-ezzat" },
  { id: "16", name: "Mazen Asser", role: "Member", team: "Autonomous", subTeam: "Computer Vision", year: "3", major: "Computer and Communications", photo: "mazen-asser" },
  { id: "17", name: "Eyad Ashraf", role: "Member", team: "Autonomous", subTeam: "Computer Vision", year: "3", major: "Computer and Communications", photo: "eyad-ashraf" },
  { id: "18", name: "Mohamed Bassem", role: "Member", team: "Autonomous", subTeam: "Computer Vision", year: "2", major: "Computer and Communications", photo: "mohamed-bassem" },
  { id: "19", name: "Peter Mina", role: "Member", team: "Autonomous", subTeam: "Computer Vision", year: "2", major: "Computer and Communications", photo: "peter-mina" },
  { id: "20", name: "Mohamed Elzayat", role: "Member", team: "Autonomous", subTeam: "Computer Vision", year: "2", major: "Computer and Communications", photo: "mohamed-elzayat" },

  /* ---- Mechanical — leads ------------------------------------------------ */
  { id: "21", name: "Mohamed Fathallah", role: "Lead", team: "Mechanical", subTeam: "Management", year: "4", major: "Electromechanics", photo: "mohamed-fathallah" },
  { id: "22", name: "Hattan Yosry", role: "Lead", team: "Mechanical", subTeam: "Aerodesign", year: "4", major: "Mechatronics", photo: "hattan-yosry" },
  { id: "23", name: "Ehdaa Farahat", role: "Lead", team: "Mechanical", subTeam: "Structure", year: "4", major: "Electromechanics", photo: "ehdaa-farahat" },
  { id: "24", name: "Osama Mohamed", role: "Vice Lead", team: "Mechanical", subTeam: "Tail & Stability", year: "4", major: "Mechatronics", photo: "osama-mohamed" },
  { id: "25", name: "Abdelrahman Arafat", role: "Lead", team: "Mechanical", subTeam: "Wing", year: "4", major: "Electromechanics", photo: "abdelrahman-arafat" },
  { id: "26", name: "Abdelghfour Alaa", role: "Lead", team: "Mechanical", subTeam: "Wing", year: "4", major: "Mechatronics", photo: "abdelghfour-alaa" },
  { id: "27", name: "Adham Amr", role: "Lead", team: "Mechanical", subTeam: "Propulsion", year: "4", major: "Electromechanics", photo: "adham" },
  { id: "28", name: "Youssef Hozayen", role: "Vice Lead", team: "Mechanical", subTeam: "Propulsion", year: "3", major: "Mechatronics", photo: "youssef-hozayen" },

  /* ---- Mechanical — members ---------------------------------------------- */
  { id: "29", name: "Esraa Ahmed", role: "Member", team: "Mechanical", subTeam: "Aerodesign", year: "3", major: "Electromechanics", photo: "esraa-ahmed" },
  { id: "30", name: "Farah Harfoush", role: "Member", team: "Mechanical", subTeam: "Aerodesign", year: "3", major: "Mechatronics", photo: "farah-harfoush" },
  { id: "31", name: "Hana Waleed", role: "Member", team: "Mechanical", subTeam: "Structure", year: "3", major: "Electromechanics", photo: "hana-waleed" },
  { id: "32", name: "Hossam Eldeen", role: "Member", team: "Mechanical", subTeam: "Structure", year: "2", major: "Mechatronics", photo: "hossam-eldeen" },
  { id: "33", name: "Lina Tarek", role: "Member", team: "Mechanical", subTeam: "Wing", year: "2", major: "Electromechanics", photo: "lina-tarek" },
  { id: "34", name: "Mira Barsoum", role: "Member", team: "Mechanical", subTeam: "Wing", year: "2", major: "Mechatronics", photo: "mira-barsoum" },
  { id: "35", name: "Mo’men Ashraf", role: "Member", team: "Mechanical", subTeam: "Tail & Stability", year: "2", major: "Electromechanics", photo: "momen-ashraf" },
  { id: "36", name: "Moamen Nawara", role: "Member", team: "Mechanical", subTeam: "Tail & Stability", year: "2", major: "Mechatronics", photo: "moamen-nawara" },
  { id: "37", name: "Mohamed Brbry", role: "Member", team: "Mechanical", subTeam: "Propulsion", year: "2", major: "Electromechanics", photo: "mohamed-brbry" },
  { id: "38", name: "Rana", role: "Member", team: "Mechanical", subTeam: "Propulsion", year: "1", major: "Mechatronics", photo: "rana" },
  { id: "39", name: "Reem Eldalil", role: "Member", team: "Mechanical", subTeam: "Structure", year: "1", major: "Electromechanics", photo: "reem-eldalil" },
  { id: "40", name: "Rodyna Amr", role: "Member", team: "Mechanical", subTeam: "Aerodesign", year: "1", major: "Mechatronics", photo: "rodyna-amr" },
  { id: "41", name: "Youssef Ibrahim", role: "Member", team: "Mechanical", subTeam: "Wing", year: "1", major: "Electromechanics", photo: "youssef-ibrahim" },
];
