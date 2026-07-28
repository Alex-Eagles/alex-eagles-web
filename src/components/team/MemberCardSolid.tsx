import type { CSSProperties } from "react";

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
import styles from "./MemberCardSolid.module.css";

/**
 * MemberCardSolid — the 2025 roster card.
 *
 * Different from the 2026 card: the background-removed cut-out is shown in
 * COLOUR at rest on a dark textured backdrop, with a MEMBER badge and the name.
 * On hover the big first name fades in behind the person and an info panel
 * (role · name · section · year · LinkedIn) rises, while the rest tags fade out.
 */
export function MemberCardSolid({
  member,
  rosterYear = "",
  open = false,
  onToggle,
}: {
  member: TeamMember;
  rosterYear?: string;
  /** Touch-only: whether this card is showing its second face. */
  open?: boolean;
  onToggle?: () => void;
}) {
  const src = memberCutout(member) ?? memberPhoto(member);
  const filled = hasName(member);
  const name = memberName(member);
  const firstName = memberFirstName(member);
  const accent = memberAccent(member);
  const tier = memberTier(member);
  const roleLabel = memberRoleLabel(member);

  /*
   * Touch reveal — see TeamMemberCard. `open` is owned by the page so only one
   * card is ever open; stopping propagation keeps the page's close-on-click
   * handler from undoing the tap that opened this one. The stylesheet only
   * acts on it inside `@media (hover: none)`, so on a pointer device the
   * reveal stays hover-only and a click still does nothing. Without it the
   * panel (and the LinkedIn link in it) was unreachable on a phone, since
   * there's no hover to give.
   */
  return (
    <article
      className={styles.card}
      data-tier={tier}
      data-open={open}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      /* Every card carries its sub-team's colour — the badge, the big first
       * name, the panel role and (on lead tiers) the accent ring all read from
       * it, so a 2025 card is colour-coded to its section exactly like a 2026
       * one. Team Leader / Vice Lead / EM Integration Lead keep the brand,
       * which `memberAccent` handles. Named `--card-accent`, not `--accent`,
       * because the latter is a shadcn theme token on :root. */
      style={{ "--card-accent": accent } as CSSProperties}
      /* Light-mode wallpaper comparison; undefined on every other card. */
      data-backdrop={member.cardBackdrop}
      tabIndex={0}
      aria-label={filled ? `${member.name}, ${roleLabel}` : `Unfilled ${roleLabel} slot`}
    >
      {/* Texture comes from `--team-card-backdrop` in theme.css so it follows
          the theme; an inline style here would always beat the light override. */}
      <div className={styles.backdrop} aria-hidden />
      <div className={styles.scrim} aria-hidden />

      {firstName && (
        <svg
          className={styles.bigName}
          viewBox="0 0 1000 200"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          {/* textLength + lengthAdjust stretch the glyphs to span the full
              width, so any name — short or long — fills the card edge to edge. */}
          <text
            x="500"
            y="168"
            textAnchor="middle"
            textLength="952"
            lengthAdjust="spacingAndGlyphs"
            fontFamily="Archivo, system-ui, sans-serif"
            fontWeight="900"
            fontSize="190"
            letterSpacing="-0.03em"
            /* Colour comes from the stylesheet so it can track --card-accent. */
            fill="currentColor"
          >
            {firstName}
          </text>
        </svg>
      )}

      {src ? (
        <img className={styles.photo} src={src} alt="" loading="lazy" decoding="async" />
      ) : (
        <div className={styles.placeholder} aria-hidden>
          {name.charAt(0)}
        </div>
      )}

      {/* Rest-state tags */}
      <span className={styles.badge} style={{ color: accent, borderColor: accent }}>
        {roleLabel}
      </span>
      <span className={styles.restName}>{name}</span>

      {/* Hover info panel */}
      <div className={styles.panel}>
        <p className={styles.panelRole} style={{ color: accent }}>
          {roleLabel}
        </p>
        <p className={styles.panelName}>{name}</p>
        <p className={styles.panelDept}>{member.department}</p>
        <div className={styles.footer}>
          <span className={styles.year}>{memberYearLabel(member, rosterYear)}</span>
          {member.linkedIn && (
            <a
              className={styles.linkedin}
              href={member.linkedIn}
              target="_blank"
              rel="noreferrer"
              /* Tapping the link shouldn't also collapse the panel it sits in. */
              onClick={(e) => e.stopPropagation()}
              aria-label={`${member.name} on LinkedIn`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM7.5 8h4.78v2.19h.07c.67-1.2 2.3-2.46 4.73-2.46C22 7.73 24 10.09 24 14.4V24h-5v-8.5c0-2.03-.72-3.42-2.53-3.42-1.38 0-2.2.93-2.56 1.83-.13.32-.16.76-.16 1.2V24h-5z" />
              </svg>
              LinkedIn
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
