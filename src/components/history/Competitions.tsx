/**
 * Competitions — the three events the team flies at, and its record at each.
 *
 * ─── WHY ALTERNATING ROWS ───────────────────────────────────────────────────
 * This is the third "list of things" on the page, and the first two already
 * took the two obvious shapes: the press wall is a tiled grid, the publications
 * are stacked text rows. A third grid would make the page read as one long
 * repetition, and with only three items a grid also looks thin — one row of
 * three, then nothing.
 *
 * Alternating full-width rows solve both. Three items is exactly the count that
 * makes an alternating rhythm legible (left, right, left) rather than arbitrary,
 * and a wide row gives the banner room to be seen at a sensible size instead of
 * being shrunk into a card.
 *
 * ─── THE NUMBERS ARE THE POINT ──────────────────────────────────────────────
 * The blurbs describe what each competition IS, which is useful once. The stat
 * strip — appearances, awards, span of years — is what a visitor actually can't
 * get anywhere else, and it's read straight out of achievements.ts rather than
 * typed here. See the note in data/competitions.ts.
 *
 * ─── BANNER SIZING IS DELIBERATELY CAPPED ───────────────────────────────────
 * The SUAS and UAVC banners are only ~367px wide natively — that's all the
 * artwork there is. The image column is capped near that width rather than
 * filling the row, so they are never scaled far past 1:1 and never look soft.
 * SAE, which has resolution to spare, ships at 2x and sits in the same frame.
 */

import { motion } from "framer-motion";
import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import ScrubbedText from "@/components/ui/ScrubbedText";
import { fadeUp, staggerParent, viewportOnce } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/context/ThemeContext";
import { competitionEntries } from "@/data/competitions";
import type { CompetitionEntry } from "@/data/competitions";

export default function Competitions() {
  const reduced = useReducedMotion();

  // Walks every award in the timeline; memoised so it happens once rather than
  // on each re-render of the page.
  const entries = useMemo(() => competitionEntries(), []);

  if (entries.length === 0) return null;

  // No background of its own — the History page bands the scroll and this
  // section sits in one of them. See the band notes in History.tsx.
  return (
    <section id="competitions" className="relative px-6 py-32 md:py-48">
      <div className="mx-auto" style={{ maxWidth: "var(--maxw-content)" }}>
        <motion.div
          variants={reduced ? undefined : fadeUp}
          initial={reduced ? undefined : "hidden"}
          whileInView={reduced ? undefined : "visible"}
          viewport={viewportOnce}
        >
          <SectionHeader
            eyebrow="Where we fly"
            title="Competitions Participated In"
            align="center"
          />

          <ScrubbedText
            className="font-sans text-body text-fg-secondary leading-[1.7] mt-6 mx-auto text-center"
            style={{ maxWidth: "var(--maxw-prose)" }}
          >
            The events the team designs and builds for, and how it has done at
            each of them.
          </ScrubbedText>
        </motion.div>

        <motion.ol
          variants={reduced ? undefined : staggerParent}
          initial={reduced ? undefined : "hidden"}
          whileInView={reduced ? undefined : "visible"}
          viewport={viewportOnce}
          className="list-none p-0 m-0 mt-12 flex flex-col gap-6 md:gap-8"
        >
          {entries.map((entry, index) => (
            <CompetitionRow
              key={entry.name}
              entry={entry}
              flipped={index % 2 === 1}
              reduced={reduced}
            />
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

/* ---- row ------------------------------------------------------------------ */

function CompetitionRow({
  entry,
  flipped,
  reduced,
}: {
  entry: CompetitionEntry;
  flipped: boolean;
  reduced: boolean;
}) {
  // Two grades of the same banner; only the one the current theme uses is ever
  // fetched. Same approach the 3D scene takes with its aircraft renders.
  const { isDark } = useTheme();

  const first = entry.years[0];
  const last = entry.years[entry.years.length - 1];
  const span = first === last ? first : `${first}–${last}`;

  return (
    <motion.li variants={reduced ? undefined : fadeUp}>
      {/* Same surface vocabulary as the publication rows — border, --card, the
          card shadow pair — so the page's cards stay one family.

          Still no hover lift, even though the heading is now a link to the
          organisers' site. A publication row lifts because the row IS the
          paper — title and preview both go to the same place. Here the link is
          one line of a card that is mostly the team's own record, so lifting
          the whole thing would promise that anywhere on it is clickable. */}
      <div
        className={
          "group rounded-xl border border-border bg-[var(--card)] " +
          "shadow-[var(--elevation-card)] p-5 sm:p-6 md:p-8"
        }
      >
        <div
          className={
            "flex flex-col gap-6 md:gap-9 md:items-center " +
            (flipped ? "md:flex-row-reverse" : "md:flex-row")
          }
        >
          {/* Banner. Capped rather than fluid — see the header note on why.
              The frame owns the border, radius and clipping so the image can
              push past its own edges on hover without escaping them; scaling
              the image while IT held the radius would square off its corners
              mid-animation.

              A slow push-in and nothing else — no lift, and deliberately not a
              link either. The banner is the competition's branding, so making
              it clickable would read as the obvious way off to their site and
              quietly duplicate the heading's link for every pointer user while
              adding a second stop to the tab order for the same URL. */}
          <div
            className={
              "shrink-0 w-full md:w-[38%] lg:w-[380px] overflow-hidden " +
              "rounded-lg border border-border shadow-[var(--elevation-2)]"
            }
          >
            <img
              src={isDark ? entry.bannerDark : entry.bannerLight}
              alt={`${entry.name} competition branding`}
              loading="lazy"
              decoding="async"
              width={760}
              height={428}
              className={
                "block w-full aspect-video object-cover " +
                "transition-transform duration-[700ms] [transition-timing-function:var(--ease-out-strong)] " +
                "group-hover:scale-[1.06] " +
                "motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              }
            />
          </div>

          <div className="min-w-0 flex-1">
            {/* ── The name, and the only link on the row ──────────────────
                The heading carries it, not the card and not the banner. A
                whole-card link would put the organisers' site behind the
                blurb and behind the record strip, which are OUR text about
                OUR results — clicking either to be sent off-site is not what
                they promise.

                The arrow is there so the link is visible as one WITHOUT
                hovering. A colour change on hover is no affordance at all on a
                phone, which is where this section is most read, and this is
                the same mark the publication rows use for the same job. */}
            <h3 className="font-display font-bold text-h4 md:text-h3 text-fg leading-[1.15] m-0">
              {entry.href ? (
                <a
                  href={entry.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  // The visible text is an acronym on two of the three rows.
                  // This is where a screen reader gets the expansion and the
                  // warning that the link leaves the site.
                  aria-label={`${entry.fullName ?? entry.name} — official website (opens in a new tab)`}
                  className={
                    "inline-flex items-baseline gap-1.5 no-underline text-fg " +
                    "hover:text-[var(--sky)] focus-visible:text-[var(--sky)] " +
                    "transition-colors duration-[220ms] [transition-timing-function:var(--ease-out-strong)]"
                  }
                >
                  {entry.name}
                  <ArrowUpRight
                    size={20}
                    aria-hidden="true"
                    className={
                      // `self-center`, because an icon aligned to a text
                      // BASELINE sits low against a 33px display face — the
                      // arrow would hang off the bottom of the word.
                      "self-center shrink-0 opacity-70 " +
                      "transition-[opacity,transform] duration-[220ms] [transition-timing-function:var(--ease-out-strong)] " +
                      "group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 " +
                      "motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                    }
                  />
                </a>
              ) : (
                entry.name
              )}
            </h3>

            {entry.fullName && (
              <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-fg-secondary m-0 mt-2">
                {entry.fullName}
              </p>
            )}

            <p className="font-sans text-small md:text-body text-fg-secondary leading-[1.7] m-0 mt-4">
              {entry.blurb}
            </p>

            {/* The record. `dl` rather than divs: each of these is genuinely a
                label and its value, and that pairing is what a screen reader
                needs to read "Appearances, 7" instead of two loose numbers. */}
            <dl
              className={
                "grid grid-cols-3 gap-4 m-0 mt-6 pt-5 " +
                "border-t border-border"
              }
            >
              <Stat label="Appearances" value={String(entry.years.length)} />
              <Stat label="Awards" value={String(entry.awards.length)} />
              <Stat label={entry.years.length === 1 ? "Year" : "Years"} value={span} />
            </dl>
          </div>
        </div>
      </div>
    </motion.li>
  );
}

/**
 * One label-and-number cell in the record strip.
 *
 * The number reads above its label, but `dt` has to precede its `dd` in the
 * markup — so the ORDER is flipped in CSS with `flex-col-reverse` rather than
 * by hiding a duplicate label offscreen. One copy of the text, correct
 * document order, correct reading order.
 */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted mt-2">
        {label}
      </dt>
      <dd className="m-0 font-display font-bold text-h4 text-[var(--sky)] leading-none">
        {value}
      </dd>
    </div>
  );
}
