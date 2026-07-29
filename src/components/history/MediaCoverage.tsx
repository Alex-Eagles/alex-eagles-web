/**
 * MediaCoverage — the press wall: every time the team was on air or in print.
 *
 * ─── THE TILE IS THE PHOTO ──────────────────────────────────────────────────
 * Each piece is a full-bleed 16:9 still with the outlet's logo and a caption
 * laid over a scrim, rather than a text card with a thumbnail stuck on top.
 * Press coverage is a visual medium — a frame of the actual broadcast tells a
 * visitor more in a glance than any headline we could write for it, and it's
 * the only thing here we genuinely have for all six pieces (the Facebook watch
 * links carry no title and no date).
 *
 * ─── WHY NOT GlassCard ──────────────────────────────────────────────────────
 * GlassCard is a padded surface for text, and everything here bleeds to the
 * tile's edge. The surface tokens below — border, --card, --elevation-3, the
 * lift on hover — are deliberately the SAME ones GlassCard uses, so the tiles
 * sit in the site's card family without inheriting padding they'd have to undo.
 *
 * ─── WHAT MAKES IT WORK IN BOTH THEMES ──────────────────────────────────────
 * The interior of a tile is a photograph, so it looks identical in dark and
 * light — only the frame around it changes. The two things drawn ON the photo
 * (the caption text and the outlet logo) are unchanged between themes too,
 * because they sit on the image and its scrim, not on the page.
 *
 * ─── NO ICON BADGE ──────────────────────────────────────────────────────────
 * The whole tile is the link, so there is nothing for a play triangle to do
 * that the tile isn't already doing — it sat in the middle of every still,
 * covering the frame it was supposed to be advertising. What signals "this is
 * clickable" instead: the pointer cursor, the tilt and lift under the pointer,
 * the slow push-in on the photo, and the caption naming what the link opens.
 *
 * ─── THE DEPTH IS DONE IN TWO LAYERS ────────────────────────────────────────
 * A panel holds all six tiles, and each tile tips toward the pointer. Neither
 * half works alone: tilting a tile that floats on the page has nothing to tilt
 * against, and a panel of flat tiles is just a lighter rectangle. Together the
 * panel is the surface and the tiles are objects lying on it, which is where
 * the depth actually comes from — the shadows land on something.
 *
 * The tilt is real 3D (`perspective` + `rotateX/rotateY`), spring-damped, and
 * driven by pointer position. It is decorative, so it is switched off wholesale
 * for `prefers-reduced-motion` and for every non-mouse pointer; the shadow
 * still deepens on hover, which carries the affordance without any movement.
 */

import type { PointerEvent as ReactPointerEvent } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import SectionHeader from "@/components/ui/SectionHeader";
import ScrubbedText from "@/components/ui/ScrubbedText";
import { fadeUp, staggerParent, viewportOnce } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  mediaCoverage,
  thumbnailSrcSet,
  THUMBNAIL_SIZES,
} from "@/data/mediaCoverage";
import type { CoverageItem } from "@/data/mediaCoverage";

/** The caption under each tile's logo, and what the link promises. */
const KIND_LABELS = {
  interview: "TV interview",
  article: "Article",
} as const;

/**
 * How far a tile tips toward the pointer, in degrees at the very corner.
 *
 * Small on purpose. Past about 10° the perspective starts distorting the still
 * badly enough to notice, and the tile stops reading as a photograph lying on
 * the panel and starts reading as a rendered object.
 */
const TILT_MAX = 7;

/**
 * Snappy, and just short of bouncing. A tilt that overshoots reads as wobble
 * rather than weight — and unlike a one-shot entrance, this value is being
 * retargeted continuously as the pointer moves, so any bounce compounds.
 */
const TILT_SPRING = { stiffness: 220, damping: 24, mass: 0.6 } as const;

export default function MediaCoverage() {
  const reduced = useReducedMotion();

  // Nothing to show → no section. Same defensive shape as the rest of the
  // page: the data file is the only thing anyone edits, and emptying it should
  // never leave a heading standing over a blank grid.
  if (mediaCoverage.length === 0) return null;

  // No background of its own. The History page bands the whole scroll and this
  // section sits in one of them (see the band notes in History.tsx) — a
  // `bg-surface` here would paint over the seam that fades the previous chapter
  // into this one, and would silently break the alternation if the section were
  // ever moved.
  return (
    <section id="media-coverage" className="relative px-6 py-32 md:py-48">
      <div className="mx-auto" style={{ maxWidth: "var(--maxw-content)" }}>
        <motion.div
          variants={reduced ? undefined : fadeUp}
          initial={reduced ? undefined : "hidden"}
          whileInView={reduced ? undefined : "visible"}
          viewport={viewportOnce}
        >
          <SectionHeader
            eyebrow="In the press"
            title="Media Coverage"
            align="center"
          />

          <ScrubbedText
            className="font-sans text-body text-fg-secondary leading-[1.7] mt-6 mx-auto text-center"
            style={{ maxWidth: "var(--maxw-prose)" }}
          >
            We&rsquo;ve been featured on several news outlets — on national
            television and in print.
          </ScrubbedText>
        </motion.div>

        {/* ── The tray ──────────────────────────────────────────────────────
            All six tiles live on ONE panel rather than floating loose on the
            section. Six separate cards on an empty background is a grid of
            unrelated things; the same six on a shared surface read as one
            collection — a press wall — and the panel gives every tile a
            consistent surface to cast its shadow onto, which is what sells the
            depth. It also means the light theme has an actual object on the
            page instead of white cards on a white background.

            `bg-elevated` is a real step up from the lifted band this section
            sits in, in both themes (#161a50 on #0d1035 dark, #eceeff on #ffffff
            light), so the panel is legible as a surface before its shadow does
            any work. */}
        <div
          className={
            "mt-12 rounded-2xl border border-border bg-elevated " +
            "p-5 sm:p-7 md:p-9 shadow-[var(--elevation-panel)]"
          }
        >
          <motion.ul
            variants={reduced ? undefined : staggerParent}
            initial={reduced ? undefined : "hidden"}
            whileInView={reduced ? undefined : "visible"}
            viewport={viewportOnce}
            className="list-none p-0 m-0 grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {mediaCoverage.map((item) => (
              <CoverageTile key={item.id} item={item} reduced={reduced} />
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}

/* ---- tile ----------------------------------------------------------------- */

function CoverageTile({
  item,
  reduced,
}: {
  item: CoverageItem;
  reduced: boolean;
}) {
  // Raw pointer position feeds these; the springs are what the transform reads.
  // Writing straight to a transform would tie the tile rigidly to the cursor,
  // which reads as a texture stuck to the mouse rather than an object with any
  // mass. The spring gives it lag and settle.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const lift = useMotionValue(0);
  const rotateX = useSpring(tiltX, TILT_SPRING);
  const rotateY = useSpring(tiltY, TILT_SPRING);
  const translateY = useSpring(lift, TILT_SPRING);

  // Built as ONE transform string rather than framer's `rotateX`/`y` shorthand
  // props: the shorthands run on the main thread via requestAnimationFrame, so
  // they drop frames exactly when the page is busy. A composed `transform` is
  // handed to the compositor.
  const transform = useMotionTemplate`perspective(900px) translate3d(0, ${translateY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  function handlePointerMove(event: ReactPointerEvent<HTMLAnchorElement>) {
    // `pointerType` rather than a hover media query, because a touch drag over
    // the tile also fires pointermove — and a tile left tilted after a scroll,
    // with nothing to un-tilt it, is worse than no effect at all.
    if (reduced || event.pointerType !== "mouse") return;

    const box = event.currentTarget.getBoundingClientRect();
    const dx = (event.clientX - box.left) / box.width - 0.5;
    const dy = (event.clientY - box.top) / box.height - 0.5;

    // rotateX is negated: pushing the pointer DOWN the tile should tip its far
    // edge away, not toward.
    tiltY.set(dx * TILT_MAX * 2);
    tiltX.set(-dy * TILT_MAX * 2);
    lift.set(-8);
  }

  function resetTilt() {
    tiltX.set(0);
    tiltY.set(0);
    lift.set(0);
  }

  return (
    <motion.li variants={reduced ? undefined : fadeUp}>
      <motion.a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ transform }}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        // A tile can be tabbed to without the pointer ever touching it, and it
        // can also be tabbed AWAY from mid-tilt. Resetting on blur stops one
        // being left leaning.
        onBlur={resetTilt}
        // The tile's visible text is a logo and the words "TV interview" —
        // which, read aloud on its own, names neither the outlet nor where the
        // link goes. This is the only place a screen reader gets both, plus
        // the warning that it leaves the site.
        aria-label={`${item.outlet}${item.outletNative ? ` (${item.outletNative})` : ""} — ${KIND_LABELS[item.kind]}${
          item.date ? `, ${item.date}` : ""
        } (opens in a new tab)`}
        className={
          "group block no-underline cursor-pointer overflow-hidden rounded-xl " +
          "border border-border bg-[var(--card)] shadow-[var(--elevation-card)] " +
          // Transform is deliberately NOT in this transition — it belongs to
          // the springs above, and a css transition on the same property would
          // fight them for control every frame the pointer moves.
          "transition-shadow duration-[250ms] [transition-timing-function:var(--ease-out-strong)] " +
          "hover:shadow-[var(--elevation-card-hover)]"
        }
      >
        <div className="relative aspect-video overflow-hidden">
          <img
            src={item.thumbnail}
            // The 800px master is the `src` fallback; `srcSet` offers the
            // smaller cuts and `sizes` tells the browser how wide the tile
            // really is, without which it assumes 100vw and takes the master
            // on every device — see mediaCoverage.ts.
            srcSet={thumbnailSrcSet(item.thumbnail)}
            sizes={THUMBNAIL_SIZES}
            // Describes the still itself. The link's own label (above) covers
            // where it goes, so this doesn't repeat it.
            alt={`Still from the ${item.outlet} ${KIND_LABELS[
              item.kind
            ].toLowerCase()}`}
            loading="lazy"
            decoding="async"
            width={800}
            height={450}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />

          {/* Scrim. Weighted to the bottom, where the logo and caption sit.
              It deepens slightly on hover, which is the second half of the
              push-in: the photo advances, the overlay settles. */}
          <div
            aria-hidden="true"
            className={
              "absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5 " +
              "transition-opacity duration-[250ms] ease-out group-hover:opacity-90"
            }
          />

          {/* Caption row */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
            {/* No plate behind it — the scrim IS the logo's background, and
                the marks are pre-lifted to survive on it while keeping their
                brand colour. See the note in data/mediaCoverage.ts. */}
            <img
              src={item.outletLogo}
              alt={item.outlet}
              loading="lazy"
              decoding="async"
              // One height for all five. The files are pre-balanced by ink
              // area onto a shared canvas, so this single value draws a wide
              // wordmark (CBC) and a stacked mark (MBC) at the same visual
              // weight — no per-outlet sizing in here.
              className="shrink-0 h-10 w-auto object-contain"
              // Two drop-shadows, not one, and inline rather than as utilities
              // because stacking two `drop-shadow-[…]` classes collides on the
              // same `filter` property. A tight dark edge separates coloured
              // ink from a busy still; the wider one carries it if the frame
              // happens to be pale right where the logo lands.
              style={{
                filter:
                  "drop-shadow(0 1px 2px rgba(0,0,0,0.75)) drop-shadow(0 3px 8px rgba(0,0,0,0.45))",
              }}
            />

            <span className="text-right">
              <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-white">
                {KIND_LABELS[item.kind]}
              </span>
              {(item.date || item.language) && (
                <span className="block font-mono text-[11px] uppercase tracking-[0.08em] text-white/75 mt-1">
                  {[item.date, item.language].filter(Boolean).join(" · ")}
                </span>
              )}
            </span>
          </div>
        </div>
      </motion.a>
    </motion.li>
  );
}
