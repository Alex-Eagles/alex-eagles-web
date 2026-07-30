import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
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
  rosterStats,
  ROSTER_YEARS,
  ROSTERS,
  type Section,
  slugify,
  splitByTier,
  splitRows,
  subTeamAccent,
  type TeamMember,
  type RosterYear,
} from "@/data/team";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import styles from "./Team.module.css";

/** Must match .page's background in Team.module.css. */
const PAGE_BG = "#141a26";

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

  // A search result for a past roster carries ?year=, so open that tab.
  const [searchParams] = useSearchParams();
  const yearParam = searchParams.get("year");
  useEffect(() => {
    if (yearParam && (ROSTER_YEARS as readonly string[]).includes(yearParam)) {
      setYear(yearParam as RosterYear);
    }
  }, [yearParam]);

  /*
   * Deep-link scroll: arriving with a hash (e.g. /team#software or
   * /team#leadership — the homepage org chart links here) scrolls that section
   * into view. The roster content mounts a frame after this page does, so a
   * single scroll can fire before the target exists; poll a few animation
   * frames until it's in the DOM, then stop. scroll-margin-top on the section
   * anchors keeps them clear of the fixed navbar.
   */
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    let frames = 0;
    let raf = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (frames++ < 30) raf = requestAnimationFrame(tryScroll);
    };
    raf = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(raf);
  }, [hash, year]);

  const scrollY = useScrollPosition();

  /*
   * Which card is showing its second face. One id for the whole page, so at
   * most one card is ever open: tapping another card hands the id over, and
   * any click that reaches the page wrapper — empty space, a heading, the jump
   * nav — clears it. Cards stop propagation on their own click, which is what
   * keeps that wrapper handler from immediately undoing the tap that opened
   * them. Only touch acts on this; see the (hover: none) blocks in the cards.
   */
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const toggleCard = (id: string) => setOpenCardId((cur) => (cur === id ? null : id));

  /*
   * The jump nav is for moving *between sections*, which is meaningless while
   * the hero is still what you're looking at — so it stays out of the way until
   * the hero has been scrolled past, and comes back if you return to the top.
   *
   * Observing the hero rather than the leadership section is deliberate: with
   * leadership as the trigger the nav would vanish again once you scrolled
   * past it, which is exactly when it's most wanted. The hero is only on
   * screen at the top, so "hero not visible" means "somewhere in the roster".
   */
  const heroRef = useRef<HTMLElement>(null);
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  /*
   * The white flash on a jump-nav jump is the browser's *base* canvas, not the
   * page's background. During a long scroll the compositor shows un-rasterised
   * area in the base colour, and with no `color-scheme` and no `theme-color`
   * that colour is white — which is why setting only the html background
   * didn't fix it, and why it happened in dark mode too.
   *
   * `color-scheme: dark` is the property that actually darkens that base
   * colour; `theme-color` covers the same ground for the iOS UI. Both are set
   * for as long as this dark-only page is mounted, and restored on unmount so
   * the rest of the site keeps following the user's theme.
   */
  useEffect(() => {
    const root = document.documentElement;
    const previousScheme = root.style.colorScheme;
    const previousBg = root.style.backgroundColor;

    root.style.colorScheme = "dark";
    root.style.backgroundColor = PAGE_BG;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const hadMeta = !!meta;
    const previousContent = meta?.content;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = PAGE_BG;

    return () => {
      root.style.colorScheme = previousScheme;
      root.style.backgroundColor = previousBg;
      if (!hadMeta) meta.remove();
      else if (previousContent !== undefined) meta.content = previousContent;
    };
  }, []);

  const roster = ROSTERS[year];
  const stats = rosterStats(roster);

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
          <Card
            key={member.id}
            member={member}
            rosterYear={roster.year}
            open={openCardId === member.id}
            onToggle={() => toggleCard(member.id)}
          />
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
     *
     * Unless the section asks otherwise: an explicit `breakBefore` is a
     * deliberate instruction about where the grid wraps, so it opts out of the
     * collapse rather than being silently ignored for being short.
     */
    const singleRow = people.length <= 3 && !people.some((m) => m.breakBefore);

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
                {cardRow(vices, styles.grid)}
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
    /* Any click that isn't stopped by a card closes whichever card is open. */
    <div className={styles.page} onClick={() => setOpenCardId(null)}>
      {/* ---- Hero -------------------------------------------------------- */}
      <header ref={heroRef} className={styles.hero}>
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
        {/*
          One clipping frame for both photos and the scrim. The photos are
          scaled (the year crossfade drifts, and the phone layout zooms), and a
          scaled image overflows its own box — so without a frame to clip to,
          the photo extended past the scrim and left a bare strip of picture
          below it. Everything inside is `inset: 0`, so the scrim's bottom edge
          is the photo's bottom edge by construction, at any scale.
        */}
        <div className={styles.heroMedia}>
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
        </div>

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

            {/*
              What the year you just picked actually contains. `key={year}`
              remounts it so the line re-animates on every switch — the numbers
              change, and that's the confirmation the toggle did something.
            */}
            <p key={year} className={styles.heroStats}>
              <span className={styles.heroStatValue}>{stats.members}</span> members
              <span className={styles.heroStatSep} aria-hidden>
                ·
              </span>
              <span className={styles.heroStatValue}>{stats.divisions}</span> divisions
              <span className={styles.heroStatSep} aria-hidden>
                ·
              </span>
              <span className={styles.heroStatValue}>{stats.subTeams}</span> sub-teams
            </p>
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

          {/* Two cards sit side by side [left, right]; three raise the middle
              one [left, centre, right]. The centre treatment only kicks in for
              the true middle card of a three-card row. */}
          <div className={styles.leadershipRow}>
            {roster.leadership.map((leader, i) => (
              <div
                key={leader.id}
                id={slugify(leader.role)}
                className={
                  roster.leadership.length === 3 && i === 1
                    ? styles.leaderCentre
                    : styles.leaderSide
                }
              >
                <Card
                  member={leader}
                  rosterYear={roster.year}
                  open={openCardId === leader.id}
                  onToggle={() => toggleCard(leader.id)}
                />
              </div>
            ))}
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

      <JumpNav groups={navGroups(roster)} visible={pastHero} />
    </div>
  );
}
