import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, PlaneTakeoff, Play, X, Clock } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import ScrollReveal from "@/components/ui/ScrollReveal";
import GlassCard from "@/components/ui/GlassCard";
import { prototypes, type Prototype } from "@/data/prototypes";

type View = "ground" | "flight";

/**
 * Prototypes — the two test airframes (Hexa, then Quad) that preceded the
 * final rescue-drone build, told as a timeline. Each card alternates
 * media/copy sides (About.tsx pattern), lets visitors toggle the photo
 * between ground/in-flight, and opens a "Watch it fly" video modal (YouTube
 * embed once `videoUrl` is set in data/prototypes.ts — a placeholder shows
 * until then).
 */
export default function Prototypes() {
  return (
    <section
      id="prototypes"
      className="max-w-[var(--maxw-content)] mx-auto px-6 py-[100px]"
    >
      <SectionHeader
        eyebrow="Before the final build"
        title={
          <>
            Two test drones,
            <br />
            one final design
          </>
        }
        align="center"
        className="mb-6"
      />

      <p className="font-sans text-body-lg text-fg-muted leading-[1.7] mx-auto prose-measure text-center">
        Before committing to the rescue drone's final airframe, we built and
        flew two test platforms — the Hexa first, then the Quad — to prove our
        thrust, payload, and structural calculations against real flight data.
      </p>

      <div className="flex flex-col gap-16 mt-16">
        {prototypes.map((proto, i) => (
          <PrototypeCard
            key={proto.id}
            proto={proto}
            mediaFirst={i % 2 === 0}
          />
        ))}
      </div>
    </section>
  );
}

function PrototypeCard({
  proto,
  mediaFirst,
}: {
  proto: Prototype;
  mediaFirst: boolean;
}) {
  const [view, setView] = useState<View>("ground");
  const [videoOpen, setVideoOpen] = useState(false);
  const src = view === "ground" ? proto.groundImage : proto.flightImage;

  return (
    <>
      <ScrollReveal>
        <GlassCard interactive={false} className="overflow-hidden">
          <div
            className={`grid lg:grid-cols-[1.05fr_1fr] ${
              mediaFirst ? "" : "lg:[&>*:first-child]:order-2"
            }`}
          >
            {/* Media */}
            <div className="relative aspect-[4/3] lg:aspect-auto bg-black border-b lg:border-b-0 lg:border-r border-border">
              <img
                key={view}
                src={src}
                alt={`${proto.name} — ${view === "ground" ? "on the ground" : "in flight"}`}
                className="absolute inset-0 w-full h-full object-cover animate-[ae-fade-in_0.3s_ease-out]"
              />

              {/* Ground / In-flight toggle */}
              <div className="absolute top-4 left-4 flex items-center gap-1 p-1 rounded-full bg-black/55 backdrop-blur-sm border border-white/10">
                <button
                  type="button"
                  onClick={() => setView("ground")}
                  aria-pressed={view === "ground"}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-[12.5px] font-medium transition-colors ${
                    view === "ground"
                      ? "bg-gold text-black"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  <MapPin size={13} />
                  Ground
                </button>
                <button
                  type="button"
                  onClick={() => setView("flight")}
                  aria-pressed={view === "flight"}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-[12.5px] font-medium transition-colors ${
                    view === "flight"
                      ? "bg-gold text-black"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  <PlaneTakeoff size={13} />
                  In Flight
                </button>
              </div>

              {/* Watch it fly */}
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold text-black font-sans text-[13px] font-semibold shadow-[var(--elevation-3)] transition-transform hover:scale-[1.03]"
              >
                <Play size={14} fill="currentColor" />
                Watch it fly
              </button>
            </div>

            {/* Copy */}
            <div className="p-8 lg:p-10">
              <div className="eyebrow mb-2">{proto.role}</div>
              <h3 className="font-display font-bold text-h3 text-fg tracking-[-0.01em] m-0 mb-1.5">
                {proto.name}
              </h3>
              <p className="font-sans text-[15px] font-medium text-gold mb-4">
                {proto.tagline}
              </p>
              <p className="font-sans text-body text-fg-muted leading-[1.75] mb-6">
                {proto.summary}
              </p>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6 pb-6 border-b border-[var(--border-subtle)]">
                {proto.stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="font-mono text-[15px] font-medium text-fg leading-tight">
                      {stat.value}
                    </div>
                    <div className="font-sans text-[12px] text-fg-muted uppercase tracking-[0.06em] mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              <ul className="flex flex-col gap-2.5 mb-6">
                {proto.highlights.map((point) => (
                  <li
                    key={point}
                    className="font-sans text-[14px] text-fg-muted leading-[1.6] pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-gold"
                  >
                    {point}
                  </li>
                ))}
              </ul>

              <div className="rounded-md bg-[var(--brand-glow)] border border-border px-4 py-3.5">
                <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-gold mb-1">
                  What it taught us
                </div>
                <p className="font-sans text-[13.5px] text-fg-muted leading-[1.6] m-0">
                  {proto.lesson}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </ScrollReveal>

      <FlightVideoModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        name={proto.name}
        videoUrl={proto.videoUrl}
      />
    </>
  );
}

function FlightVideoModal({
  open,
  onClose,
  name,
  videoUrl,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  videoUrl?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl"
          onClick={onClose}
        >
          <button
            type="button"
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[70]"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
          >
            <X size={26} />
          </button>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-[900px] aspect-video rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a]"
            onClick={(e) => e.stopPropagation()}
          >
            {videoUrl ? (
              <iframe
                src={videoUrl}
                title={`${name} — flight footage`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                <Clock size={26} className="text-gold opacity-80" />
                <p className="font-sans text-[15px] text-white/80 m-0">
                  Flight footage for the {name} is on its way.
                </p>
                <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-white/40 m-0">
                  Check back soon
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
