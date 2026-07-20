import {
  SUB_TEAMS,
  TEAM_FILTERS,
  type SubTeam,
  type TeamFilter,
} from "@/data/team";
import { teamAccent } from "./accents";

/**
 * FilterBar — squad filter pills, plus a second row of sub-team pills that
 * appears once a specific squad is selected.
 *
 * Selection state is owned by the Team page; this component is presentational.
 * The active sub-team pill picks up its squad's accent, so the two rows read as
 * one hierarchy.
 */

interface FilterBarProps {
  activeTeam: TeamFilter;
  activeSubTeam: SubTeam | null;
  onTeamChange: (team: TeamFilter) => void;
  onSubTeamChange: (subTeam: SubTeam | null) => void;
}

export default function FilterBar({
  activeTeam,
  activeSubTeam,
  onTeamChange,
  onSubTeamChange,
}: FilterBarProps) {
  // "All" has no sub-teams; every other squad exposes its own list.
  const subTeams = activeTeam === "All" ? [] : SUB_TEAMS[activeTeam];
  const accent = teamAccent(activeTeam);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* --- Squad row --------------------------------------------------- */}
      <div
        role="group"
        aria-label="Filter by team"
        className="flex flex-wrap justify-center gap-2.5"
      >
        {TEAM_FILTERS.map((team) => {
          const isActive = activeTeam === team;
          return (
            <button
              key={team}
              type="button"
              onClick={() => onTeamChange(team)}
              aria-pressed={isActive}
              className={
                "font-sans text-small font-semibold px-5 py-2.5 rounded-full border " +
                "transition-[background-color,border-color,color,transform] " +
                "duration-[150ms] ease-out hover:-translate-y-px " +
                (isActive
                  ? "text-fg border-transparent shadow-[var(--elevation-2)]"
                  : "text-fg-muted border-border bg-[var(--bg-surface)] hover:text-fg hover:border-border-strong")
              }
              style={
                isActive
                  ? {
                      background: teamAccent(team),
                      // Gold needs dark text for AA contrast; the indigo/sky
                      // accents are dark enough to carry white.
                      color: team === "Executive" ? "var(--bg-primary)" : "#fff",
                    }
                  : undefined
              }
            >
              {team}
            </button>
          );
        })}
      </div>

      {/* --- Sub-team row (only when a squad is selected) ------------------ */}
      {subTeams.length > 0 && (
        <div
          role="group"
          aria-label="Filter by sub-team"
          className="flex flex-wrap justify-center gap-2 px-4 py-3 rounded-xl
                     bg-[var(--bg-glass)] border border-border backdrop-blur-md"
        >
          {subTeams.map((sub) => {
            const isActive = activeSubTeam === sub;
            return (
              <button
                key={sub}
                type="button"
                // Clicking the active pill clears the sub-filter.
                onClick={() => onSubTeamChange(isActive ? null : sub)}
                aria-pressed={isActive}
                className={
                  "font-sans text-caption font-semibold px-3.5 py-1.5 rounded-full border " +
                  "transition-[background-color,border-color,color] duration-[150ms] ease-out " +
                  (isActive
                    ? ""
                    : "text-fg-muted border-border hover:text-fg hover:border-border-strong")
                }
                style={
                  isActive
                    ? {
                        color: accent,
                        borderColor: `color-mix(in srgb, ${accent} 55%, transparent)`,
                        background: `color-mix(in srgb, ${accent} 16%, transparent)`,
                      }
                    : undefined
                }
              >
                {sub}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
