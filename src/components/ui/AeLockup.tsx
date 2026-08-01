import { useTheme } from "@/context/ThemeContext";
import AeLogo from "@/components/ui/AeLogo";
import "@/styles/AeLockup.css";

/**
 * AeLockup — the emblem, a hairline rule, and the ALEX EAGLES wordmark.
 *
 * The horizontal lockup used as the site's brand mark in the navbar. <AeLogo/>
 * stays the emblem on its own, for the places that want just the bird (footer,
 * hero, sponsors).
 *
 * Colour: the rule and the wordmark take the emblem's own colour, so the whole
 * lockup reads as one object rather than an image with text next to it. That
 * means white in dark mode and #35409a in light — the latter sampled from the
 * blue emblem itself (its dominant opaque pixel) rather than borrowing
 * --brand, which is a different, brighter indigo and would visibly mismatch
 * the artwork it sits beside.
 *
 * Type: Orbitron 800, the face the homepage hero sets "ALEX EAGLES" in, so the
 * two read as the same wordmark. Already loaded site-wide (see index.html), so
 * this costs no extra font request.
 *
 * Entrance: the wordmark wipes out from behind the rule on mount — see
 * AeLockup.css. To replay it on every navigation, give the element a `key`
 * that changes with the route (the navbar keys it on pathname); a component
 * that never unmounts would only ever animate once, on first load.
 *
 * Both emblem files are trimmed to their artwork, so a single `size` drives
 * identical apparent size in either theme. They previously carried different
 * transparent margins, which made the white one render noticeably smaller than
 * the blue at the same box size.
 */

/** The blue emblem's own ink. Keep in step if the artwork is ever re-exported. */
const EMBLEM_BLUE = "#35409a";

interface AeLockupProps {
  /** Emblem edge length in px; the rule and wordmark scale from it. */
  size?: number;
  className?: string;
}

export default function AeLockup({ size = 44, className }: AeLockupProps) {
  const { isDark } = useTheme();
  const ink = isDark ? "#ffffff" : EMBLEM_BLUE;

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: size * 0.27 }}
    >
      <AeLogo
        size={size}
        title=""
        style={{ width: size, height: size, flex: "none" }}
      />

      {/* The divider from the brand lockup. A styled element rather than a "|"
          glyph so its height and weight don't drift with the font — and so it
          can be set to exactly the emblem's height, which is what puts the two
          tops on one line. */}
      <span
        className="ae-lockup-rule"
        aria-hidden="true"
        style={{
          width: 1,
          height: size,
          background: ink,
          /* The rule is a separator, not a letter — at full strength it competes
             with the wordmark it's separating. */
          opacity: 0.45,
          flex: "none",
        }}
      />

      <span
        className="ae-lockup-word"
        style={{
          fontFamily: '"Orbitron", ui-sans-serif, system-ui, sans-serif',
          fontWeight: 800,
          fontSize: size * 0.34,
          letterSpacing: "0.08em",
          lineHeight: 1,
          textTransform: "uppercase",
          color: ink,
          whiteSpace: "nowrap",
          transition: "color var(--transition-slow)",
        }}
      >
        Alex Eagles
      </span>
    </span>
  );
}
