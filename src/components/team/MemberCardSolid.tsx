import backdrop from "@/assets/team/card-backdrop.jpg";
import {
  hasName,
  memberCutout,
  memberFirstName,
  memberName,
  memberPhoto,
  memberYearLabel,
  subTeamAccent,
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
}: {
  member: TeamMember;
  rosterYear?: string;
}) {
  const src = memberCutout(member) ?? memberPhoto(member);
  const filled = hasName(member);
  const name = memberName(member);
  const firstName = memberFirstName(member);
  const accent = subTeamAccent(member.department);

  return (
    <article
      className={styles.card}
      tabIndex={0}
      aria-label={filled ? `${member.name}, ${member.role}` : `Unfilled ${member.role} slot`}
    >
      <div
        className={styles.backdrop}
        style={{ backgroundImage: `url(${backdrop})` }}
        aria-hidden
      />
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
            fill="#5b62a0"
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
        {member.role}
      </span>
      <span className={styles.restName}>{name}</span>

      {/* Hover info panel */}
      <div className={styles.panel}>
        <p className={styles.panelRole} style={{ color: accent }}>
          {member.role}
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
