import { Construction } from "lucide-react";

/**
 * ConstructionBanner — a persistent site-wide notice that the site is still
 * being built.
 *
 * It lives in the layout shell rather than in any one page, so every route
 * (including routes added later) carries the notice automatically. It sits at
 * the bottom edge because the top corners are already taken by the navbar pill
 * and the theme toggle, and it is deliberately not dismissible: the status
 * applies to every page until the real content ships.
 */
export default function ConstructionBanner() {
  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 justify-center px-2"
    >
      <span
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-center"
        style={{
          background: "var(--bg-glass)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--elevation-2)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <Construction size={15} className="shrink-0 text-gold" />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-muted">
          Site under construction
        </span>
      </span>
    </div>
  );
}
