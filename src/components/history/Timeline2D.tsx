/**
 * Timeline2D — the same history, as a plain vertical timeline.
 *
 * ─── IT HAS TWO JOBS, AND THAT'S THE POINT ──────────────────────────────────
 *   1. The FALLBACK when the 3D journey can't run: no WebGL, a device that
 *      couldn't hold framerate even at the lowest tier, or a visitor who has
 *      asked their system to reduce motion.
 *   2. The CLOSING SECTION beneath the 3D journey for everyone else, so the
 *      full history is readable in one glance without scrubbing through it.
 *
 * Building it for both uses is what makes the fallback affordable. A fallback
 * that exists only for the unlucky minority tends to rot, because nobody looks
 * at it. This one is on screen for every visitor, so it can't quietly break.
 *
 * ─── IT IS ALSO THE ACCESSIBLE VERSION ──────────────────────────────────────
 * Real semantic markup — an ordered list of headings and text. Screen readers
 * and search engines read the team's history from here, not from the WebGL
 * canvas, which is invisible to both.
 */

import { motion } from "framer-motion";
import { fadeUp, staggerParent, viewportOnce } from "@/lib/motion";
import { achievements as defaultAchievements } from "@/data/achievements";
import type { Achievement } from "@/data/achievements";

interface Timeline2DProps {
  achievements?: Achievement[];
  /** Shown when this is standing in for the 3D scene rather than following it. */
  isFallback?: boolean;
}

export default function Timeline2D({
  achievements = defaultAchievements,
  isFallback = false,
}: Timeline2DProps) {
  return (
    <section className="relative px-6 py-20 md:py-28">
      <div className="mx-auto" style={{ maxWidth: "var(--maxw-content)" }}>
        {isFallback && (
          <p className="font-mono text-caption text-fg-muted uppercase tracking-[0.14em] text-center mb-10">
            Milestones
          </p>
        )}

        <motion.ol
          variants={staggerParent}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="list-none p-0 m-0 relative"
        >
          {/* The spine. Sits behind the markers, fading out at both ends so it
              doesn't collide hard with the section edges. */}
          <div
            aria-hidden="true"
            className="absolute left-[7px] md:left-1/2 top-0 bottom-0 w-px md:-translate-x-1/2"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--border-solid) 8%, var(--border-solid) 92%, transparent)",
            }}
          />

          {achievements.map((achievement, index) => (
            <motion.li
              key={achievement.id}
              variants={fadeUp}
              className="relative pl-9 md:pl-0 pb-10 last:pb-0"
            >
              <div
                className={`md:flex md:items-start md:gap-10 ${
                  index % 2 === 0 ? "" : "md:flex-row-reverse"
                }`}
              >
                {/* Year rail */}
                <div
                  className={`md:w-1/2 ${
                    index % 2 === 0 ? "md:text-right" : "md:text-left"
                  }`}
                >
                  <span className="font-mono text-[13px] tracking-[0.12em] text-[var(--sky)]">
                    {achievement.year}
                  </span>
                </div>

                {/* Content */}
                <div
                  className={`md:w-1/2 ${
                    index % 2 === 0 ? "md:text-left" : "md:text-right"
                  }`}
                >
                  {achievement.awards.length > 0 ? (
                    // One headline per award — the exact lines shown on the stop
                    // labels in the 3D scene above, so the written record reads
                    // identically. Multi-award years (2021, 2022, 2025) list
                    // every award, each with the competition it was won at.
                    <ul className="list-none p-0 m-0 space-y-4">
                      {achievement.awards.map((award, i) => (
                        <li key={i}>
                          <h3 className="font-display font-bold text-h4 text-fg m-0 leading-tight">
                            {award.place ? `${award.place} — ` : ""}
                            {award.title}
                          </h3>
                          <span className="font-mono text-[12px] tracking-[0.12em] uppercase text-[var(--text-muted)] mt-1.5 inline-block">
                            {award.competition}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    // Founding year — a real headline and description, since it
                    // has no awards to list.
                    <>
                      <h3 className="font-display font-bold text-h4 text-fg m-0 mb-2 leading-tight">
                        {achievement.title}
                      </h3>
                      {achievement.blurb && (
                        <p className="font-sans text-small text-fg-muted leading-[1.65] m-0">
                          {achievement.blurb}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Marker dot */}
              <span
                aria-hidden="true"
                className="absolute left-0 md:left-1/2 top-1 w-[15px] h-[15px] rounded-full md:-translate-x-1/2 border-2"
                style={{
                  background: "var(--bg-primary)",
                  borderColor: "var(--sky)",
                  boxShadow: "0 0 14px rgba(96,165,250,0.45)",
                }}
              />
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
