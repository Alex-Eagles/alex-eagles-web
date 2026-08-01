/**
 * competitions.ts — THE CONTENT SOURCE for the History page's "Competitions
 * Participated In" section.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  HOW TO ADD A COMPETITION                                                ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                          ║
 * ║  1. Drop a 16:9 banner into:   public/competitions/                      ║
 * ║     WebP, ~760px wide. These are the competitions' own branding, so use  ║
 * ║     whatever they publish rather than making something.                  ║
 * ║                                                                          ║
 * ║  2. Add an entry to PROFILES below, keyed by the competition's short     ║
 * ║     name EXACTLY as it appears in achievements.ts:                       ║
 * ║                                                                          ║
 * ║         "SUAS": {                                                        ║
 * ║           fullName: "Student Unmanned Aerial Systems",                   ║
 * ║           blurb: "What the competition is, in a sentence or two.",       ║
 * ║           banner: "/competitions/suas.webp",                             ║
 * ║         }                                                                ║
 * ║                                                                          ║
 * ║  3. There is no step 3. The team's RECORD at that competition — which    ║
 * ║     years, how many appearances, how many awards — is read out of        ║
 * ║     achievements.ts, so it is already correct and stays correct.         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ─── THE RECORD IS DERIVED, THE DESCRIPTION IS AUTHORED ─────────────────────
 * This file holds only what can't be computed: what each competition IS. The
 * team's history with it is read from `achievements.ts` at render time.
 *
 * That split is the whole point. A hand-written "7 appearances, 8 awards" is a
 * number that silently goes stale the first time someone adds a year to the
 * timeline and doesn't think to update a different file. Deriving it means
 * competing at SAE again next season updates this section by itself — and a
 * competition entered for the FIRST time appears here automatically, needing
 * only a blurb and a banner.
 *
 * ─── ORDER ──────────────────────────────────────────────────────────────────
 * By FIRST APPEARANCE, which is the order the timeline above introduces them
 * in: SAE (2017), UAVC (2021), SUAS (2025). Not the order of PROFILES below —
 * that's a lookup table, and its key order is meaningless.
 */

import { achievements } from "@/data/achievements";
import type { Award, Competition } from "@/data/achievements";

/** What a competition is — the part that has to be written by hand. */
export interface CompetitionProfile {
  /** Expanded name, where the short name is an acronym. */
  fullName?: string;
  /**
   * The competition's own site. Optional: a competition without one still
   * renders in full, its name simply isn't a link.
   *
   * These are the organisers' pages, not ours, so they can move or go dark
   * without anything here noticing. If one starts 404ing, delete the line —
   * the row keeps working.
   */
  href?: string;
  /** One or two sentences on what the competition involves. */
  blurb: string;
  /**
   * 16:9 banners in `public/competitions/`, one per theme.
   *
   * Two files rather than one image with a CSS filter, for the same reason the
   * 3D scene ships two grades of each aircraft: only the one the current theme
   * uses is ever requested, so a visitor downloads exactly what they would have
   * downloaded anyway. A filter would instead have to run on every paint.
   *
   * They are also genuinely different artwork, not the same image tinted — the
   * dark set carries each competition's own branded field (SAE's gradient,
   * UAVC's navy, SUAS's blue) and the light set puts the same marks on white.
   */
  bannerDark: string;
  bannerLight: string;
}

/**
 * Keyed by the short name used in achievements.ts, so the two files can't
 * disagree about what a competition is called.
 *
 * The copy came across from the old site's `competitionData.js` essentially
 * verbatim — it's the team's own description of each event, and rewriting it
 * would mean inventing claims about competitions we don't run.
 */
export const PROFILES: Record<Competition, CompetitionProfile> = {
  "SAE Aero Design": {
    fullName: "SAE International: Aero Design",
    href: "https://www.sae.org/events/student/about/aero-design",
    blurb:
      "An esteemed international aerospace engineering event, conducted under the supervision of Lockheed Martin Co., challenges aspiring students to design and construct cutting-edge aircraft.",
    bannerDark: "/competitions/sae-dark.webp",
    bannerLight: "/competitions/sae-light.webp",
  },
  UAVC: {
    fullName: "Unmanned Aerial Vehicle Challenge",
    href: "https://uavc.conferences.ekb.eg/",
    blurb:
      "This competition immerses student teams in the domain of unmanned aerial systems (UAS) or drones. Teams engage in the intricate process of designing, constructing, and operating autonomous aerial vehicles for competitive missions.",
    bannerDark: "/competitions/uavc-dark.webp",
    bannerLight: "/competitions/uavc-light.webp",
  },
  SUAS: {
    fullName: "Student Unmanned Aerial Systems",
    href: "https://suas-competition.org/competitions/",
    blurb:
      "An arena for student teams in unmanned aerial systems (UAS) or drones, this competition involves designing, building, and operating autonomous aerial vehicles for diverse and challenging missions.",
    bannerDark: "/competitions/suas-dark.webp",
    bannerLight: "/competitions/suas-light.webp",
  },
};

/**
 * The order the section lists them in — set by hand, not derived.
 *
 * It used to sort by first appearance, which put SAE first because 2017 was the
 * earliest award on file. That reads as a ranking of history rather than of the
 * team's present, and the team's present is SUAS and UAVC. A competition
 * missing from this list still renders, after the ones named here.
 */
const DISPLAY_ORDER: Competition[] = ["SUAS", "UAVC", "SAE Aero Design"];

/** A competition, its description, and the team's record there. */
export interface CompetitionEntry extends CompetitionProfile {
  /** Short name, as used throughout achievements.ts. */
  name: Competition;
  /** Every year the team placed or won here, oldest first. */
  years: string[];
  /** Every award from this competition, oldest first. */
  awards: Award[];
}

/**
 * Every competition the team has entered, in DISPLAY_ORDER.
 *
 * A year in `achievements.ts` with no awards (2013, the founding year)
 * contributes nothing, which is right — it wasn't a competition year.
 */
export function competitionEntries(): CompetitionEntry[] {
  const byName = new Map<Competition, CompetitionEntry>();

  for (const achievement of achievements) {
    for (const award of achievement.awards) {
      let entry = byName.get(award.competition);

      if (!entry) {
        entry = {
          name: award.competition,
          ...PROFILES[award.competition],
          years: [],
          awards: [],
        };
        byName.set(award.competition, entry);
      }

      // Two awards at the SAME competition in one year (2022 at SAE) is still
      // one appearance — count the year once, both awards separately.
      if (!entry.years.includes(achievement.year)) {
        entry.years.push(achievement.year);
      }
      entry.awards.push(award);
    }
  }

  // Anything not named in DISPLAY_ORDER sorts after everything that is, in the
  // order it first appeared — so entering a new competition shows it on the
  // page immediately, rather than silently dropping it until someone
  // remembers to add it to the list above.
  return [...byName.values()].sort((a, b) => {
    const ai = DISPLAY_ORDER.indexOf(a.name);
    const bi = DISPLAY_ORDER.indexOf(b.name);
    return (ai === -1 ? Number.MAX_SAFE_INTEGER : ai) -
      (bi === -1 ? Number.MAX_SAFE_INTEGER : bi);
  });
}
