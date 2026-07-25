/**
 * press.ts — THE CONTENT SOURCE for the History page's "Coverage, papers &
 * competitions" section.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  HOW TO ADD A PIECE OF MEDIA COVERAGE OR A PUBLICATION                   ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                          ║
 * ║  Add an object to `coverage` or `publications` below. Only four fields   ║
 * ║  are required — id, title, outlet, date — and everything else is         ║
 * ║  optional, so an entry you only half-know is still worth adding:         ║
 * ║                                                                          ║
 * ║      {                                                                   ║
 * ║        id: "2025-al-ahram",          // any stable, unique string        ║
 * ║        title: "Alexandria students fly at SUAS",                         ║
 * ║        outlet: "Al-Ahram",           // paper, channel, journal, venue   ║
 * ║        date: "June 2025",            // free text: "2025" is fine too    ║
 * ║        href: "https://…",            // omit for an offline clipping     ║
 * ║        blurb: "One or two sentences on what it covered.",                ║
 * ║        language: "Arabic",           // omit when it's in English        ║
 * ║      }                                                                   ║
 * ║                                                                          ║
 * ║  Publications take the same shape plus `authors`, and use `outlet` for   ║
 * ║  the journal or conference the paper appeared at.                        ║
 * ║                                                                          ║
 * ║  ORDER: newest first. Nothing sorts these automatically — the section    ║
 * ║  renders them in the order written here, on purpose, so a piece can be   ║
 * ║  deliberately pinned to the top.                                         ║
 * ║                                                                          ║
 * ║  EMPTY IS SAFE. A category with no entries drops out of the section's    ║
 * ║  filter bar entirely rather than rendering an empty shelf, and if all    ║
 * ║  three are empty the whole section stops rendering. So these arrays can  ║
 * ║  ship empty and fill in later without anything ever looking broken.      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ─── WHY COMPETITIONS AREN'T LISTED HERE ────────────────────────────────────
 * They're DERIVED from `achievements.ts` at the bottom of this file, not typed
 * out again. The years the team competed, how many awards each competition
 * produced and what those awards were are all already recorded there, and a
 * second hand-maintained copy would start disagreeing with the timeline the
 * first time an award was added to one and not the other.
 *
 * So adding a year to `achievements.ts` also updates the competitions shelf
 * here — including a competition the team enters for the FIRST time, which
 * appears on its own with no code change.
 */

import { achievements } from "@/data/achievements";
import type { Award, Competition } from "@/data/achievements";

/** Which shelf an item sits on. */
export type PressKind = "coverage" | "publication";

/** A newspaper piece, a TV segment, a conference paper — anything published. */
export interface PressItem {
  /** Stable unique key. Never shown. */
  id: string;
  /** The headline, or the paper's title. */
  title: string;
  /** Who carried it: the paper, channel, journal or conference. */
  outlet: string;
  /**
   * Display date, as free text — "June 2025", "2025", "Spring 2024" all work.
   * Deliberately not a Date: half of these are remembered as a month and a
   * year, and a real Date would force inventing a day we don't know.
   */
  date: string;
  /** One or two sentences of context. Optional. */
  blurb?: string;
  /** Link to the piece. Omit for a print clipping with nowhere to point. */
  href?: string;
  /** Named authors — for publications. */
  authors?: string[];
  /** Noted only when it ISN'T English, e.g. "Arabic". */
  language?: string;
}

/**
 * ─── MEDIA COVERAGE ─────────────────────────────────────────────────────────
 * Press, TV and online pieces ABOUT the team. Newest first.
 *
 * Empty until the real clippings are supplied — see the box at the top. Adding
 * the first entry is what makes the "Media coverage" filter appear.
 */
export const coverage: PressItem[] = [];

/**
 * ─── PUBLICATIONS ───────────────────────────────────────────────────────────
 * Papers, technical design reports and articles the team WROTE. Newest first.
 *
 * Note that the UAVC and SUAS "Best Technical Design Report" awards in
 * `achievements.ts` are awards for documents that exist — those reports are
 * the most obvious first entries here, once someone confirms their exact
 * titles and where they can be read.
 */
export const publications: PressItem[] = [];

/**
 * One competition the team has entered, summarised across every year.
 *
 * Built by `competitionRecords()`, never written by hand.
 */
export interface CompetitionRecord {
  /** The short name, as used throughout achievements.ts. */
  competition: Competition;
  /** Expanded name, where we can state one without guessing. */
  fullName?: string;
  /** Every year the team placed or won here, oldest first. */
  years: string[];
  /** Every award from this competition, oldest first. */
  awards: Award[];
}

/**
 * Long-form names for the competition acronyms.
 *
 * UAVC is absent on purpose. The expansion isn't something we can state from
 * the team's own records, and the section reads perfectly well with just the
 * acronym — better than with a plausible-sounding guess printed under it as
 * though it were fact.
 */
const FULL_NAMES: Partial<Record<Competition, string>> = {
  "SAE Aero Design": "SAE International — Aero Design",
  SUAS: "AUVSI Student Unmanned Aerial Systems",
};

/**
 * Every competition the team has entered, ordered by FIRST APPEARANCE — the
 * order the team actually met them, which is the same order the timeline above
 * introduces them in.
 *
 * Derived, so it can't drift from the timeline. A year in `achievements.ts`
 * with no awards (2013, the founding year) contributes nothing here, which is
 * right: it wasn't a competition year.
 */
export function competitionRecords(): CompetitionRecord[] {
  const byCompetition = new Map<Competition, CompetitionRecord>();

  for (const achievement of achievements) {
    for (const award of achievement.awards) {
      let record = byCompetition.get(award.competition);

      if (!record) {
        record = {
          competition: award.competition,
          fullName: FULL_NAMES[award.competition],
          years: [],
          awards: [],
        };
        byCompetition.set(award.competition, record);
      }

      // A year with two awards at the SAME competition (2022) is still one
      // year of competing — count it once.
      if (!record.years.includes(achievement.year)) {
        record.years.push(achievement.year);
      }
      record.awards.push(award);
    }
  }

  return [...byCompetition.values()];
}
