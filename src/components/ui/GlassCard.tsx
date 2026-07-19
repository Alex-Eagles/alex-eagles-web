import type { CSSProperties, ReactNode } from "react";

/**
 * GlassCard — the elevated card surface used across the site (blog posts,
 * sponsor tiles, panels). Provides the base surface + border + the subtle
 * lift-on-hover interaction. Pass extra classes/styles to specialise it.
 */

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Enable the translate-up + deeper-shadow hover (default on). */
  interactive?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  style,
  interactive = true,
}: GlassCardProps) {
  const hover = interactive
    ? "cursor-pointer hover:-translate-y-1.5 hover:shadow-[var(--elevation-4)]"
    : "";

  return (
    <div
      className={
        "bg-[var(--card)] border border-border rounded-xl " +
        "shadow-[var(--elevation-3)] transition-[transform,box-shadow] duration-[250ms] ease-out " +
        `${hover} ${className}`
      }
      style={style}
    >
      {children}
    </div>
  );
}
