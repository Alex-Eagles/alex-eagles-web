import ScrollReveal from "@/components/ui/ScrollReveal";
import { STATS } from "@/data/home";

/**
 * StatsBar — a full-width band of four headline figures, sitting on the
 * surface color and bordered top/bottom. Numbers use the mono/technical font
 * in the brand color, per the design system.
 */
export default function StatsBar() {
  return (
    <section className="bg-surface border-y border-border">
      <div className="max-w-[var(--maxw-content)] mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-5">
        {STATS.map((stat, i) => (
          <ScrollReveal key={stat.label} delay={i * 0.08} className="text-center p-3.5">
            <div
              className="font-mono font-medium text-brand leading-none"
              style={{ fontSize: "clamp(32px, 5vw, 46px)" }}
            >
              {stat.num}
            </div>
            <div className="font-sans text-[13px] font-medium tracking-[0.12em] uppercase text-fg-secondary mt-2.5">
              {stat.label}
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
