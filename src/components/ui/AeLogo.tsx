import type { CSSProperties } from "react";
import { useTheme } from "@/context/ThemeContext";
import logoWhite from "@/assets/logo-white.png";
import logoBlue from "@/assets/logo-blue.png";

/**
 * AeLogo — the official Alex Eagles emblem, rendered from the brand PNGs.
 *
 * Theme behaviour:
 *   - `variant="auto"` (default): white emblem on dark theme, blue on light —
 *     matched to the page background so it always has contrast.
 *   - `variant="white"` / `"blue"`: force one, regardless of theme. The hero
 *     forces "white" because its backdrop stays dark in both themes.
 *
 * The source images live in `src/assets/` (logo-white.png, logo-blue.png) so
 * they're versioned in the repo and bundled by Vite — teammates get them on pull.
 *
 * Size is a square box (width = height); the emblem is `object-contain` inside it.
 */

interface AeLogoProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Accessible name; pass "" to mark it decorative (empty alt + aria-hidden). */
  title?: string;
  /** "auto" swaps by theme; "white"/"blue" force a specific emblem. */
  variant?: "auto" | "white" | "blue";
}

export default function AeLogo({
  size = 128,
  className,
  style,
  title = "Alex Eagles logo",
  variant = "auto",
}: AeLogoProps) {
  const { isDark } = useTheme();

  // Pick the emblem: forced variant wins, otherwise follow the theme.
  const useWhite = variant === "white" || (variant === "auto" && isDark);
  const src = useWhite ? logoWhite : logoBlue;

  const decorative = title === "";

  return (
    <img
      src={src}
      alt={decorative ? "" : title}
      aria-hidden={decorative ? true : undefined}
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={{ display: "block", objectFit: "contain", ...style }}
    />
  );
}
