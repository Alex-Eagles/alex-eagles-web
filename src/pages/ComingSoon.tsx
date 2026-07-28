import { Construction } from "lucide-react";
import Button from "@/components/ui/Button";

/**
 * ComingSoon — a shared placeholder used by every page that hasn't been built
 * yet. It keeps the site navigable and on-brand while the remaining pages are
 * still being designed. Each real page will replace its use of this template.
 */

interface ComingSoonProps {
  /** Page name, e.g. "Team". */
  title: string;
  /** One-line description of what will live here. */
  blurb: string;
}

export default function ComingSoon({ title, blurb }: ComingSoonProps) {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Subtle brand grid backdrop (same texture as the hero). */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(70% 60% at 50% 45%, #000 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(70% 60% at 50% 45%, #000 0%, transparent 75%)",
        }}
      />

      <div className="relative z-10 text-center max-w-[560px]">
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--brand-glow)] border border-border mb-6">
          <Construction size={16} className="text-gold" />
          <span className="font-mono text-[13px] text-fg-secondary uppercase tracking-[0.08em]">
            Under construction
          </span>
        </div>

        <h1 className="font-display font-extrabold text-h1 text-fg leading-none tracking-[-0.02em] m-0 mb-4">
          {title}
        </h1>

        <p className="font-sans text-body-lg text-fg-secondary leading-[1.7] mx-auto mb-9 prose-measure">
          {blurb}
        </p>

        <Button variant="secondary" to="/">
          Back to home
        </Button>
      </div>
    </section>
  );
}
