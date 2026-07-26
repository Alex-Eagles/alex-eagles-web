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
 * Accent per research strand — the SUB-TEAM's own colour, so a paper is
 * labelled in the same hue as the people who wrote it. Aerospace work carries
 * Aerodesign's blue and vision work carries Computer Vision's pink, matching
 * the palette the Team page uses for its section headings and card badges.
 *
 * ─── WHY THE TAG IS A SOLID CHIP AND NOT COLOURED TEXT ──────────────────────
 * It used to be `--gold`/`--sky` text inside a matching outline, which worked
 * because both of those tokens are theme-aware and re-tuned for the light
 * page. The sub-team accents are not: they are one pastel per discipline, in
 * both themes, picked to read on a dark card. Used as text they measure about
 * 2.1:1 on the white light-mode card — under half the AA floor, and the tag
 * would have been unreadable for exactly the readers who most need a label.
 *
 * Filling the chip instead turns the problem inside out. The accent becomes a
 * background, which carries no contrast obligation of its own, and the label
 * sits on it in --ink-on-accent — 8.8:1 on the Aerodesign blue and 8.3:1 on
 * the Computer Vision pink. The discipline's real colour shows at full
 * strength, identically in both themes, and the tag reads at a glance rather
 * than as tinted small caps.
 *
 * Adding a third strand? Check the new accent against --ink-on-accent first:
 * the palette is mostly pastels, but not entirely. See the note on that token.
 */
const FIELD_ACCENT = {
  aerospace: "var(--team-aerodesign)",
  "computer-vision": "var(--team-computer-vision)",
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
        {/* ── The card stacks below `sm` ─────────────────────────────────────
            Side by side, this row gave the text about 170px on a 390px phone —
            a 22px headline in a 170px column wraps to five lines, the author
            list becomes a ribbon one or two names wide, and the abstract is a
            column of three-word lines. The preview was 104px, too small to read
            as a page.

            Stacked, the text gets the card's whole width and the preview gets
            to be large enough to recognise. Nothing changes from `sm` upward,
            where there is room for both. */}
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 md:gap-8">
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
              stretching it into a strip.

              It carries its weight twice over now: in the stacked layout the
              same class centres the preview HORIZONTALLY, because align-self
              works across whichever axis is the cross axis. */}
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
              // Nearly twice its old mobile size, because it is no longer
              // competing with the text for the same row.
              "w-[190px] sm:w-[136px] md:w-[172px] " +
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

          {/* ── Reading order, and how it differs on a phone ──────────────────
              A flex column, so `order` can put the TITLE first on mobile and
              the year/strand row first from `sm` up.

              Stacked, the reader has just been shown a picture of the paper and
              the next thing they need is its name — leading with "2022 ·
              AEROSPACE" makes them read a filing label before they know what
              they are filing. Side by side that row is doing a different job:
              it sits in the column beside the preview as the card's header, and
              it carries the outbound arrow, which has to stay at the top right
              corner where it lines up across every card in the list.

              DOM order still puts the header first, so the tab order and the
              screen-reader order are the desktop reading order in both layouts
              — `order` moves boxes, not semantics, and the title is a link. */}
          <div className="min-w-0 flex-1 flex flex-col">
            {/* Year + strand, and the outbound arrow pinned opposite them.
                The arrow used to sit inline after the title, where a long title
                pushed it onto a line of its own — an arrow floating under the
                headline with nothing beside it. Anchored to this row it can't
                wrap, and it lines up across every card in the list.

                The margin flips with the order: below the title on mobile it
                needs air above, above the title on desktop it needs air below. */}
            <div className="order-2 sm:order-1 flex items-center justify-between gap-3 mt-3 sm:mt-0 mb-0 sm:mb-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-mono text-[12px] tracking-[0.12em] text-fg-subtle">
                  {paper.year}
                </span>
                {/* No border: on a solid chip an outline in the same colour
                    does nothing, and one in any other colour would be a second
                    edge competing with the fill. */}
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.14em] rounded-full px-2.5 py-1"
                  style={{ background: accent, color: "var(--ink-on-accent)" }}
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

            <h3 className="order-1 sm:order-2 font-display font-bold text-h4 md:text-h3 text-fg leading-[1.15] m-0">
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
            <p className="order-3 font-sans text-small text-fg-muted leading-[1.6] m-0 mt-3">
              {paper.authors.join(", ")}
            </p>

            <p className="order-4 font-mono text-[12px] uppercase tracking-[0.12em] text-fg m-0 mt-2">
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
                // 16px on a phone, the site's `small` 14px from `sm` up. This
                // is the longest prose on the page and, stacked, it is the
                // card's main reading content — 14px academic prose in a 294px
                // column is under the readable floor for body text on mobile.
                // From `sm` it goes back to the shared scale, where it sits in
                // a wide column beside the preview and matches every other
                // secondary paragraph on the site.
                "order-5 font-sans text-body sm:text-small text-fg-muted leading-[1.7] m-0 mt-4 " +
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
                // `self-start` because this is now a flex child: left to
                // stretch it would span the card and centre its own label,
                // which reads as a full-width bar rather than a text link.
                "order-6 self-start mt-3 cursor-pointer bg-transparent border-0 p-0 " +
                // A 12px line of text is a ~16px tap target. The vertical
                // padding brings it to the 44px floor without moving the text,
                // since the negative margin gives the space straight back to
                // the layout.
                "py-3 -my-1 " +
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
