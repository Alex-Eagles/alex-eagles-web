import type { Variants } from "framer-motion";

/**
 * Shared Framer Motion variants — the site's animation vocabulary lives here so
 * every section reveals with the same feel. (Timings mirror the design spec.)
 */

/** Fade + rise. The default entrance for sections and cards. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

/**
 * Parent for staggered grids (blog cards, sponsors, team members).
 * Pair with `fadeUp` on each child.
 */
export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/** Standard viewport trigger config: animate once, a touch before fully in view. */
export const viewportOnce = { once: true, margin: "-80px" } as const;
