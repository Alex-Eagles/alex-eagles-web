import type { ReactNode } from "react";
import { Link } from "react-router-dom";


type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  children: ReactNode;
  variant?: Variant;
  to?: string;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  "aria-label"?: string;
}

/** Per-variant classes. Colors come entirely from design tokens. */
const VARIANTS: Record<Variant, string> = {
  // Gold CTA on near-black text — the primary call to action.
  primary:
    "bg-gold text-canvas shadow-[0_8px_24px_var(--brand-glow)] hover:bg-gold-hover hover:-translate-y-0.5",
  // Outlined brand — secondary action; fills on hover.
  secondary:
    "bg-transparent border border-brand text-brand-light hover:bg-brand hover:text-white",
  // Text-only — tertiary / inline action.
  ghost:
    "bg-transparent text-fg-muted hover:text-fg px-4 py-2",
};

const BASE =
  "inline-flex items-center justify-center gap-2 font-sans font-semibold text-[15px] " +
  "rounded-sm px-[30px] py-[15px] no-underline cursor-pointer " +
  "transition-[background-color,color,transform,box-shadow] duration-200 ease-out";

export default function Button({
  children,
  variant = "primary",
  to,
  href,
  onClick,
  type = "button",
  className = "",
  "aria-label": ariaLabel,
}: ButtonProps) {
  // Ghost variant supplies its own horizontal padding, so strip the base one.
  const base = variant === "ghost" ? BASE.replace("px-[30px] py-[15px] ", "") : BASE;
  const classes = `${base} ${VARIANTS[variant]} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={classes}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
