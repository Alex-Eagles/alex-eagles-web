import { useMemo, useState } from "react";
import teamPhoto from "@/assets/team/team-2025.jpg";
import FilterBar from "@/components/team/FilterBar";
import TeamMembersSection from "@/components/team/TeamMembersSection";
import ScrollReveal from "@/components/ui/ScrollReveal";
import {
  SUB_TEAMS,
  TEAM_MEMBERS,
  type SubTeam,
  type TeamFilter,
} from "@/data/team";

/**
 * Team — the full roster: a photo hero, the squad/sub-team filters, and the
 * filtered members split into Leadership and Members.
 *
 * This page owns the filter state; FilterBar and TeamMembersSection are both
 * presentational, so the filtering logic lives in exactly one place.
 */
export default function Team() {
  const [activeTeam, setActiveTeam] = useState<TeamFilter>("All");
  const [activeSubTeam, setActiveSubTeam] = useState<SubTeam | null>(null);

  /** Switching squads clears the sub-filter — it belongs to the old squad. */
  function handleTeamChange(team: TeamFilter) {
    setActiveTeam(team);
    setActiveSubTeam(null);
  }

  /**
   * A sub-team is only applied when it actually belongs to the selected squad,
   * which keeps the list correct even if the two states ever drift apart.
   */
  const filtered = useMemo(() => {
    let result = TEAM_MEMBERS;

    if (activeTeam !== "All") {
      result = result.filter((m) => m.team === activeTeam);

      if (activeSubTeam && SUB_TEAMS[activeTeam].includes(activeSubTeam)) {
        result = result.filter((m) => m.subTeam === activeSubTeam);
      }
    }

    return result;
  }, [activeTeam, activeSubTeam]);

  return (
    <>
      {/* ---- Hero -------------------------------------------------------- */}
      <section className="relative min-h-[58vh] flex items-center justify-center overflow-hidden">
        <img
          src={teamPhoto}
          alt="The Alex Eagles team, 2025"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Scrim: keeps the headline readable and blends into the page below. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--bg-primary) 62%, transparent) 0%, " +
              "color-mix(in srgb, var(--bg-primary) 78%, transparent) 55%, var(--bg-primary) 100%)",
          }}
        />

        <div className="relative z-10 text-center px-6 py-24">
          <div className="eyebrow mb-3">Who flies the eagle</div>
          <h1 className="font-display font-extrabold text-h1 text-fg leading-none tracking-[var(--tracking-tight)] m-0 mb-5">
            The Eagles
          </h1>
          <p className="font-sans text-body-lg text-fg-muted leading-[1.7] max-w-[52ch] mx-auto m-0">
            {TEAM_MEMBERS.length} students across airframe, autonomy, and
            operations — meet the people who make the magic happen.
          </p>
        </div>
      </section>

      {/* ---- Filters + roster -------------------------------------------- */}
      <section className="max-w-[var(--maxw-content)] mx-auto px-6 pb-[100px]">
        <ScrollReveal className="mb-14">
          <FilterBar
            activeTeam={activeTeam}
            activeSubTeam={activeSubTeam}
            onTeamChange={handleTeamChange}
            onSubTeamChange={setActiveSubTeam}
          />
        </ScrollReveal>

        {/* Remount on filter change so cards re-run their entrance animation. */}
        <TeamMembersSection
          key={`${activeTeam}-${activeSubTeam ?? "none"}`}
          members={filtered}
        />
      </section>
    </>
  );
}
