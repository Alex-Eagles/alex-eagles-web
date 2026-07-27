/**
 * History — the team's story as a scroll-driven journey.
 *
 * ─── PAGE SHAPE ─────────────────────────────────────────────────────────────
 *   HERO      normal scrolling — establishes context
 *   JOURNEY   pinned 3D scene, scrubbed by scroll (HistoryJourney)
 *   CLOSING   the same milestones as readable text (Timeline2D)
 *   PRESS     where the team has been covered (MediaCoverage)
 *   PAPERS    the peer-reviewed record (Publications)
 *   EVENTS    the competitions it builds for (Competitions)
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
 *
 * ─── THE PAGE IS BANDED, AND THE PAGE OWNS THE BANDING ──────────────────────
 * This is a very long scroll, so it alternates its background between two tones
 * to break into readable chapters:
 *
 *   BAND 1  deep   hero + journey + the full record
 *   BAND 2  lift   media coverage
 *   BAND 3  deep   publications
 *   BAND 4  lift   competitions
 *
 * Deep first, in both themes. Bands butt up hard and the light theme draws a
 * hairline at each join — .ae-band in global.css; the pair of colours, and the
 * edge, are --band-deep / --band-lift / --band-edge in theme.css.
 *
 * The BANDS LIVE HERE, not on the sections. They used to be a `bg-surface`
 * class hardcoded inside MediaCoverage and Competitions, which meant every one
 * of those components carried an opinion about what came before it — reorder
 * the page and you get two identical backgrounds touching, with nothing in the
 * files you edited to warn you. Rhythm is a property of the sequence, so it
 * belongs to the thing that owns the sequence. The sections are now
 * background-agnostic and can be moved freely.
 *
 * ⚠ The band wrappers must never gain `transform`, `filter`, `contain` or
 * `overflow` — each one creates a containing block, and BAND 1 contains the
 * `position: sticky` pin that the entire 3D journey scrolls on.
 */

import { motion } from "framer-motion";
import SectionHeader from "@/components/ui/SectionHeader";
import HistoryJourney, {
  useJourneyAvailable,
} from "@/components/history/HistoryJourney";
import Competitions from "@/components/history/Competitions";
import MediaCoverage from "@/components/history/MediaCoverage";
import Publications from "@/components/history/Publications";
import ScrollCue from "@/components/history/ScrollCue";
import Timeline2D from "@/components/history/Timeline2D";
import { fadeUp, viewportOnce } from "@/lib/motion";
import { achievements } from "@/data/achievements";

export default function History() {
  /**
   * Whether this visitor gets the 3D journey — asked here, not just inside the
   * component, because the page has to write around the answer.
   *
   * The hero used to promise "follow the path" unconditionally, which is a
   * broken instruction on a device with no WebGL2 or a visitor who asked for
   * reduced motion: there is no path, and the scroll cue below it points at a
   * section that isn't there. The 2D timeline is not a lesser version of the
   * journey, it is the full record either way — so when the journey is absent
   * the copy simply describes what IS on the page.
   */
  const journeyAvailable = useJourneyAvailable();

  const firstYear = achievements[0]?.year ?? "2013";
  const awardCount = achievements.reduce(
    (total, achievement) => total + achievement.awards.length,
    0,
  );

  /**
   * The range and the span both run to TODAY, not to the last award.
   *
   * These used to come from the data — `achievements[last].year` for the range
   * and `achievements.length` for the span — and both were answering a
   * different question from the one the copy asks. The range closed at 2025
   * because that's the most recent year with an award on file, which reads as
   * though the team stopped. And `achievements.length` is a count of ENTRIES,
   * not of years: 2013 is the founding year with no awards at all, and
   * 2014-2016 aren't listed, so ten entries were being described as ten years
   * of competition.
   *
   * Deriving from the current year fixes both and keeps them fixed. The
   * headline stays honest on its own every January instead of quietly going
   * stale the way a hardcoded "2026" would.
   */
  const currentYear = new Date().getFullYear();
  const yearsActive = currentYear - Number(firstYear);

  return (
    <>
      {/* ══ BAND 1 — deep ═════════════════════════════════════════════════
          The hero, the journey and the written record are one chapter: the
          team's own account of itself. `--flush` because there is no band
          above this one to divide it from, only the navbar. */}
      <div className="ae-band ae-band--deep ae-band--flush">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        {/* `pb-24` reserves the bottom strip for the scroll cue. The section
            centres its content with `items-center`, and padding is outside the
            box that centres — so the copy sits centred in the space ABOVE the
            cue rather than being overlapped by it on short viewports. */}
        <section className="relative min-h-[70vh] flex items-center px-6 pb-24 overflow-hidden">
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
              eyebrow={`${firstYear} — ${currentYear}`}
              title={
                <>
                  A decade of
                  <br />
                  building and flying
                </>
              }
            />

            {/* No bottom margin: this is the last child of a vertically CENTRED
                flex container, so trailing margin would be counted into the
                block's height and silently lift the copy off centre by half of
                it. Space below the hero is the section's job (`pb-24` above),
                where it can be reserved deliberately. */}
            <p
              className="font-sans text-body-lg text-fg-secondary leading-[1.7] mt-6"
              style={{ maxWidth: "var(--maxw-prose)" }}
            >
              {awardCount} awards across {yearsActive} years of competition.{" "}
              {journeyAvailable
                ? "Follow the path to travel through the team’s history, one milestone at a time."
                : "Scroll on for the full record, one milestone at a time."}
            </p>
          </motion.div>

          {/* Permanent, not dismiss-on-scroll: someone who scrolls down,
              doesn't understand what they're looking at, and comes back up is
              exactly who this is for — and a one-shot dismissal would have
              removed it before their second look. `z-10` puts it over the grid
              backdrop. */}
          <ScrollCue
            label="Scroll down to discover our history"
            className="z-10"
          />
        </section>

        {/* ── The journey ───────────────────────────────────────────────────
            Rendered only where it can actually run. It is pure enhancement:
            the record below is complete on its own, and the component's own
            runtime escape hatches (a crash, a device too slow even at the
            lowest tier) also resolve to nothing rather than to a duplicate of
            that record. See HistoryJourney. */}
        {journeyAvailable && <HistoryJourney />}

        {/* ── Closing timeline ────────────────────────────────────────────
            The written companion to the scene above. It gets clear air from
            the immersive journey (pt-24/pt-32) so it never crowds the canvas,
            and reveals with the same fadeUp used site-wide — opacity +
            transform only, runs once. */}
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
              eyebrow="Every milestone"
              title="The full record"
              align="center"
            />
          </motion.div>
        </section>

        <Timeline2D />
      </div>

      {/* ══ BAND 2 — lift ═════════════════════════════════════════════════
          The press wall. After the timeline on purpose: the milestones above
          are the team's own account of itself, and this is everyone else's —
          which is exactly the kind of change of voice a band change is for.
          Renders nothing when its data file is empty, and the empty band then
          removes itself (see .ae-band:empty). */}
      <div className="ae-band ae-band--lift">
        <MediaCoverage />
      </div>

      {/* ══ BAND 3 — deep ═════════════════════════════════════════════════
          The peer-reviewed record, back on the deeper tone so it doesn't read
          as one long shelf of links continuing from the press wall. */}
      <div className="ae-band ae-band--deep">
        <Publications />
      </div>

      {/* ══ BAND 4 — lift ═════════════════════════════════════════════════
          Closes the page. Deliberately last of the three: press coverage and
          papers are things the team produced, and this is the standing context
          they were produced in — the events it builds for, year after year.
          Ends on the lifted tone, which hands off to the footer. */}
      <div className="ae-band ae-band--lift">
        <Competitions />
      </div>
    </>
  );
}
