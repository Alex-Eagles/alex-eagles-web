import { useState, type CSSProperties } from "react";
import cardTexture from "@/assets/team/card-texture.png";
import { memberPhoto, memberPhotoBg, type TeamMember } from "@/data/team";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * TeamMemberCard — hover-reveal card, ported from the "Team Member Hover Card"
 * design handoff (high-fidelity: colours, type, spacing and timings are taken
 * verbatim from that spec, so this card is intentionally always-dark and uses
 * Archivo rather than the site theme tokens).
 *
 * Two modes, keyed on whether the member has a transparent cut-out:
 *   Mode A (no cut-out) — one portrait: grayscale + bg at rest, colour + slight
 *     zoom on hover, with the first name scrimmed in front.
 *   Mode B (cut-out)    — the grayscale bg photo fades OUT on hover to reveal a
 *     colour cut-out that grows in over the gradient stage, first name behind.
 *
 * Data mapping onto our TeamMember:
 *   reference `photo`  (with background) → photoBg for cut-out members, else photo
 *   reference `cutout` (transparent)     → photo when member.cutout is set
 *   reference `department`               → subTeam
 *
 * Hover is mouse-driven (onMouseEnter/Leave) exactly as the spec; touch devices,
 * which have no hover, simply keep the rest state.
 */

const EASE_MOVE = "cubic-bezier(.2,.8,.2,1)";
const EASE_IMG = "cubic-bezier(.16,.84,.34,1)";

interface TeamMemberCardProps {
  member: TeamMember;
  /** Accepted for API compatibility with the grid; layout is size-agnostic. */
  size?: "default" | "large";
  /** Overrides the displayed role text (e.g. "Team Leader" in the lead row). */
  roleLabel?: string;
}

export default function TeamMemberCard({
  member,
  roleLabel,
}: TeamMemberCardProps) {
  const role = roleLabel ?? member.role;
  const [on, setOn] = useState(false);
  const reduced = useReducedMotion();

  const bgPhoto = memberPhotoBg(member) ?? memberPhoto(member);
  const hasCutout = Boolean(member.cutout && memberPhotoBg(member));
  const cutoutSrc = hasCutout ? memberPhoto(member) : undefined;
  const photoSrc = bgPhoto;

  const firstName = member.name.split(" ")[0].toUpperCase();
  const department = member.subTeam;
  const year = `Year ${member.year}`;

  // Reduced motion: keep the cross-fade (opacity) but drop translate/scale moves
  // and transitions, so nothing slides or grows.
  const tr = (s: string) => (reduced ? "none" : s);

  const card: CSSProperties = {
    borderRadius: 16,
    overflow: "hidden",
    cursor: "pointer",
    width: "100%",
    background: "#0f1236",
    transition: tr(`transform .45s ${EASE_MOVE}, box-shadow .45s ease`),
    transform: on && !reduced ? "translateY(-6px)" : "translateY(0)",
    boxShadow: on
      ? "0 34px 60px -30px rgba(230,232,255,.22)"
      : "0 8px 24px -14px rgba(0,0,0,.6)",
  };

  const inner: CSSProperties = {
    position: "relative",
    width: "100%",
    aspectRatio: "0.8",
    overflow: "hidden",
    background: "linear-gradient(165deg,#20265e,#12163c)",
    fontFamily: "'Archivo', system-ui, sans-serif",
    // Removes the white anti-alias fringe when the inner image scales — keep it.
    WebkitMaskImage: "-webkit-radial-gradient(white,black)",
    transform: "translateZ(0)",
  };

  const bigName: CSSProperties = {
    position: "absolute",
    top: 6,
    left: 0,
    right: 0,
    fontSize: 70,
    lineHeight: 0.78,
    fontWeight: 900,
    letterSpacing: "-0.05em",
    transform: "scaleY(2.1)",
    transformOrigin: "top",
    whiteSpace: "nowrap",
    textAlign: "center",
    transition: tr("opacity .5s ease"),
  };

  return (
    <div
      style={card}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
    >
      <div style={inner}>
        {/* Mode B: dark scrim over the gradient stage, fades in on hover. */}
        {hasCutout && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg,rgba(9,11,30,.55),rgba(9,11,30,.35))",
              opacity: on ? 1 : 0,
              transition: tr("opacity .5s ease"),
            }}
          />
        )}

        {/* Mode B: first name BEHIND the cut-out. */}
        {hasCutout && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <span style={{ ...bigName, color: "#5b62a0", opacity: on ? 1 : 0 }}>
              {firstName}
            </span>
          </div>
        )}

        {/* Mode B: colour cut-out layer. */}
        {hasCutout && cutoutSrc && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: on ? 1 : 0,
              transform: reduced
                ? "scale(0.9)"
                : on
                  ? "scale(0.9)"
                  : "scale(0.72) translateY(3%)",
              transformOrigin: "bottom center",
              transition: tr(`opacity .5s ease, transform .7s ${EASE_IMG}`),
            }}
          >
            <img
              src={cutoutSrc}
              alt=""
              aria-hidden="true"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        )}

        {/* Full photo — rest state for both modes; hover reveal for mode A. */}
        {photoSrc ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              filter:
                on && !hasCutout
                  ? "grayscale(0) contrast(1) brightness(1)"
                  : "grayscale(1) contrast(1.02) brightness(.9)",
              opacity: on && hasCutout ? 0 : 1,
              transform:
                on && !hasCutout && !reduced ? "scale(1.05)" : "scale(1)",
              transition: tr(
                `filter .55s ease, opacity .5s ease, transform .7s ${EASE_IMG}`,
              ),
            }}
          >
            <img
              src={photoSrc}
              alt={member.name}
              loading="lazy"
              decoding="async"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#5b62a0",
              fontSize: 64,
              fontWeight: 900,
            }}
          >
            {firstName.charAt(0)}
          </div>
        )}

        {/* Mode A: first name IN FRONT + top scrim. */}
        {!hasCutout && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "58%",
                background:
                  "linear-gradient(180deg,rgba(10,12,40,.86),rgba(10,12,40,.35) 52%,rgba(10,12,40,0))",
                opacity: on ? 0.9 : 0,
                transition: tr("opacity .5s ease"),
              }}
            />
            <span
              style={{
                ...bigName,
                color: "#eef0ff",
                textShadow: "0 3px 24px rgba(0,0,0,.6)",
                opacity: on ? 0.9 : 0,
              }}
            >
              {firstName}
            </span>
          </div>
        )}

        {/* Rest-state tags — role top-left, name bottom-left. */}
        <div
          style={{
            position: "absolute",
            left: 14,
            top: 14,
            pointerEvents: "none",
            background: "rgba(10,12,36,.55)",
            backdropFilter: "blur(6px)",
            padding: "5px 10px",
            borderRadius: 8,
            opacity: on ? 0 : 1,
            transition: tr("opacity .35s ease"),
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#f0910e",
              fontFamily: "'Archivo', system-ui, sans-serif",
            }}
          >
            {member.role}
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            left: 14,
            bottom: 12,
            pointerEvents: "none",
            opacity: on ? 0 : 1,
            transition: tr("opacity .35s ease"),
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#fff",
              textShadow: "0 1px 12px rgba(0,0,0,.6)",
              fontFamily: "'Archivo', system-ui, sans-serif",
            }}
          >
            {member.name}
          </span>
        </div>

        {/* Hover info panel. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "52px 18px 18px",
            fontFamily: "'Archivo', system-ui, sans-serif",
            background:
              "linear-gradient(180deg,rgba(14,17,48,0),rgba(14,17,48,.85) 44%,rgba(14,17,48,.98))",
            opacity: on ? 1 : 0,
            transform: on || reduced ? "translateY(0)" : "translateY(30%)",
            transition: tr(`opacity .45s ease, transform .5s ${EASE_MOVE}`),
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#f0910e",
              margin: "0 0 7px",
            }}
          >
            {member.role}
          </p>
          <p
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.01em",
              margin: "0 0 2px",
            }}
          >
            {member.name}
          </p>
          <p style={{ fontSize: 13, color: "#9297cf", margin: "0 0 12px" }}>
            {department}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,.12)",
              paddingTop: 11,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#6b71a8",
              }}
            >
              {year}
            </span>
            {member.linkedIn && (
              <a
                href={member.linkedIn}
                target="_blank"
                rel="noreferrer"
                aria-label={`${member.name} on LinkedIn`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#c3c8f2",
                  padding: "5px 10px",
                  border: "1px solid rgba(139,143,196,.4)",
                  borderRadius: 999,
                  textDecoration: "none",
                  transition: "color .25s, border-color .25s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.borderColor = "#f0910e";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#c3c8f2";
                  e.currentTarget.style.borderColor = "rgba(139,143,196,.4)";
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
=======
import backdrop from "@/assets/team/card-backdrop.jpg";
import {
  hasName,
  memberCutout,
  memberFirstName,
  memberName,
  memberPhoto,
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

  return (
    <article
      className={styles.card}
      data-mode={cutout ? "cutout" : "photo"}
      tabIndex={0}
      aria-label={filled ? `${member.name}, ${member.role}` : `Unfilled ${member.role} slot`}
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
        <p className={styles.restRole}>{member.role}</p>
        <p className={styles.restName} data-placeholder={!filled}>
          {name}
        </p>

        {/* Hidden at rest, revealed on hover */}
        <div className={styles.panel}>
          <p className={styles.panelRole}>{member.role}</p>
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
>>>>>>> 127711238eba8b64611b66d37a5cd4fa3323e141
                  <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM7.5 8h4.78v2.19h.07c.67-1.2 2.3-2.46 4.73-2.46C22 7.73 24 10.09 24 14.4V24h-5v-8.5c0-2.03-.72-3.42-2.53-3.42-1.38 0-2.2.93-2.56 1.83-.13.32-.16.76-.16 1.2V24h-5z" />
                </svg>
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
=======
    </article>
  );
}
