import { ArrowRight, Image as ImageIcon, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import SectionHeader from "@/components/ui/SectionHeader";
import ScrollReveal from "@/components/ui/ScrollReveal";

/**
 * About — a two-column "who we are" block: copy + achievement badge on the
 * left, a team-photo panel on the right. Replace the placeholder panel with a
 * real <img> (object-cover) when the photo is ready.
 */
export default function About() {
  return (
    <section
      id="about"
      className="max-w-[var(--maxw-content)] mx-auto px-6 py-[100px] grid gap-16 items-center lg:grid-cols-[1.05fr_1fr]"
    >
      {/* Left — copy */}
      <ScrollReveal>
        <SectionHeader
          eyebrow="Who we are"
          title={
            <>
              Built by students,
              <br />
              flown for excellence
            </>
          }
        />

        <p className="font-sans text-[17px] leading-[1.75] text-fg-secondary max-w-[62ch] mt-6 mb-5">
          Alex Eagles is a multidisciplinary undergraduate team designing,
          building, and flying autonomous aircraft for the Student Unmanned
          Aerial Systems competition. From carbon-fiber airframes to onboard
          autonomy, every system is engineered, tested, and documented in-house.
        </p>

        {/* Achievement highlight. */}
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--brand-glow)] border border-border mb-6">
          <Trophy size={16} className="text-brand-light" />
          <span className="font-sans text-[13px] font-semibold text-fg">
            Top-10 finish · SUAS 2024
          </span>
        </div>

        <div>
          <Link
            to="/team"
            className="font-sans font-semibold text-[15px] text-brand-light no-underline inline-flex items-center gap-1.5 hover:gap-2.5 transition-all"
          >
            Learn more about the team
            <ArrowRight size={18} />
          </Link>
        </div>
      </ScrollReveal>

      {/* Right — team photo placeholder */}
      <ScrollReveal delay={0.1}>
        <div
          className="relative aspect-[4/3] rounded-md overflow-hidden border border-border flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, var(--brand-dark), #0f0f0f)",
            boxShadow: "var(--elevation-3)",
          }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />
          {/* Swap this block for:
              <img src="/team/team-photo.webp" alt="The Alex Eagles team"
                   loading="lazy" decoding="async"
                   className="absolute inset-0 w-full h-full object-cover" />
              Recommended export: 1200×900 (4:3), WebP. */}
          <div className="relative text-center text-fg-muted">
            <ImageIcon size={48} strokeWidth={1.5} className="mx-auto mb-2.5" />
            <div className="font-sans text-[13px] tracking-[0.08em] uppercase">
              Team photo
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
