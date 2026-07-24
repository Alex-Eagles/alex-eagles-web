import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import AeLogo from "@/components/ui/AeLogo";

const LOGO_SIZE = 140;
/** How long the emblem takes to fly diagonally across the screen. */
const FLIGHT_MS = 1100;
/** How long the backdrop takes to fade away once the flight ends. */
const FADE_MS = 400;

/**
 * IntroSplash — a one-time, eagle-themed intro shown on first load: the
 * emblem flies diagonally across the whole screen (bottom-left to top-right,
 * banking through the turn like a bird), then the backdrop fades to reveal
 * the site. Mounted once in App.tsx, above everything (z-[100]), so it only
 * plays on an actual page load — not on client-side route changes.
 *
 * Skipped entirely for prefers-reduced-motion visitors.
 */
export default function IntroSplash() {
  const prefersReducedMotion = useReducedMotion();
  const [show, setShow] = useState(!prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = setTimeout(() => setShow(false), FLIGHT_MS + 100);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
          style={{ background: "var(--bg-primary)" }}
          aria-hidden="true"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS / 1000, ease: "easeInOut" }}
        >
          <motion.div
            className="fixed"
            style={{
              top: "50%",
              left: "50%",
              marginTop: -LOGO_SIZE / 2,
              marginLeft: -LOGO_SIZE / 2,
            }}
            initial={{ x: "-60vw", y: "60vh", rotate: -20, scale: 0.5, opacity: 0 }}
            animate={{
              x: ["-60vw", "0vw", "60vw"],
              y: ["60vh", "0vh", "-60vh"],
              rotate: [-20, 0, 20],
              scale: [0.5, 1.15, 0.5],
              opacity: [0, 1, 1],
            }}
            transition={{
              duration: FLIGHT_MS / 1000,
              times: [0, 0.5, 1],
              ease: "easeInOut",
            }}
          >
            <AeLogo size={LOGO_SIZE} title="" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
