import type { CSSProperties } from "react";
import { useState } from "react";
import crewPhoto from "@/assets/team/crew.jpg";
import crew2025Photo from "@/assets/team/team-2025.jpg";
import { JumpNav } from "@/components/team/JumpNav";
import { MemberCardSolid } from "@/components/team/MemberCardSolid";
import { SubTeamInfo } from "@/components/team/SubTeamInfo";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import {
  navGroups,
  ROSTER_YEARS,
  ROSTERS,
  type Section,
  splitByTier,
  subTeamAccent,
  type TeamMember,
  type RosterYear,
} from "@/data/team";
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

  /* 2025 uses the solid-backdrop colour-cutout card; 2026 uses the
   * grayscale→reveal hover card. Same props, so the grid code below is shared. */
  const Card = year === "2025" ? MemberCardSolid : TeamMemberCard;

  /* The hint fades and drifts down as you leave the hero — it only means
   * anything while the cards are still off-screen. */
  const hintOpacity = Math.max(0, 1 - scrollY / 180);
  const hintShift = Math.min(40, scrollY * 0.7);

  /* A row of cards for a set of members — used for both the raised lead row and
   * the member grid, differing only by the class the caller passes. */
  const cardRow = (members: TeamMember[], className: string) =>
    members.length > 0 && (
      <div className={className}>
        {members.map((member) => (
          <Card key={member.id} member={member} rosterYear={roster.year} />
        ))}
      </div>
    );

  /* Total headcount of a section including its nested subsections — shown in
   * the header so each sub-team reads as a countable unit. */
  const sectionCount = (section: Section): number =>
    section.members.length +
    (section.subsections?.reduce((n, s) => n + sectionCount(s), 0) ?? 0);

  /*
   * One sub-team block. Two visual modes, driven by the same data:
   *   - top-level  → a big banner header + divider, cards below
   *   - nested     → a lighter, indented header under an accent rule (Aerodesign
   *                  → Wing / Tail), no box around it
   * A themed info chip sits beside the title whenever the section has a blurb.
   */
  const renderSection = (section: Section, nested = false) => {
    const { leads, grid } = splitByTier(section.members);
    const accent = subTeamAccent(section.name);
    const count = sectionCount(section);
    const hasChildren = !!section.subsections?.length;

    return (
      <div
        key={section.id}
        id={section.id}
        className={nested ? styles.subPanel : styles.section}
        /* Accent drives the header, marker, and nested rule. */
        style={{ "--accent": accent } as CSSProperties}
      >
        <div className={nested ? styles.subHeader : styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h3 className={nested ? styles.subName : styles.sectionName}>
              <span className={styles.sectionMarker} aria-hidden />
              {section.name}
            </h3>
            {section.blurb && (
              <SubTeamInfo
                name={section.name}
                blurb={section.blurb}
                accent={accent}
                icon={section.icon}
              />
            )}
          </div>
          <span className={styles.sectionCount}>
            {count} {count === 1 ? "member" : "members"}
          </span>
        </div>

        {cardRow(leads, styles.leadRow)}
        {cardRow(grid, styles.grid)}

        {hasChildren && (
          <div className={styles.subGroup}>
            {section.subsections!.map((sub) => renderSection(sub, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {/* ---- Hero -------------------------------------------------------- */}
      <header className={styles.hero}>
        {/* Both crew photos stay mounted so switching years crossfades
            instead of popping — only the active year's photo is visible. */}
        <img
          className={`${styles.heroPhoto} ${year === "2026" ? styles.heroPhotoActive : ""}`}
          src={crewPhoto}
          alt="The Alex Eagles team"
        />
        <img
          className={`${styles.heroPhoto} ${year === "2025" ? styles.heroPhotoActive : ""}`}
          src={crew2025Photo}
          alt="The Alex Eagles team"
        />
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

      {/* `key={year}` remounts everything below on every year switch, which
          restarts the CSS fade/rise animation on .rosterContent — that's what
          makes changing years read as a transition rather than an instant
          content swap. */}
      <div key={year} className={styles.rosterContent}>
        {/* ---- Leadership ------------------------------------------------ */}
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
              <Card member={roster.leadership[0]} rosterYear={roster.year} />
            </div>
            <div className={styles.leaderCentre}>
              <Card member={roster.leadership[1]} rosterYear={roster.year} />
            </div>
            <div className={styles.leaderSide}>
              <Card member={roster.leadership[2]} rosterYear={roster.year} />
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

            {/* Division heads — Head / Vice — on a raised row above the sections. */}
            {division.heads && division.heads.length > 0 && (
              <div className={styles.divisionHeads}>
                {cardRow(division.heads, styles.leadRow)}
              </div>
            )}

            {division.sections.map((section) => renderSection(section))}
          </section>
        ))}

        <div className={styles.pageFooter}>
          <p>Alex Eagles · Aerodesign team · {roster.year}</p>
        </div>
      </div>

      <JumpNav groups={navGroups(roster)} />
    </div>
  );
}
