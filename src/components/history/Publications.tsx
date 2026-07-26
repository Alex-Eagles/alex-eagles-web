/**
 * Publications — the team's peer-reviewed output, as an academic index.
 *
 * ─── WHY THIS ISN'T A CARD GRID ─────────────────────────────────────────────
 * The press section above is a grid because press coverage is visual and each
 * item is a photograph. Papers are the opposite: the valuable content is a
 * title, a venue, an author list and an abstract, and none of that survives
 * being squeezed into a third of a row. A publication list is a horizontal
 * form — the whole discipline writes them that way — so each paper gets a
 * full-width row with room for a real citation.
 *
 * ─── THE ABSTRACT PROBLEM ───────────────────────────────────────────────────
 * These abstracts run from ~700 to ~2,000 characters. Printed in full, four
 * papers would be longer than the rest of the page put together; cut short,
 * the reader loses the one thing that tells them whether the paper is relevant.
 *
 * So every abstract is clamped to four lines with a control to expand it in
 * place. The full text is always in the DOM — it's a CSS clamp, not a
 * substring — which matters twice over: search engines index the whole
 * abstract, and nothing is lost if the toggle never gets pressed. The old site
 * did `abstract.substring(0, 747) + "..."`, and those characters were simply
 * gone.
 *
 * ─── ONE LINK PER ROW, TWO PLACES TO CLICK IT ───────────────────────────────
 * The title is the link. The preview is the SAME link again, because clicking
 * a picture of a paper to open the paper is the most obvious thing in the row
 * — but it carries `aria-hidden` and `tabindex="-1"`, so a screen reader's
 * link list and the tab order each see the destination exactly once. Two
 * entries pointing at one URL is noise; a second mouse target for it is not.
 *
 * The row is NOT a stretched link over the whole card, which would have been
 * the other way to make it all clickable. An invisible anchor covering the
 * card also covers the abstract, and an abstract you cannot select — or that
 * navigates away when you drag across it to read — is worse than a smaller
 * click target.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import ScrubbedText from "@/components/ui/ScrubbedText";
import { fadeUp, staggerParent, viewportOnce } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { publications, FIELD_LABELS } from "@/data/publications";
import type { Publication } from "@/data/publications";

/**
 * Accent per research strand. Both tokens are theme-aware and already meet AA
 * on their own backgrounds in light and dark, so the tag doesn't need a
 * per-theme override.
 */
const FIELD_ACCENT = {
  aerospace: "var(--gold)",
  "computer-vision": "var(--sky)",
} as const;

export default function Publications() {
  const reduced = useReducedMotion();

  if (publications.length === 0) return null;

  return (
    <section id="publications" className="relative px-6 py-32 md:py-48">
      <div className="mx-auto" style={{ maxWidth: "var(--maxw-content)" }}>
        <motion.div
          variants={reduced ? undefined : fadeUp}
          initial={reduced ? undefined : "hidden"}
          whileInView={reduced ? undefined : "visible"}
          viewport={viewportOnce}
        >
          <SectionHeader
            eyebrow="Peer-reviewed work"
            title="Publications"
            align="center"
          />

          <ScrubbedText
            className="font-sans text-body text-fg-muted leading-[1.7] mt-6 mx-auto text-center"
            style={{ maxWidth: "var(--maxw-prose)" }}
          >
            Papers the team has published — in aircraft design, and in the
            computer vision that gets flown with it.
          </ScrubbedText>
        </motion.div>

        <motion.ol
          variants={reduced ? undefined : staggerParent}
          initial={reduced ? undefined : "hidden"}
          whileInView={reduced ? undefined : "visible"}
          viewport={viewportOnce}
          className="list-none p-0 m-0 mt-12 flex flex-col gap-6"
        >
          {publications.map((paper) => (
            <PublicationRow key={paper.id} paper={paper} reduced={reduced} />
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

/* ---- row ------------------------------------------------------------------ */

function PublicationRow({
  paper,
  reduced,
}: {
  paper: Publication;
  reduced: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const accent = FIELD_ACCENT[paper.field];
  const abstractId = `${paper.id}-abstract`;

  return (
    <motion.li variants={reduced ? undefined : fadeUp}>
      {/* The surface is built here rather than with GlassCard because this card
          needs its own shadow pair and its own easing — GlassCard hardcodes
          --elevation-3 and a shared hover, and overriding a utility with
          another utility of equal specificity is a coin toss. Everything else
          (radius, border, --card) is deliberately identical to it.

          The lift is honest: the title and the preview are both real links to
          the paper, so the whole card reading as interactive is a promise it
          keeps. `duration-220` with the strong ease-out leaves immediately and
          settles late, which is what stops a 3px move from feeling like drift. */}
      <div
        className={
          "group relative rounded-xl border border-border bg-[var(--card)] p-6 md:p-8 " +
          "shadow-[var(--elevation-card)] " +
          "transition-[transform,box-shadow] duration-[220ms] [transition-timing-function:var(--ease-out-strong)] " +
          "hover:-translate-y-1 hover:shadow-[var(--elevation-card-hover)] " +
          "motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        }
      >
        <div className="flex gap-5 md:gap-8">
          {/* ⚠ The `self-*` here is load-bearing — it just must never be
              `self-stretch` (the flex default). A flex child stretches to the
              row's full height, and a stretched height BEATS aspect-ratio: the
              preview was being drawn 150px wide by the whole height of the
              abstract, and object-cover then sliced the page's side margins
              off. ANY align-self other than stretch sizes the item from its
              own aspect-ratio instead, which is what fixes it.

              `self-center` rather than `self-start` so the page sits centred
              against the citation block. It also means expanding an abstract
              grows the card around a preview that stays put, instead of
              stretching it into a strip. */}
          <a
            href={paper.href}
            target="_blank"
            rel="noopener noreferrer"
            // The title link below already announces this destination. This is
            // the same URL again purely as a mouse target, so it's taken out of
            // the accessibility tree and out of the tab order rather than
            // announced twice.
            aria-hidden="true"
            tabIndex={-1}
            className={
              "self-center shrink-0 block overflow-hidden rounded-lg " +
              "w-[104px] sm:w-[136px] md:w-[172px] " +
              "border border-border shadow-[var(--elevation-2)] " +
              "transition-shadow duration-[220ms] [transition-timing-function:var(--ease-out-strong)] " +
              "group-hover:shadow-[var(--elevation-card)]"
            }
          >
            <img
              src={paper.preview}
              alt={`First page of “${paper.title}”`}
              loading="lazy"
              decoding="async"
              width={480}
              height={653}
              // The ratio matches the exported files exactly, so `contain`
              // letterboxes nothing today. It's here as the safety net: an
              // off-ratio file added later gets white bars against a white page
              // — invisible — instead of having its margins cropped away.
              className={
                "block w-full aspect-[480/653] object-contain bg-white " +
                "transition-transform duration-[400ms] [transition-timing-function:var(--ease-out-strong)] " +
                "group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              }
            />
          </a>

          <div className="min-w-0 flex-1">
            {/* Year + strand, and the outbound arrow pinned opposite them.
                The arrow used to sit inline after the title, where a long title
                pushed it onto a line of its own — an arrow floating under the
                headline with nothing beside it. Anchored to this row it can't
                wrap, and it lines up across every card in the list. */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-mono text-[12px] tracking-[0.12em] text-fg-subtle">
                  {paper.year}
                </span>
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.14em] rounded-full border px-2.5 py-1"
                  style={{ color: accent, borderColor: accent }}
                >
                  {FIELD_LABELS[paper.field]}
                </span>
              </div>

              <ArrowUpRight
                size={20}
                aria-hidden="true"
                className={
                  "shrink-0 text-fg-subtle opacity-60 " +
                  "transition-[opacity,transform,color] duration-[220ms] [transition-timing-function:var(--ease-out-strong)] " +
                  "group-hover:opacity-100 group-hover:text-[var(--sky)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 " +
                  "motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                }
              />
            </div>

            <h3 className="font-display font-bold text-h4 md:text-h3 text-fg leading-[1.15] m-0">
              <a
                href={paper.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${paper.title} — ${paper.venue} (opens in a new tab)`}
                className="no-underline text-fg group-hover:text-[var(--sky)] transition-colors duration-[220ms] [transition-timing-function:var(--ease-out-strong)]"
              >
                {paper.title}
              </a>
            </h3>

            {/* The citation. Authors first, then where it ran — the order a
                reader scans in when they're checking whether they know the
                work or the people. */}
            <p className="font-sans text-small text-fg-muted leading-[1.6] m-0 mt-3">
              {paper.authors.join(", ")}
            </p>

            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-fg m-0 mt-2">
              {paper.venue}
              {paper.venueDetail && (
                <span className="block normal-case tracking-[0.04em] text-fg-subtle mt-1">
                  {paper.venueDetail}
                </span>
              )}
            </p>

            <p
              id={abstractId}
              className={
                "font-sans text-small text-fg-muted leading-[1.7] m-0 mt-4 " +
                (expanded ? "" : "line-clamp-4")
              }
            >
              {paper.abstract}
            </p>

            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              aria-controls={abstractId}
              className={
                "mt-3 cursor-pointer bg-transparent border-0 p-0 " +
                "font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--sky)] " +
                "hover:underline underline-offset-4 transition-colors duration-[150ms]"
              }
            >
              {expanded ? "Show less" : "Read abstract"}
            </button>
          </div>
        </div>
      </div>
    </motion.li>
  );
}
