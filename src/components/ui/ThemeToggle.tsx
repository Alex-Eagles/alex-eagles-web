import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

/**
 * ThemeToggle — the sliding "Dark / Light" pill (translated from Home.dc.html).
 *
 * A single accessible <button>: the knob slides between the two labels and the
 * icon crossfades (moon ↔ sun). All state comes from ThemeContext. Positioned
 * fixed at the top-right by default; pass `className` to relocate it.
 */

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({
  // Fixed to the top-right with comfortable edge padding (a little tighter on
  // small screens, roomier on desktop) so it's always easy to reach.
  className = "fixed top-5 right-5 md:top-6 md:right-8 z-40",
}: ThemeToggleProps) {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={className}
      style={{
        width: 136,
        height: 51,
        border: isDark
          ? "1px solid rgba(60,64,181,0.5)"
          : "1px solid rgba(60,64,181,0.22)",
        borderRadius: 9999,
        cursor: "pointer",
        background: isDark ? "rgba(13,16,53,0.82)" : "rgba(255,255,255,0.9)",
        boxShadow: isDark
          ? "0 10px 28px rgba(0,0,0,0.55)"
          : "0 10px 28px rgba(60,64,181,0.18)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        padding: 0,
        // NOTE: no `position` here — placement comes from the `fixed …` class in
        // className. An inline position would override it and break the layout.
        transition:
          "background .4s ease, box-shadow .4s ease, border-color .4s ease",
      }}
    >
      {/* Static word labels; the active one fades in. */}
      <span
        style={{
          position: "absolute",
          left: 22,
          top: 0,
          height: 49,
          display: "flex",
          alignItems: "center",
          fontFamily: "var(--font-heading)",
          fontWeight: 600,
          fontSize: 16,
          color: isDark ? "#C7CAF0" : "#3B3F7A",
          opacity: isDark ? 1 : 0,
          transition: "opacity .3s ease",
        }}
      >
        Dark
      </span>
      <span
        style={{
          position: "absolute",
          right: 20,
          top: 0,
          height: 49,
          display: "flex",
          alignItems: "center",
          fontFamily: "var(--font-heading)",
          fontWeight: 600,
          fontSize: 16,
          color: isDark ? "#C7CAF0" : "#3B3F7A",
          opacity: isDark ? 0 : 1,
          transition: "opacity .3s ease",
        }}
      >
        Light
      </span>

      {/* The sliding knob with the current-mode icon inside. */}
      <span
        style={{
          position: "absolute",
          top: 4,
          left: 4,
          width: 40,
          height: 40,
          borderRadius: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark
            ? "radial-gradient(circle at 35% 30%, #2a2f6e, #11143a)"
            : "radial-gradient(circle at 35% 30%, #ffffff, #e7e9ff)",
          boxShadow: isDark
            ? "0 3px 10px rgba(0,0,0,0.6)"
            : "0 3px 12px rgba(96,120,255,0.45)",
          transform: isDark ? "translateX(86px)" : "translateX(0px)",
          transition:
            "transform .42s cubic-bezier(.34,1.56,.64,1), background .4s ease, box-shadow .4s ease",
        }}
      >
        {isDark ? (
          <Moon size={20} color="#F0F2FF" strokeWidth={2} />
        ) : (
          <Sun size={20} color="#B45309" strokeWidth={2} />
        )}
      </span>
    </button>
  );
}
