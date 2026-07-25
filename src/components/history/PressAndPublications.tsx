/**
 * PressAndPublications — the paper trail the team leaves behind: press
 * coverage, the papers and reports the team wrote, and the competitions it has
 * flown at.
 *
 * ─── WHY THESE THREE SIT IN ONE SECTION ─────────────────────────────────────
 * Split into three sections they would each be a two-card shelf, and a page
 * that already runs long would grow three more headings for very little. Held
 * together they answer one question — what is on the record about this team —
 * and the filter bar lets a visitor narrow to the one they came for without
 * scrolling past the other two.
 *
 * ─── IT DEGRADES BY DISAPPEARING ────────────────────────────────────────────
 * The content comes from `data/press.ts`, where the coverage and publication
 * arrays may legitimately be empty until the real entries are supplied. An
 * empty category drops out of the filter bar instead of rendering a heading
 * over nothing, and with all three empty the section returns null and the page
 * closes on the timeline exactly as it did before. So there is never a state
 * where this reads as broken or unfinished — only as smaller.
 *
 * ─── EVERYTHING IS REAL TEXT ────────────────────────────────────────────────
 * Same reasoning as Timeline2D: an ordered list of headings, dates and links
 * that a screen reader and a crawler can both read. External links carry
 * `rel="noopener noreferrer"` and are announced as opening in a new tab.
 */

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import GlassCard from "@/components/ui/GlassCard";
import { fadeUp, staggerParent, viewportOnce } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  coverage,
  publications,
  competitionRecords,
} from "@/data/press";
import type { CompetitionRecord, PressItem } from "@/data/press";

/** The filter bar's options. "all" is always available; the rest are earned. */
type Filter = "all" | "coverage" | "publication" | "competition";

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  coverage: "Media coverage",
  publication: "Publications",
  competition: "Competitions",
};

/** What the little chip in a card's top-left says. */
const KIND_LABELS = {
  coverage: "Coverage",
  publication: "Publication",
  competition: "Competition",
} as const;

export default function PressAndPublications() {
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");

  // Derived from achievements.ts, so it changes only when that file does —
  // memoised to keep the walk over every award out of the filter's re-render.
  const competitions = useMemo(() => competitionRecords(), []);

  const counts = {
    coverage: coverage.length,
    publication: publications.length,
    competition: competitions.length,
  };
  const total = counts.coverage + counts.publication + counts.competition;

  // Nothing on the record yet → no section at all. See the header comment.
  if (total === 0) return null;

  // Only categories that actually have entries become filters, and the filter
  // bar itself only appears when there's more than one thing to choose
  // between — a lone "All / Competitions" pair is a control that can't change
  // anything on screen.
  const available = (["coverage", "publication", "competition"] as const).filter(
    (kind) => counts[kind] > 0,
  );
  const showFilters = available.length > 1;

  const showCoverage = filter === "all" || filter === "coverage";
  const showPublications = filter === "all" || filter === "publication";
  const showCompetitions = filter === "all" || filter === "competition";

  return (
    <section
      id="on-the-record"
      className="relative bg-surface px-6 py-20 md:py-28"
    >
      <div className="mx-auto" style={{ maxWidth: "var(--maxw-content)" }}>
        <motion.div
          variants={reduced ? undefined : fadeUp}
          initial={reduced ? undefined : "hidden"}
          whileInView={reduced ? undefined : "visible"}
          viewport={viewportOnce}
        >
          <SectionHeader
            eyebrow="On the record"
            // As a fragment, not a plain string: `title` is typed ReactNode and
            // an HTML entity in a string ATTRIBUTE is not decoded — it would
            // print the literal "&amp;". In JSX children it is.
            title={<>Coverage, papers &amp; competitions</>}
            align="center"
          />

          {/* Built from what's actually on screen, not hardcoded. A fixed
              sentence naming all three would keep promising coverage and
              papers while those arrays are still empty — the one form of
              "unfinished" this section is otherwise careful never to show. */}
          <p
            className="font-sans text-body text-fg-muted leading-[1.7] mt-6 mx-auto text-center"
            style={{ maxWidth: "var(--maxw-prose)" }}
          >
            {sentence(available)}
          </p>
        </motion.div>

        {showFilters && (
          <div
            role="group"
            aria-label="Filter by type"
            className="flex flex-wrap items-center justify-center gap-2 mt-9"
          >
            {(["all", ...available] as Filter[]).map((option) => {
              const active = filter === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  aria-pressed={active}
                  className={
                    "font-mono text-[12px] uppercase tracking-[0.12em] " +
                    "rounded-full border px-4 py-2 " +
                    "transition-[background,color,border-color] duration-[150ms] ease-out " +
                    (active
                      ? "border-[var(--sky)] text-[var(--sky)] bg-[var(--jump-row-active)]"
                      : "border-border text-fg-muted hover:text-fg hover:bg-[var(--jump-row-hover)]")
                  }
                >
                  {FILTER_LABELS[option]}
                  {option !== "all" && (
                    <span className="ml-2 opacity-60">{counts[option]}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* `key` on the filter re-mounts the grid, so a filter change replays
            the stagger instead of swapping the cards instantly. The variants
            are `once: true`, which would otherwise fire only on first sight. */}
        <motion.ul
          key={filter}
          variants={reduced ? undefined : staggerParent}
          initial={reduced ? undefined : "hidden"}
          whileInView={reduced ? undefined : "visible"}
          viewport={viewportOnce}
          className="list-none p-0 m-0 mt-10 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        >
          {showCoverage &&
            coverage.map((item) => (
              <PressCard key={item.id} item={item} kind="coverage" reduced={reduced} />
            ))}

          {showPublications &&
            publications.map((item) => (
              <PressCard
                key={item.id}
                item={item}
                kind="publication"
                reduced={reduced}
              />
            ))}

          {showCompetitions &&
            competitions.map((record) => (
              <CompetitionCard
                key={record.competition}
                record={record}
                reduced={reduced}
              />
            ))}
        </motion.ul>
      </div>
    </section>
  );
}

/* ---- cards ---------------------------------------------------------------- */

/**
 * One press piece or publication.
 *
 * The whole card is a link when there's somewhere to point, and plain markup
 * when there isn't — a print clipping with no URL shouldn't grow a hover lift
 * and a pointer cursor promising a click that does nothing.
 */
function PressCard({
  item,
  kind,
  reduced,
}: {
  item: PressItem;
  kind: "coverage" | "publication";
  reduced: boolean;
}) {
  const body = (
    <GlassCard
      interactive={Boolean(item.href)}
      className="group p-7 flex flex-col h-full"
    >
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <Chip>{KIND_LABELS[kind]}</Chip>
        <span className="font-mono text-[12px] tracking-[0.08em] text-fg-subtle whitespace-nowrap">
          {item.date}
        </span>
      </div>

      <h3 className="font-display font-bold text-h4 text-fg leading-tight m-0 mb-2.5">
        {item.title}
      </h3>

      <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-fg-muted m-0">
        {item.outlet}
        {item.language && (
          <span className="text-fg-subtle"> &middot; {item.language}</span>
        )}
      </p>

      {item.authors && item.authors.length > 0 && (
        <p className="font-sans text-small text-fg-muted leading-[1.6] m-0 mt-2.5">
          {item.authors.join(", ")}
        </p>
      )}

      {item.blurb && (
        <p className="font-sans text-small text-fg-muted leading-[1.65] m-0 mt-4 flex-1">
          {item.blurb}
        </p>
      )}

      {item.href && (
        // `mt-auto` pins this to the bottom edge however tall the blurb is, so
        // the read-links line up across a row of uneven cards.
        <span className="inline-flex items-center gap-1.5 mt-auto pt-5 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--sky)]">
          {kind === "publication" ? "Read the paper" : "Read the piece"}
          <ArrowUpRight
            size={14}
            aria-hidden="true"
            className="transition-transform duration-[150ms] ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      )}
    </GlassCard>
  );

  return (
    <motion.li variants={reduced ? undefined : fadeUp} className="h-full">
      {item.href ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          // The card already names the outlet and the date; without this a
          // screen reader hears "Read the piece" with no idea which one, and
          // gets no warning about the new tab.
          aria-label={`${item.title} — ${item.outlet} (opens in a new tab)`}
          className="block h-full no-underline"
        >
          {body}
        </a>
      ) : (
        body
      )}
    </motion.li>
  );
}

/** One competition, with every year the team flew it and every award won. */
function CompetitionCard({
  record,
  reduced,
}: {
  record: CompetitionRecord;
  reduced: boolean;
}) {
  const firstYear = record.years[0];
  const lastYear = record.years[record.years.length - 1];
  const span = firstYear === lastYear ? firstYear : `${firstYear}–${lastYear}`;

  return (
    <motion.li variants={reduced ? undefined : fadeUp} className="h-full">
      {/* Not interactive: there's nowhere to click through to. */}
      <GlassCard interactive={false} className="p-7 flex flex-col h-full">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <Chip>{KIND_LABELS.competition}</Chip>
          <span className="font-mono text-[12px] tracking-[0.08em] text-fg-subtle whitespace-nowrap">
            {span}
          </span>
        </div>

        <h3 className="font-display font-bold text-h4 text-fg leading-tight m-0">
          {record.competition}
        </h3>

        {record.fullName && (
          <p className="font-sans text-small text-fg-muted leading-[1.5] m-0 mt-1.5">
            {record.fullName}
          </p>
        )}

        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-fg-muted m-0 mt-4">
          {record.years.length}{" "}
          {record.years.length === 1 ? "year" : "years"} &middot;{" "}
          {record.awards.length}{" "}
          {record.awards.length === 1 ? "award" : "awards"}
        </p>

        <ul className="list-none p-0 m-0 mt-4 space-y-2 flex-1">
          {record.awards.map((award, i) => (
            <li
              key={i}
              className="font-sans text-small text-fg leading-[1.5] flex gap-2.5"
            >
              <span
                aria-hidden="true"
                className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: "var(--gold)" }}
              />
              <span>
                {award.place ? `${award.place} — ` : ""}
                {award.title}
              </span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </motion.li>
  );
}

/* ---- intro copy ----------------------------------------------------------- */

/** One clause per category present, in the order the cards appear. */
const CLAUSES = {
  coverage: "where the team has been written about",
  publication: "what it has published",
  competition: "the competitions it has flown at",
} as const;

/**
 * Joins the clauses into a real sentence — "A.", "A and B.", "A, B and C." —
 * rather than a comma-spliced list with a dangling "and" when a category is
 * missing.
 */
function sentence(available: readonly (keyof typeof CLAUSES)[]): string {
  const parts = available.map((kind) => CLAUSES[kind]);
  const joined =
    parts.length <= 1
      ? (parts[0] ?? "")
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

  // Sentence case: the clauses are written lowercase so they can be joined in
  // any order, so the first one has to be lifted here.
  return `${joined.charAt(0).toUpperCase()}${joined.slice(1)}.`;
}

/** The small category label in a card's top-left. */
function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-subtle border border-border rounded-full px-2.5 py-1">
      {children}
    </span>
  );
}
