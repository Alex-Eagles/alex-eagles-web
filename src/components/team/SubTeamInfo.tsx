import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { slugify, type SubTeamIconKey } from "@/data/team";
import { SubTeamIcon } from "./SubTeamIcon";
import styles from "./SubTeamInfo.module.css";

/**
 * SubTeamInfo — the themed info chip beside a sub-team title, and the card that
 * expands from it.
 *
 * The chip carries the team's own icon and colour and pulses at rest to invite
 * a click. Clicking it grows a floating card out of the chip (scale + fade from
 * the chip's corner) holding the icon, the team name, and what the team does.
 * Clicking outside or pressing Escape closes it.
 *
 * Colour comes in as `accent` (a CSS colour or var) and is applied through a
 * `--accent` custom property, so the stylesheet owns the actual treatment.
 */
export function SubTeamInfo({
  name,
  blurb,
  accent,
  icon,
}: {
  name: string;
  blurb: string;
  accent: string;
  icon?: SubTeamIconKey;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const iconKey = (icon ?? slugify(name)) as SubTeamIconKey;

  // Close on outside click or Escape while open.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={wrapRef} style={{ "--accent": accent } as CSSProperties}>
      <button
        type="button"
        className={styles.chip}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`What the ${name} team does`}
        data-open={open}
      >
        <SubTeamIcon name={iconKey} size={20} />
      </button>

      <div
        id={panelId}
        className={styles.card}
        role="dialog"
        aria-label={`${name} — what we do`}
        data-open={open}
        {...(open ? {} : { inert: "" })}
      >
        <div className={styles.cardHead}>
          <span className={styles.cardIcon} aria-hidden>
            <SubTeamIcon name={iconKey} size={22} />
          </span>
          <span className={styles.cardTitle}>{name}</span>
          <button
            type="button"
            className={styles.close}
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className={styles.cardBody}>{blurb}</p>
      </div>
    </div>
  );
}
