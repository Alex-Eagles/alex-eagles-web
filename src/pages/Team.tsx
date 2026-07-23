<<<<<<< HEAD
import TeamMembersSection from "@/components/team/TeamMembersSection";

/**
 * Team — the full roster page. All of the layout (photo hero, leadership row,
 * divisions → sections → member grid, jump nav) lives in TeamMembersSection,
 * which reads the roster from the data layer directly, so this page is just a
 * mount point.
 */
export default function Team() {
  return <TeamMembersSection />;
=======
import { useState } from "react";
import crewPhoto from "@/assets/team/crew.jpg";
import { JumpNav } from "@/components/team/JumpNav";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import { navGroups, ROSTER_YEARS, ROSTERS, type RosterYear } from "@/data/team";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import styles from "./Team.module.css";

/**
 * Team page — full-height crew hero with a year toggle, the leadership trio,
 * then each division's sections as card grids, plus the PULL jump nav.
 *
 * The site navbar is fixed and transparent until scrolled, so it sits over the
 * hero rather than pushing it down.
 */
export default function Team() {
  const [year, setYear] = useState<RosterYear>(ROSTER_YEARS[0]);
  const scrollY = useScrollPosition();

  const roster = ROSTERS[year];

  /* The hint fades and drifts down as you leave the hero — it only means
   * anything while the cards are still off-screen. */
  const hintOpacity = Math.max(0, 1 - scrollY / 180);
  const hintShift = Math.min(40, scrollY * 0.7);

  return (
    <div className={styles.page}>
      {/* ---- Hero -------------------------------------------------------- */}
      <header className={styles.hero}>
        <img className={styles.heroPhoto} src={crewPhoto} alt="The Alex Eagles team" />
        <div className={styles.heroScrim} aria-hidden />

        <div
          className={styles.heroHint}
          aria-hidden
          style={{ opacity: hintOpacity, transform: `translateY(${hintShift}px)` }}
        >
          <span className={styles.heroHintText}>Hover a card to reveal the person</span>
          <svg
            className={styles.heroHintArrow}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="m6 13 6 6 6-6" />
          </svg>
        </div>

        <div className={styles.heroCopy}>
          <div className={styles.heroCopyInner}>
            <p className={styles.heroEyebrow}>Meet the team</p>
            <h1 className={styles.heroTitle}>THE CREW</h1>
            <div className={styles.yearTabs} role="group" aria-label="Roster year">
              {ROSTER_YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={styles.yearTab}
                  aria-pressed={y === year}
                  onClick={() => setYear(y)}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ---- Leadership -------------------------------------------------- */}
      <section id="leadership" className={styles.leadership} aria-labelledby="leadership-heading">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionEyebrow}>Leadership</p>
          <h2 id="leadership-heading" className={styles.sectionHeading}>
            The people steering the team
          </h2>
        </div>

        {/* [left, centre, right] — the centre card is the raised one. */}
        <div className={styles.leadershipRow}>
          <div className={styles.leaderSide}>
            <TeamMemberCard member={roster.leadership[0]} rosterYear={roster.year} />
          </div>
          <div className={styles.leaderCentre}>
            <TeamMemberCard member={roster.leadership[1]} rosterYear={roster.year} />
          </div>
          <div className={styles.leaderSide}>
            <TeamMemberCard member={roster.leadership[2]} rosterYear={roster.year} />
          </div>
        </div>
      </section>

      {/* ---- Divisions --------------------------------------------------- */}
      {roster.divisions.map((division) => (
        <section key={division.num} aria-labelledby={`division-${division.num}`}>
          <div className={styles.divisionHeader}>
            <div className={styles.divisionHeaderInner}>
              <span className={styles.divisionNumber} aria-hidden>
                {division.num}
              </span>
              <p className={styles.sectionEyebrow}>Division</p>
              <h2 id={`division-${division.num}`} className={styles.divisionName}>
                {division.name}
              </h2>
            </div>
          </div>

          {division.sections.map((section) => (
            <div key={section.id} id={section.id} className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionMarker} aria-hidden />
                {section.name}
              </h3>
              <div className={styles.grid}>
                {section.members.map((member) => (
                  <TeamMemberCard key={member.id} member={member} rosterYear={roster.year} />
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}

      <div className={styles.pageFooter}>
        <p>Alex Eagles · Aerodesign team · {roster.year}</p>
      </div>

      <JumpNav groups={navGroups(roster)} />
    </div>
  );
>>>>>>> 127711238eba8b64611b66d37a5cd4fa3323e141
}
