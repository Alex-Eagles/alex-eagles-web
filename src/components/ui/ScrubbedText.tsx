/**
 * ScrubbedText — a paragraph whose words light up one at a time as you scroll.
 *
 * ─── HOW IT DIFFERS FROM ScrollReveal ───────────────────────────────────────
 * ScrollReveal is a TRIGGER: the block crosses a threshold and plays a fade-up
 * once, on its own clock. This is a SCRUB: there is no clock at all, and the
 * text's state is a pure function of scroll position, so it runs forward when
 * you scroll down and backward when you scroll up. Use it where the reading
 * itself is the thing being paced — a section's opening line — and ScrollReveal
 * for everything that just needs to arrive.
 *
 * ─── WHY EACH WORD IS ITS OWN COMPONENT ─────────────────────────────────────
 * Every word needs its own `useTransform`, and calling a hook inside `.map()`
 * only happens to work while the array length never changes. Pushing the hook
 * down into a child makes it a top-level call in that child, which is correct
 * by construction rather than by luck.
 *
 * ─── THE LAST WORD LIGHTS EARLY, ON PURPOSE ─────────────────────────────────
 * Words are spread across the first `SCRUB_SPAN` of the range, not all of it.
 * The final section on a page can sit close enough to the bottom that the
 * document simply runs out of scroll before the range completes — and the
 * failure mode there is a permanently half-dim paragraph that looks broken.
 * Finishing early means the tail of the range is slack nobody ever needs.
 */

import { useRef } from "react";
import type { CSSProperties } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ScrubbedTextProps {
  /** Plain text — it gets split on spaces, so no markup. */
  children: string;
  className?: string;
  style?: CSSProperties;
  /**
   * Opacity of a word before the scroll reaches it. Not lower than this: the
   * point is "not yet arrived", and a word at 0.05 reads as a rendering fault.
   */
  from?: number;
}

/** Fraction of the scroll range the words are spread across. See header. */
const SCRUB_SPAN = 0.85;

export default function ScrubbedText({
  children,
  className,
  style,
  from = 0.15,
}: ScrubbedTextProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLParagraphElement>(null);

  // A fixed slice of viewport travel rather than the element's own height, so
  // a two-line paragraph and a five-line one scrub at the same rate instead of
  // the short one flashing past.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "start 0.5"],
  });

  if (reduced) {
    return (
      <p className={className} style={style}>
        {children}
      </p>
    );
  }

  const words = children.split(" ");

  return (
    <p ref={ref} className={className} style={style}>
      {words.map((word, index) => (
        <Word
          key={index}
          progress={scrollYProgress}
          from={from}
          start={(index / words.length) * SCRUB_SPAN}
          end={((index + 1) / words.length) * SCRUB_SPAN}
        >
          {word}
        </Word>
      ))}
    </p>
  );
}

function Word({
  children,
  progress,
  from,
  start,
  end,
}: {
  children: string;
  progress: MotionValue<number>;
  from: number;
  start: number;
  end: number;
}) {
  const opacity = useTransform(progress, [start, end], [from, 1]);

  return (
    <>
      {/* inline-block so the word can carry its own opacity without becoming a
          block. The space is a real text node OUTSIDE the span — put it inside
          and the line loses its break opportunities, because a browser will not
          wrap in the middle of an inline-block. */}
      <motion.span className="inline-block" style={{ opacity }}>
        {children}
      </motion.span>{" "}
    </>
  );
}
