import backdrop from "@/assets/team/card-backdrop.jpg";
import {
  hasName,
  memberCutout,
  memberFirstName,
  memberName,
  memberPhoto,
  memberRoleLabel,
  memberYearLabel,
  type TeamMember,
} from "@/data/team";
import styles from "./TeamMemberCard.module.css";

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
}: {
  member: TeamMember;
  rosterYear: string;
}) {
  const photo = memberPhoto(member);
  const cutout = memberCutout(member);
  const firstName = memberFirstName(member);
  const name = memberName(member);
  const filled = hasName(member);
  const yearLabel = memberYearLabel(member, rosterYear);
  const roleLabel = memberRoleLabel(member);

  return (
    <article
      className={styles.card}
      data-mode={cutout ? "cutout" : "photo"}
      tabIndex={0}
      aria-label={filled ? `${member.name}, ${roleLabel}` : `Unfilled ${roleLabel} slot`}
    >
      <div className={styles.inner}>
        {cutout && (
          <>
            <div
              className={styles.backdrop}
              style={{ backgroundImage: `url(${backdrop})` }}
              aria-hidden
            />
            <div className={styles.backdropScrim} aria-hidden />
            {firstName && (
              <span className={`${styles.bigName} ${styles.bigNameBack}`} aria-hidden>
                {firstName}
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
             * file into src/assets/members/, so the hint names the file to add.
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
                {member.photo ? `${member.photo}.jpg not found` : "assets/members/"}
              </p>
            </div>
          )}
        </div>

        {!cutout && (
          <>
            <div className={styles.topScrim} aria-hidden />
            {firstName && (
              <span className={`${styles.bigName} ${styles.bigNameFront}`} aria-hidden>
                {firstName}
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
