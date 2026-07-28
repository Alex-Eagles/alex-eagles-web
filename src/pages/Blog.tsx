import { BookOpen, Construction, MapPin, Timer } from "lucide-react";
import type { ReactNode } from "react";
import SectionHeader from "@/components/ui/SectionHeader";
import ScrollReveal from "@/components/ui/ScrollReveal";

/** Blog landing page — the build-log introduction, with no entries published yet. */
export default function Blog() {
  return (
    <>
      <header className="relative flex min-h-[92svh] items-end overflow-hidden px-6 pb-20 pt-36 md:pb-24">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(110% 90% at 50% 0%, #161A50, #07091C 70%)",
          }}
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(75% 60% at 50% 40%, #000 0%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(75% 60% at 50% 40%, #000 0%, transparent 78%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(9, 9, 14, 0.16) 35%, rgba(9, 9, 14, 0.92) 100%)",
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-[var(--maxw-content)]">
          <div className="mb-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3.5 py-2 text-white backdrop-blur-md">
              <BookOpen size={15} className="text-brand-light" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
                Alex Eagles build log
              </span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-black/30 px-3.5 py-2 text-white backdrop-blur-md">
              <Construction size={15} className="text-gold" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
                Under construction
              </span>
            </span>
          </div>

          <h1 className="m-0 max-w-[820px] font-display text-[clamp(64px,11vw,132px)] font-extrabold leading-[0.82] tracking-[-0.035em] text-white">
            ENGINEERING,
            <br />
            UNCUT.
          </h1>

          <p className="mb-7 mt-7 max-w-[590px] font-sans text-[clamp(16px,2vw,20px)] leading-[1.65] text-white/75">
            The real work behind every flight — design decisions, workshop
            iterations, and field tests documented by the people building the
            aircraft.
          </p>

          <div className="flex flex-wrap gap-3 text-white/75">
            <MetaPill icon={<MapPin size={14} />} text="Alexandria, Egypt" />
            <MetaPill icon={<Timer size={14} />} text="Updated weekly" />
          </div>
        </div>
      </header>

      <section className="bg-surface px-6 py-24">
        <div className="mx-auto grid max-w-[var(--maxw-content)] gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <ScrollReveal>
            <SectionHeader
              eyebrow="Weekly updates"
              title={
                <>
                  Work happens before
                  <br />
                  the write-up.
                </>
              }
            />
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="border-l-2 border-brand pl-6">
              <p className="m-0 font-sans text-[17px] leading-[1.75] text-fg-muted">
                New field notes are being assembled from the workshop and
                flight tests behind this season. This build log will document
                the decisions, iterations, and people behind each milestone.
              </p>
              <p className="mb-0 mt-5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-brand-light">
                First entries in preparation
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

function MetaPill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3.5 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] backdrop-blur-sm">
      {icon}
      {text}
    </span>
  );
}
