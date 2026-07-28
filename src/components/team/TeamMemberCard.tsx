import type { CSSProperties } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import {
  hasName,
  memberAccent,
  memberCutout,
  memberFirstName,
  memberName,
  memberPhoto,
  memberRoleLabel,
  memberTier,
  memberYearLabel,
  type TeamMember,
} from "@/data/team";
import styles from "./TeamMemberCard.module.css";

/**
 * The stretched first name behind the portrait — squeezed or stretched
 * horizontally (via a measured `scaleX`) to exactly fill its box regardless
 * of how many letters it has, the same way the 2025 card's SVG `textLength`
 * does. Without this, short names looked fine but longer ones (YOUSSEF,
 * ABDELRAHMAN, MARIYAM…) overflowed the box and got clipped by the card.
 */
function FitName({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [scaleX, setScaleX] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    // A ResizeObserver (rather than a one-shot measurement) means this can't
    // miss the case where the parent's box isn't sized yet the instant this
    // effect runs — it re-fires the moment a real size is available, and
    // again on any later change, so it always converges on the right fit.
    const measure = () => {
      const naturalWidth = el.scrollWidth;
      const available = parent.clientWidth;
      if (naturalWidth > 0 && available > 0) {
        setScaleX(available / naturalWidth);
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [children]);

  return (
    <span ref={ref} className={styles.bigNameText} style={{ transform: `scaleX(${scaleX}) scaleY(1.5)` }}>
      {children}
    </span>
  );
}

/**
 * Team member hover card.
 *
 * Two modes, picked automatically from the data:
 *   - no cutout file  → the portrait sits in grayscale and goes full colour on hover
 *   - cutout file     → the portrait fades out, a textured backdrop fades in, and
 *                       the cut-out person grows in over it
 *
 * All motion lives in the stylesheet, keyed off :hover / :focus-within, so the
 * component never re-renders on pointer movement.
 */
export function TeamMemberCard({
  member,
  rosterYear,
  open = false,
  onToggle,
}: {
  member: TeamMember;
  rosterYear: string;
  /** Touch-only: whether this card is showing its second face. */
  open?: boolean;
  onToggle?: () => void;
}) {
  const photo = memberPhoto(member);
  const cutout = memberCutout(member);
  const firstName = memberFirstName(member);
  const name = memberName(member);
  const filled = hasName(member);
  const yearLabel = memberYearLabel(member, rosterYear);
  const roleLabel = memberRoleLabel(member);

  /* The card's accent is its sub-team's colour, so a card reads as belonging to
   * its section wherever it appears. Set per card rather than inherited from
   * the section wrapper: `--accent` is also a shadcn theme token defined on
   * :root, so an un-set inherited value would resolve to that instead of the
   * brand blue we want for the team-wide roles. */
  const cardAccent = memberAccent(member);

  /*
   * Touch reveal. `open` is owned by the page so only one card is ever open;
   * stopping propagation is what keeps the page's close-on-click handler from
   * undoing the tap that opened this one. A pointer device has hover, so the
   * reveal follows the pointer and this flag is ignored — the stylesheet only
   * acts on it inside `@media (hover: none)`. So the handler can stay
   * unconditional: on a mouse a click still toggles it, and still does nothing
   * at all on screen.
   */
  return (
    <article
      className={styles.card}
      data-mode={cutout ? "cutout" : "photo"}
      /* Rank, so the page can size a card by it — a vice sharing a row with
         members can't be sized by a class on the row. Matches the 2025 card. */
      data-tier={memberTier(member)}
      data-open={open}
      style={{ "--card-accent": cardAccent } as CSSProperties}
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      aria-label={filled ? `${member.name}, ${roleLabel}` : `Unfilled ${roleLabel} slot`}
    >
      <div className={styles.inner}>
        {cutout && (
          <>
            {/* The texture itself is `--team-card-backdrop` in theme.css, so it
                follows the theme — light mode gets its own wallpaper. */}
            <div className={styles.backdrop} aria-hidden />
            <div className={styles.backdropScrim} aria-hidden />
            {firstName && (
              <span className={`${styles.bigName} ${styles.bigNameBack}`} aria-hidden>
                <FitName>{firstName}</FitName>
              </span>
            )}
            <div className={styles.cutoutLayer} aria-hidden>
              <img src={cutout} alt="" loading="lazy" />
            </div>
          </>
        )}

        <div className={styles.photoLayer}>
          {photo ? (
            <img src={photo} alt={filled ? member.name : ""} loading="lazy" />
          ) : (
            /*
             * Empty slot. Not an uploader — adding a portrait means dropping a
             * file into src/assets/members/photos/, so the hint names the file
             * to add.
             */
            <div className={styles.emptyPortrait}>
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-4.35-4.35a2 2 0 0 0-2.83 0L3 21" />
              </svg>
              <p className={styles.emptyTitle}>Drop portrait</p>
              <p className={styles.emptyHint}>
                {member.photo ? `${member.photo}.jpg not found` : "assets/members/photos/"}
              </p>
            </div>
          )}
        </div>

        {!cutout && (
          <>
            <div className={styles.topScrim} aria-hidden />
            {firstName && (
              <span className={`${styles.bigName} ${styles.bigNameFront}`} aria-hidden>
                <FitName>{firstName}</FitName>
              </span>
            )}
          </>
        )}

        {/* Visible at rest, hidden on hover */}
        <p className={styles.restRole}>{roleLabel}</p>
        <p className={styles.restName} data-placeholder={!filled}>
          {name}
        </p>

        {/* Hidden at rest, revealed on hover */}
        <div className={styles.panel}>
          <p className={styles.panelRole}>{roleLabel}</p>
          <p className={styles.panelName} data-placeholder={!filled}>
            {name}
          </p>
          <p className={styles.panelDepartment}>{member.department}</p>
          <div className={styles.panelFooter}>
            <span className={styles.panelYear}>{yearLabel}</span>
            {member.linkedIn && (
              <a
                className={styles.linkedIn}
                href={member.linkedIn}
                target="_blank"
                rel="noreferrer"
                /* Tapping the link shouldn't also collapse the panel it sits in. */
                onClick={(e) => e.stopPropagation()}
                aria-label={`${name} on LinkedIn`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM7.5 8h4.78v2.19h.07c.67-1.2 2.3-2.46 4.73-2.46C22 7.73 24 10.09 24 14.4V24h-5v-8.5c0-2.03-.72-3.42-2.53-3.42-1.38 0-2.2.93-2.56 1.83-.13.32-.16.76-.16 1.2V24h-5z" />
                </svg>
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
