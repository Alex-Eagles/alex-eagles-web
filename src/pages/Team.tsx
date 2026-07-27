import type { CSSProperties } from "react";
import { useState } from "react";
import crew2026_1280 from "@/assets/team/crew-2026-1280.webp";
import crew2026_1920 from "@/assets/team/crew-2026-1920.webp";
import crew2026_2560 from "@/assets/team/crew-2026-2560.webp";
import crew2026_3840 from "@/assets/team/crew-2026-3840.webp";
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
  splitRows,
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
export default function Team({
  initialYear,
}: {
  /** Overrides the default starting tab — used by the static-export script. */
  initialYear?: RosterYear;
} = {}) {
  const [year, setYear] = useState<RosterYear>(initialYear ?? ROSTER_YEARS[0]);
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
  const cardRow = (members: TeamMember[], className: string, key?: number) =>
    members.length > 0 && (
      <div key={key} className={className}>
        {members.map((member) => (
          <Card key={member.id} member={member} rosterYear={roster.year} />
        ))}
      </div>
    );

  /*
   * One sub-team block: a banner header with the headcount and a themed info
   * chip (whenever the section has a blurb), then the lead column, a divider,
   * and the member rows beside it.
   */
  const renderSection = (section: Section) => {
    const { leads, vices, grid } = splitByTier(section.members);
    const accent = subTeamAccent(section.name);
    const count = section.members.length;

    const people = [...vices, ...grid];

    /*
     * A roster that fits one row goes in one row — vices first, so rank still
     * reads left-to-right, and a section with two vices and one member doesn't
     * split into two ragged rows. Any longer and the vices take their own row
     * above the members, which keeps rank legible instead of letting a vice
     * and a member share a line only because the wrap happened to land there.
     */
    const singleRow = people.length <= 3;

    /* A short roster is centred on the lead card's midline instead of hanging
     * off its top edge, which left an obvious hole under two or three cards
     * sitting beside a much taller lead. Past three the row is tall enough
     * that top alignment reads better again. */
    const centrePeople = leads.length > 0 && people.length >= 2 && people.length <= 3;

    return (
      <div
        key={section.id}
        id={section.id}
        className={styles.section}
        /* Accent drives the header and the marker. */
        style={{ "--accent": accent } as CSSProperties}
      >
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionName}>
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

        <div className={styles.sectionBody}>
          {cardRow(
            leads,
            `${styles.leadRow}${section.stackLeads ? ` ${styles.leadRowStacked}` : ""}`,
          )}
          {leads.length > 0 && people.length > 0 && (
            <div className={styles.sectionDivider} aria-hidden />
          )}
          <div
            className={`${styles.sectionRight}${
              centrePeople ? ` ${styles.sectionRightCentred}` : ""
            }`}
          >
            {singleRow ? (
              cardRow(people, styles.grid)
            ) : (
              <>
                {/* Same grid as the members, plus a hook so the phone layout can
                    keep vices a size above them — see .gridRanked. */}
                {cardRow(vices, `${styles.grid} ${styles.gridRanked}`)}
                {/* One row per `breakBefore` group — normally just the one. */}
                {splitRows(grid).map((row, i) => cardRow(row, styles.grid, i))}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {/* ---- Hero -------------------------------------------------------- */}
      <header className={styles.hero}>
        {/* Both crew photos stay mounted so switching years crossfades
            instead of popping — only the active year's photo is visible.

            The hero is the one image on this page that scales with the
            viewport (100% of a 100svh header, object-fit: cover), so the
            pixels it needs grow with both screen width and DPR — a 2560px
            monitor at 2x wants ~5120px of image. `srcset` + `sizes="100vw"`
            lets the browser pull only the variant its screen actually needs
            instead of everyone paying for the 4K file.

            2025 has no srcset: 1280x960 is the largest copy of that photo
            that exists anywhere in the repo, so there is nothing to offer a
            bigger screen. It will soften past ~1280px wide until someone
            digs out the original. */}
        <img
          className={`${styles.heroPhoto} ${year === "2026" ? styles.heroPhotoActive : ""}`}
          src={crew2026_1920}
          srcSet={`${crew2026_1280} 1280w, ${crew2026_1920} 1920w, ${crew2026_2560} 2560w, ${crew2026_3840} 3840w`}
          sizes="100vw"
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
          {/* Two copies, one per input model — CSS shows whichever matches, so
              a phone isn't told to hover something it can't. */}
          <span className={`${styles.heroHintText} ${styles.heroHintHover}`}>
            Hover a card to reveal the person
          </span>
          <span className={`${styles.heroHintText} ${styles.heroHintTap}`}>
            Tap a card to reveal the person
          </span>
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
