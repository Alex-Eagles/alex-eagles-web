/**
 * accents.ts — maps team/role vocabulary onto the design-system tokens.
 *
 * Every color the Team page shows resolves through here, and every value is a
 * `var(--…)` from theme.css — no component hardcodes a hex. Re-theming the
 * squads is a one-line change in this file.
 */

import type { Role, Team } from "@/data/team";

/** The three squad accents, drawn from the brand palette. */
const TEAM_ACCENT: Record<Team, string> = {
  Executive: "var(--gold)",
  Mechanical: "var(--sky)",
  Autonomous: "var(--brand-light)",
};

/** Accent for a squad; falls back to brand for anything unmapped. */
export function teamAccent(team: Team | "All"): string {
  return team === "All" ? "var(--brand-light)" : TEAM_ACCENT[team];
}

/**
 * Role badge accent. Lead reads as the strongest (gold), Vice Lead a step
 * down (sky), Member the neutral brand tone.
 */
export function roleAccent(role: Role): string {
  if (role === "Lead") return "var(--gold)";
  if (role === "Vice Lead") return "var(--sky)";
  return "var(--brand-light)";
}

/**
 * Tinted "chip" styling built from an accent: faint fill, matching border,
 * accent text. Used by both the sub-team tag and the role badge.
 */
export function chipStyle(accent: string) {
  return {
    color: accent,
    borderColor: `color-mix(in srgb, ${accent} 42%, transparent)`,
    background: `color-mix(in srgb, ${accent} 12%, transparent)`,
  };
}
