import { useEffect, useRef, useState } from "react";
import type { NavGroup } from "@/data/team";
import styles from "./JumpNav.module.css";

/**
 * The PULL tab on the right edge and the "jump to section" panel it opens.
 *
 * Anchors are plain `#id` links, so they inherit the page's `scroll-behavior:
 * smooth` and land clear of the fixed navbar via `scroll-margin-top`.
 */
export function JumpNav({ groups }: { groups: NavGroup[] }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);

  // Escape closes it, and focus moves into the panel when it opens so the
  // links are reachable straight from the tab by keyboard.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    /*
     * Anything outside the panel closes it — mouse or touch, since pointerdown
     * covers both. The tab is excluded because it toggles on its own click: if
     * this closed the panel first, the tab's own handler would immediately
     * reopen it and the tab would never appear to close anything. Fires on
     * pointerdown rather than click so the panel is already on its way out by
     * the time the tap completes.
     */
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target) || tabRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    panelRef.current?.querySelector("a")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={tabRef}
        type="button"
        className={styles.tab}
        data-open={open}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="jump-nav-panel"
        aria-label={open ? "Close section nav" : "Jump to section"}
      >
        <svg
          className={styles.chevron}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span className={styles.tabLabel}>{open ? "Close" : "Pull"}</span>
      </button>

      <nav
        id="jump-nav-panel"
        ref={panelRef}
        className={styles.panel}
        data-open={open}
        aria-label="Jump to section"
        // Keeps the links out of the tab order while the panel is closed.
        {...(open ? {} : { inert: "" })}
      >
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Jump to</span>
          <button
            type="button"
            className={styles.close}
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {groups.map((group) => (
          <div key={group.label}>
            <p className={styles.groupLabel}>{group.label}</p>
            {group.items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={styles.link}
                onClick={() => setOpen(false)}
              >
                {item.name}
              </a>
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}
