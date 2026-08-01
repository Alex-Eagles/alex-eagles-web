import { useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Only worth offering once the page has scrolled roughly a viewport down. */
const SHOW_AFTER_PX = 480;

/**
 * ScrollTopButton — small fixed arrow, bottom-right, that scrolls back to the
 * top of the current page. Lives in App.tsx alongside ThemeToggle so it shows
 * on every route; styling mirrors ThemeToggle's fixed-pill treatment (same
 * blur, border, and background tokens) so the two read as one family of
 * floating chrome rather than two different UI languages.
 */
export default function ScrollTopButton() {
  const { isDark } = useTheme();
  const scrollY = useScrollPosition();
  const prefersReduced = useReducedMotion();
  const visible = scrollY > SHOW_AFTER_PX;

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  }, [prefersReduced]);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      // Hidden (not unmounted) below the threshold, so the fade is a
      // transition rather than a pop, and focus order never jumps around.
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className="ui-blur fixed bottom-5 right-5 md:bottom-6 md:right-8 z-40"
      style={{
        width: 46,
        height: 46,
        border: `1px solid ${isDark ? "var(--border-solid)" : "var(--border-subtle)"}`,
        borderRadius: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        // Same translucent-pill formula as ThemeToggle, so the two fixed
        // controls match in both themes.
        background: isDark
          ? "rgb(13 16 53 / var(--toggle-opacity, 0.42))"
          : "rgb(255 255 255 / var(--toggle-opacity, 0.62))",
        boxShadow: isDark
          ? "0 10px 28px rgba(0,0,0,0.55)"
          : "0 10px 28px rgba(60,64,181,0.18)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        pointerEvents: visible ? "auto" : "none",
        transition:
          "opacity .3s ease, transform .3s cubic-bezier(.34,1.56,.64,1), background .4s ease, box-shadow .4s ease, border-color .4s ease",
      }}
    >
      <ArrowUp size={20} color="var(--brand)" strokeWidth={2.4} />
    </button>
  );
}
