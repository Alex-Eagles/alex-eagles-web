/**
 * ScrollCue — a standing "keep scrolling" instruction: label + pulsing arrow.
 *
 * Used twice on the History page, which is why it's a component rather than
 * markup repeated in two files:
 *
 *   • at the foot of the HERO, above the journey — "this page is worth
 *     scrolling into";
 *   • inside the PINNED scene — "scrolling is still what's driving this".
 *
 * ─── BOTH ARE PERMANENT, WHICH IS UNUSUAL AND INTENTIONAL ───────────────────
 * Scroll cues normally dismiss themselves the moment they've been acted on,
 * and an infinite animation on a decorative element is a standard UI smell.
 * This page is the case where the usual rule doesn't apply, for two reasons.
 *
 * The pinned journey is ~9 viewports of scrolling in which the page never
 * visibly moves. "Keep scrolling" isn't a fact you learn once and retain — it's
 * the operating instruction for the whole section, and it's still true at the
 * last achievement. Someone who pauses at stop 4 to read a label has no
 * standing evidence that scrolling still drives this, and the scrollbar can't
 * tell them: it has been reporting steady downward motion the entire time the
 * view sat still.
 *
 * And the hero cue has to survive going back up. A visitor who scrolls down,
 * doesn't understand what they're looking at, and returns to the top is
 * exactly the person the cue exists for — a one-shot dismissal would have
 * removed it before their second look.
 *
 * ─── THE PULSE IS SPLIT IN TWO ──────────────────────────────────────────────
 * Label and arrow share one duration (--cue-cycle) so they read as a single
 * breath, but the arrow swings much further. That's a contrast constraint, not
 * a stylistic whim: the label is real text and must hold 4.5:1 at the DIMMEST
 * point of the loop, not just at the bright end, so it only fades to
 * --cue-fade-floor. The arrow is decorative and aria-hidden, so it carries no
 * such obligation and supplies the visible energy. See theme.css.
 *
 * Reduced motion kills both outright — following Hero.tsx, which gates its
 * animation in JS rather than relying on the global CSS override alone.
 */

import { ChevronDown } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ScrollCueProps {
  /** The instruction itself. Sentence-shaped; rendered in caps by the style. */
  label: string;
  /** Extra positioning classes, appended after the shared bottom-centre base. */
  className?: string;
}

export default function ScrollCue({ label, className = "" }: ScrollCueProps) {
  const reduced = useReducedMotion();

  const labelAnimation = reduced
    ? "none"
    : "ae-cue-pulse var(--cue-cycle) ease-in-out infinite";
  const arrowAnimation = reduced
    ? "none"
    : "ae-cue-arrow var(--cue-cycle) ease-in-out infinite";

  return (
    <div
      className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none ${className}`}
    >
      {/* Not aria-hidden: this is genuine instructional copy, and it's static
          text that gets read once when encountered rather than a live region.
          No `whitespace-nowrap` — the longer of the two labels measures ~350px
          at this size, and the wrapper is centred with no width of its own, so
          on a narrow phone it would size to max-content and be clipped by the
          section's `overflow-hidden`. Capped to the viewport so it wraps to two
          centred lines instead. */}
      <span
        className="font-mono text-caption uppercase tracking-[0.16em] text-fg-secondary text-center max-w-[calc(100vw-3rem)]"
        style={{ animation: labelAnimation }}
      >
        {label}
      </span>

      <ChevronDown
        aria-hidden="true"
        size={20}
        className="text-[var(--sky)]"
        style={{ animation: arrowAnimation }}
      />
    </div>
  );
}
