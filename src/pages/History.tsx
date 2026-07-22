/**
 * History — the team's story as a scroll-driven journey.
 *
 * ─── PAGE SHAPE ─────────────────────────────────────────────────────────────
 *   HERO      normal scrolling — establishes context
 *   JOURNEY   pinned 3D scene, scrubbed by scroll (HistoryJourney)
 *   CLOSING   the same milestones as readable text (Timeline2D)
 *
 * The hero earns its place beyond looking good: it gives the browser a few
 * hundred milliseconds to fetch the 3D chunk, create the WebGL context and
 * compile shaders BEFORE the visitor reaches the scene. Drop the visitor
 * straight into the canvas and all of that happens under their eyes, which is
 * exactly where a stutter is most damaging.
 *
 * The closing timeline repeats every milestone as plain semantic text. That's
 * what screen readers and search engines actually read — a WebGL canvas is
 * invisible to both — and it means nobody has to scrub a 3D scene to find out
 * what happened in 2019.
 */

import { motion } from "framer-motion";
import SectionHeader from "@/components/ui/SectionHeader";
import HistoryJourney from "@/components/history/HistoryJourney";
import Timeline2D from "@/components/history/Timeline2D";
import { fadeUp, viewportOnce } from "@/lib/motion";
import { achievements } from "@/data/achievements";

export default function History() {
  const firstYear = achievements[0]?.year ?? "2013";
  const latestYear = achievements[achievements.length - 1]?.year ?? "2025";
  const awardCount = achievements.reduce(
    (total, achievement) => total + achievement.awards.length,
    0,
  );

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-center px-6 overflow-hidden">
        {/* Same grid texture used elsewhere on the site, masked to a soft pool. */}
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

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto w-full"
          style={{ maxWidth: "var(--maxw-content)" }}
        >
          <SectionHeader
            eyebrow={`${firstYear} — ${latestYear}`}
            title={
              <>
                A decade of
                <br />
                building and flying
              </>
            }
          />

          <p
            className="font-sans text-body-lg text-fg-muted leading-[1.7] mt-6 mb-8"
            style={{ maxWidth: "var(--maxw-prose)" }}
          >
            {awardCount} awards across {achievements.length} years of
            competition. Follow the path to travel through the team&rsquo;s
            history, one milestone at a time.
          </p>
        </motion.div>
      </section>

      {/* ── The journey ─────────────────────────────────────────────────────
          Self-gating: renders the 3D scene where the device can hold it, and
          the plain timeline everywhere else. See HistoryJourney. */}
      <HistoryJourney />

      {/* ── Closing timeline ──────────────────────────────────────────────
          The written companion to the scene above. It gets clear air from the
          immersive journey (pt-24/pt-32) and a supporting line so the heading
          never reads as a lonely, dropped-in label. Reveals with the same
          fadeUp used site-wide — opacity + transform only, runs once. */}
      <section className="relative px-6 pt-24 md:pt-32">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto"
          style={{ maxWidth: "var(--maxw-content)" }}
        >
          <SectionHeader
            eyebrow="Prefer to read?"
            title="The whole story, in writing"
            align="center"
          />

          <p
            className="font-sans text-body-lg text-fg-muted leading-[1.7] mt-7 mx-auto text-center"
            style={{ maxWidth: "var(--maxw-prose)" }}
          >
            Every milestone laid out year by year — {achievements.length}{" "}
            entries and {awardCount} awards between {firstYear} and{" "}
            {latestYear}, in the order they happened.
          </p>
        </motion.div>
      </section>

      <Timeline2D />
    </>
  );
}
