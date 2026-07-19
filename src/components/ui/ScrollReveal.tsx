import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { fadeUp, viewportOnce } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Optional delay (seconds) to sequence sibling reveals. */
  delay?: number;
}

/**
 * ScrollReveal — wraps content in the standard fade-up-on-scroll entrance.
 *
 * If the visitor prefers reduced motion, it renders a plain <div> with no
 * animation. Use it around any block you want to animate into view.
 */
export default function ScrollReveal({
  children,
  className,
  style,
  delay = 0,
}: ScrollRevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
