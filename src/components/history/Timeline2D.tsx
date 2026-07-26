/**
 * Timeline2D — the team's history as a vertical timeline the light travels down.
 *
 * ─── WHAT IT IS ─────────────────────────────────────────────────────────────
 * The closing section of the History page, and the ONLY place the full record
 * exists as real text: an ordered list of headings screen readers and search
 * engines can read, which a WebGL canvas is invisible to. It is also what the
 * page falls back to when the 3D journey above can't run at all — in that case
 * the journey renders nothing and this list simply IS the history (see
 * HistoryJourney; it used to render its own second copy of this component,
 * which put the entire timeline on the page twice).
 *
 * ─── ONE MOVING PART DRIVES EVERYTHING ──────────────────────────────────────
 * A ball of light travels down the spine as you scroll, exactly like the one in
 * the 3D scene above, in the same `--journey-light`. Everything else on this
 * timeline is a function of WHERE THAT BALL IS:
 *
 *   · it reaches a marker  → the marker fills with the ball's own colour, in
 *                            the same frame, and stays filled behind it
 *   · it approaches a row  → the milestone gathers itself into place, arriving
 *                            exactly as the ball lands on its year
 *   · it has gone past     → the spine behind it stays lit, so the fill doubles
 *                            as a progress bar for a long section that had none
 *
 * That single-source rule is not stylistic. The marker ignition used to be
 * driven by the ROW's own position in the viewport while the ball was driven by
 * the LIST's scroll progress — two different ranges over two different
 * elements, which meant the two agreed nowhere. The ball would sail past a
 * marker and the marker would light some scroll distance later. Anything that
 * has to happen "when the ball gets there" now reads the ball's own value, so
 * "when" is not a number anyone has to keep in sync.
 *
 * ─── THE MARKERS DO NOT MOVE. EVER. ─────────────────────────────────────────
 * The row's arrival transform (`x`/`y`/`scale`) is on the CONTENT, never on the
 * <li>. The marker is a sibling of the animated content inside a static <li>,
 * so it is welded to the spine.
 *
 * When the transform was on the <li>, the marker inherited it — every row's
 * circle drifted sideways off the spine as it arrived, and the ball passed a
 * ring that was no longer in its path. Only the pop-on-contact scales the
 * marker, and scale is about its own centre, so it grows without shifting.
 *
 * ─── TWO SCROLL SUBSCRIPTIONS FOR THE WHOLE SECTION ─────────────────────────
 * `fill` (the ball) and `exit` (has this row left the top of the screen yet).
 * Both read the list itself, and every per-row threshold is a NUMBER computed
 * once from layout — not a scroll subscription of its own.
 *
 * The obvious build gives each row a `useScroll` bound to its own travel, which
 * is eleven subscriptions here and grows with the data. Measuring once and
 * doing arithmetic gets the identical result: the relationship between the
 * list's scroll progress and any row's position in it is fixed by layout, so it
 * only has to be re-derived when layout changes.
 *
 * ─── WHAT IT DELIBERATELY DOES NOT ANIMATE ──────────────────────────────────
 * Only `opacity` and `transform` — both compositor properties, so ten rows
 * scrubbing at once cost no layout and no paint. The tempting fourth idea, a
 * depth-of-field `filter: blur()` on the receding rows, is exactly the one to
 * leave out: `filter` repaints the element every frame it changes, and this
 * section sits directly after the heaviest thing on the site.
 *
 * ─── REDUCED MOTION GETS NONE OF IT ─────────────────────────────────────────
 * Not a gentler version — none of it. For that visitor the 3D journey does not
 * render, so this list is the only way to read the history at all, and it
 * renders completely inert: full opacity, no transforms, every marker lit, a
 * plain spine. Text whose legibility depends on scroll position is the last
 * thing that page should hand them.
 */

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { achievements as defaultAchievements } from "@/data/achievements";
import type { Achievement } from "@/data/achievements";

interface Timeline2DProps {
  achievements?: Achievement[];
}

/* ---- the ball's track ----------------------------------------------------- */

/**
 * Where the ball is on screen when it starts and finishes its run, as a
 * fraction of viewport height from the top.
 *
 * Both in the lower-middle of the screen, and that is the whole point: a marker
 * lights at the moment the ball reaches it, so these two numbers decide where
 * on the screen every ignition happens. Between 0.65 and 0.45 the marker being
 * lit is comfortably in view and the milestone attached to it has room to be
 * read before it starts leaving. Push the pair downward and rows light up in
 * the visitor's peripheral vision at the bottom edge; push them up and the ball
 * ignites rows that have already been read.
 *
 * These must stay in step with the `offset` passed to `useScroll` below — the
 * geometry maths reads them to work out where any row is at a given fill value,
 * so the strings are built FROM the constants rather than written twice.
 */
const FILL_START = 0.65;
const FILL_END = 0.45;

/**
 * Smoothing for the ball.
 *
 * Raw `scrollYProgress` steps in whatever increments the input device emits, so
 * a notched mouse wheel makes the ball jump in visible chunks. The spring turns
 * those steps into a glide.
 *
 * Everything on the timeline reads the SPRUNG value, not the raw one — markers,
 * rows, the spine fill. That is what guarantees a marker lights on the frame the
 * ball touches it even during a fast fling: they are literally the same number.
 * Snappier than a display spring (nothing here should feel elastic) but soft
 * enough to absorb a wheel notch.
 */
const BALL_SPRING = { stiffness: 110, damping: 28, mass: 0.35 } as const;

/* ---- distances, in scroll pixels ------------------------------------------ */

/** How much scroll a milestone takes to gather itself before the ball lands. */
const LEAD_PX = 220;

/**
 * The contact window: how much scroll the marker takes to fill.
 *
 * Short by design — this is the beat the visitor asked to be immediate. It ends
 * exactly ON the marker's centre, so the fill completes as the ball arrives
 * rather than trailing after it, and it starts about where the ball's leading
 * edge first touches the ring, so the colour reads as being poured in.
 */
const CONTACT_PX = 14;

/** How long the impact pop takes to settle back to resting size. */
const POP_PX = 90;

/** How long the halo takes to settle from its flash to its resting glow. */
const HALO_SETTLE_PX = 260;

/* ---- the receding tail ---------------------------------------------------- */

/**
 * Where a row starts and finishes receding, as a fraction of viewport height
 * from the top. It begins dimming once its marker is inside the top quarter of
 * the screen and is done a hair after the marker has left.
 */
const RECEDE_ENTER = 0.25;
const RECEDE_EXIT = -0.05;

/**
 * How faint a milestone goes once the ball has left it behind.
 *
 * A floor, not a dial to taste. Low enough that the rows behind you clearly
 * give the stage to the one being read, high enough that a reader who stops
 * mid-scroll with a row near the top of the screen can still see there is text
 * there. At 0 this reads as content deleting itself.
 */
const RECEDE_OPACITY = 0.18;

/* ---- row arrival ---------------------------------------------------------- */

/**
 * How far a row drifts in from its own side of the spine.
 *
 * Small, and much smaller than the vertical rise. The two columns already say
 * which side of the spine a milestone belongs to; the drift only confirms it.
 * Past ~30px rows stop settling into place and start sliding across the page.
 */
const DRIFT_X = 18;

/** How far a row rises as it arrives. */
const RISE_Y = 44;

/**
 * Distance from a row's top edge to the centre of its marker: the marker's
 * `top-1` offset (4px) plus half its 15px height.
 *
 * This is the one number here that is duplicated from the markup rather than
 * measured, because measuring it would mean a ref per marker and a second
 * layout read to save four pixels of arithmetic. If the marker's size or `top`
 * changes, change this — the symptom is markers lighting slightly before or
 * after the ball touches them.
 */
const MARKER_CENTRE_PX = 11.5;

/* ---- geometry ------------------------------------------------------------- */

/** Everything about one row that can be derived from layout instead of scroll. */
interface RowGeometry {
  /** `fill` value at which the ball's centre meets this row's marker. */
  reach: number;
  /** `exit` value at which this row begins to recede. */
  recedeFrom: number;
  /** `exit` value at which it is fully receded. */
  recedeTo: number;
}

interface Layout {
  rows: RowGeometry[];
  /**
   * One scroll pixel, expressed in `fill` units. Lets the px constants above be
   * used directly as animation windows without knowing the list's height.
   */
  fillPerPx: number;
}

/**
 * Stand-in used for the single render before the layout effect measures.
 *
 * `useLayoutEffect` runs before paint, so this is never actually painted — but
 * the transforms are built during render and their input ranges must be real
 * increasing numbers, not NaN, on the way through.
 */
function estimateLayout(count: number): Layout {
  return {
    fillPerPx: 1 / 2000,
    rows: Array.from({ length: count }, (_, index) => {
      const reach = count > 1 ? index / (count - 1) : 0;
      return { reach, recedeFrom: reach + 0.2, recedeTo: reach + 0.3 };
    }),
  };
}

/**
 * How much of a viewport-height change to write off as browser chrome.
 *
 * Mobile browsers fire `resize` every time the URL bar slides away and back,
 * which is several times per scroll and moves `innerHeight` by roughly 60-120px
 * — and half the thresholds here are relative to viewport height. Re-deriving
 * them mid-scroll would re-time every row under the reader, so a height change
 * on its own has to clear this bar before it counts as a real resize. A
 * rotation or a window drag moves the width, or moves the height far further
 * than this, and is picked up either way.
 */
const URL_BAR_SLACK_PX = 140;

/** The row geometry used before anything has been measured. Hoisted so it is
 *  one stable object rather than a fresh one on every render. */
const UNMEASURED_ROW: RowGeometry = {
  reach: 0,
  recedeFrom: 0.2,
  recedeTo: 0.3,
};

function sameLayout(a: Layout, b: Layout): boolean {
  return (
    a.fillPerPx === b.fillPerPx &&
    a.rows.length === b.rows.length &&
    a.rows.every((row, index) => row.reach === b.rows[index].reach)
  );
}

export default function Timeline2D({
  achievements = defaultAchievements,
}: Timeline2DProps) {
  const reduced = useReducedMotion();
  const listRef = useRef<HTMLOListElement>(null);
  const [layout, setLayout] = useState<Layout>(() =>
    estimateLayout(achievements.length),
  );

  /**
   * The ball's own track. 0 with the list's top edge low on the screen, 1 with
   * its bottom edge just above the middle — so the run finishes while the last
   * milestone is still being read, rather than after it has left.
   */
  const { scrollYProgress: rawFill } = useScroll({
    target: listRef,
    offset: [`start ${FILL_START}`, `end ${FILL_END}`],
  });
  const fill = useSpring(rawFill, BALL_SPRING);

  /**
   * The exit track: the list's full travel across the viewport, bottom edge to
   * top edge. Rows read it to know when they have left the screen.
   *
   * A separate range rather than more arithmetic on `fill`, because `fill`
   * saturates at 1 while the last rows are still on screen — derived from it,
   * the final milestones could never finish receding.
   */
  const { scrollYProgress: exit } = useScroll({
    target: listRef,
    offset: ["start end", "end start"],
  });

  /**
   * Convert layout into the numbers the animations need. Runs on mount, on any
   * change to the list's own height (a font loading, a card reflowing) and on
   * viewport resize, since half the thresholds are relative to screen height.
   */
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || reduced) return;

    let frame = 0;
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;

    const measure = () => {
      const height = list.offsetHeight;
      if (height === 0) return;

      const viewport = window.innerHeight;
      lastWidth = window.innerWidth;
      lastHeight = viewport;
      // Total scroll distance covered by the ball's track, and by the exit
      // track. Both fall straight out of the `offset` ranges above.
      const fillSpan = (FILL_START - FILL_END) * viewport + height;
      const exitSpan = height + viewport;

      const rows = Array.from(
        list.querySelectorAll<HTMLLIElement>(":scope > li"),
      ).map((row) => {
        const centre = row.offsetTop + MARKER_CENTRE_PX;

        // A marker sits `centre` px down a rail that spans the list, and the
        // ball sits at `fill` of that same rail — so they meet at exactly this
        // fraction. No screen-space maths involved, which is why contact is
        // frame-exact regardless of viewport size or scroll speed.
        const reach = centre / height;

        // On the exit track the row's marker is at `viewport - t * exitSpan +
        // centre` pixels from the top of the screen. Solving that for the two
        // screen positions the recede runs between gives the pair below.
        const at = (fraction: number) =>
          (viewport * (1 - fraction) + centre) / exitSpan;

        return {
          reach,
          recedeFrom: at(RECEDE_ENTER),
          recedeTo: at(RECEDE_EXIT),
        };
      });

      const next: Layout = { rows, fillPerPx: 1 / fillSpan };
      setLayout((current) => (sameLayout(current, next) ? current : next));
    };

    // Synchronously the first time, inside the layout effect, so the very first
    // painted frame already has real thresholds. Everything after is batched
    // into a frame: `measure` reads offsetHeight and offsetTop, which forces
    // layout, and an unthrottled resize drag would do that on every event.
    measure();

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    // The list's own height changes when fonts swap in or copy rewraps; the
    // viewport's changes on rotate and resize. Both invalidate the thresholds,
    // and neither fires the other's event.
    const observer = new ResizeObserver(schedule);
    observer.observe(list);

    const onResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (width === lastWidth && Math.abs(height - lastHeight) < URL_BAR_SLACK_PX) {
        return;
      }
      schedule();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [achievements.length, reduced]);

  // `top` for the ball: a percentage of the rail's own height, so it needs no
  // measurement and survives the list growing when a year is added.
  const ballTop = useTransform(fill, (value) => `${value * 100}%`);
  // A travelling light has nothing to do before the run starts or after it has
  // arrived; parked at either end it just reads as a stray dot on the rail.
  const ballOpacity = useTransform(fill, [0, 0.02, 0.97, 1], [0, 1, 1, 0]);

  return (
    <section className="relative px-6 pt-12 md:pt-16 pb-20 md:pb-28">
      <div className="mx-auto" style={{ maxWidth: "var(--maxw-content)" }}>
        <ol ref={listRef} className="list-none p-0 m-0 relative">
          {/* ── The spine ──────────────────────────────────────────────────
              Positioning lives on this wrapper and NOT on the animated layers
              inside it. `md:-translate-x-1/2` is a transform, and Framer writes
              the fill's `scaleY` into the same `transform` property — put them
              on one element and the centring is silently overwritten the first
              frame the fill moves, dropping the whole spine half its width off
              the middle of the page, on desktop only. */}
          <div
            aria-hidden="true"
            className="absolute left-[7px] md:left-1/2 top-0 bottom-0 w-px md:-translate-x-1/2"
          >
            {/* Untravelled rail. Fades at both ends so it doesn't collide hard
                with the section edges. */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, var(--border-solid) 8%, var(--border-solid) 92%, transparent)",
              }}
            />

            {!reduced && (
              <>
                {/* The travelled part. `origin-top` + `scaleY` rather than an
                    animated `height`: scale is a compositor transform, height
                    is a layout property and would reflow the rail every frame. */}
                <motion.div
                  className="absolute inset-0 origin-top"
                  style={{
                    scaleY: fill,
                    background:
                      "linear-gradient(to bottom, transparent, var(--journey-light) 7%, var(--journey-light))",
                  }}
                />

                {/* The ball. Only `top` and `opacity` are animated, so the
                    centring transforms in the classes survive untouched. */}
                <motion.span
                  className="absolute left-1/2 w-[9px] h-[9px] rounded-full -translate-x-1/2 -translate-y-1/2"
                  style={{
                    top: ballTop,
                    opacity: ballOpacity,
                    background: "var(--journey-light)",
                    // `none` in light mode by design — see --journey-glow in
                    // theme.css for why a halo cannot survive a pale page.
                    boxShadow: "var(--journey-glow)",
                  }}
                />
              </>
            )}
          </div>

          {achievements.map((achievement, index) => (
            <Milestone
              key={achievement.id}
              achievement={achievement}
              index={index}
              reduced={reduced}
              fill={fill}
              exit={exit}
              geometry={layout.rows[index] ?? UNMEASURED_ROW}
              fillPerPx={layout.fillPerPx}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---- one milestone -------------------------------------------------------- */

function Milestone({
  achievement,
  index,
  reduced,
  fill,
  exit,
  geometry,
  fillPerPx,
}: {
  achievement: Achievement;
  index: number;
  reduced: boolean;
  fill: MotionValue<number>;
  exit: MotionValue<number>;
  geometry: RowGeometry;
  fillPerPx: number;
}) {
  const { reach, recedeFrom, recedeTo } = geometry;

  // The px windows from the top of the file, in `fill` units for this layout.
  const lead = LEAD_PX * fillPerPx;
  const contact = CONTACT_PX * fillPerPx;
  const pop = POP_PX * fillPerPx;
  const haloSettle = HALO_SETTLE_PX * fillPerPx;

  // Content is on the RIGHT of the spine for even rows (the year rail takes the
  // left half) and on the LEFT for odd ones, which `md:flex-row-reverse` below
  // is what flips. A row drifts in from whichever side it lives on.
  const direction = index % 2 === 0 ? 1 : -1;

  // ── Arrival, timed to land exactly as the ball does ──────────────────────
  // Every one of these ranges ENDS at `reach`. The milestone is therefore fully
  // settled on the frame its marker lights, and the gathering happens in the
  // scroll before that — never while the row is being read.
  const arriveOpacity = useTransform(
    fill,
    [reach - lead, reach - lead * 0.45, reach],
    [0, 0.5, 1],
  );
  const y = useTransform(fill, [reach - lead, reach], [RISE_Y, 0]);
  const x = useTransform(
    fill,
    [reach - lead, reach],
    [direction * DRIFT_X, 0],
  );
  const scale = useTransform(fill, [reach - lead, reach], [0.965, 1]);

  // ── The tail ─────────────────────────────────────────────────────────────
  const recedeOpacity = useTransform(
    exit,
    [recedeFrom, recedeTo],
    [1, RECEDE_OPACITY],
  );

  // Arrival and recession are separate stories on separate tracks — one about
  // the ball, one about the screen — so the row's opacity is the product rather
  // than a single range trying to express both.
  const opacity = useTransform(
    [arriveOpacity, recedeOpacity],
    ([arrived, receded]: number[]) => arrived * receded,
  );

  // ── The marker ───────────────────────────────────────────────────────────
  // Filled the instant the ball's centre reaches it, and it stays filled: the
  // lit spine behind the ball is a trail, and a marker that un-filled as the
  // ball moved on would be a hole in it.
  const lit = useTransform(fill, [reach - contact, reach], [0, 1]);
  // The impact. Settles back to exactly 1, so the marker's resting size is
  // untouched and the pop can never leave it a different size than its
  // neighbours.
  const impact = useTransform(
    fill,
    [reach - contact, reach, reach + pop],
    [1, 1.32, 1],
  );
  // Flashes on contact, then settles to a low steady glow rather than going
  // out — the marker is behind the light now, not unlit.
  const halo = useTransform(
    fill,
    [reach - contact, reach, reach + haloSettle],
    [0, 1, 0.32],
  );

  return (
    <li className="relative pl-9 md:pl-0 pb-10 last:pb-0">
      {/* The transform lives HERE, on the content, and never on the <li> — see
          the note about welded markers in the file header. */}
      <motion.div
        style={reduced ? undefined : { opacity, y, x, scale }}
        className={`md:flex md:items-start md:gap-10 ${
          index % 2 === 0 ? "" : "md:flex-row-reverse"
        }`}
      >
        {/* Year rail. On mobile the two halves stack, so the year sits directly
            on top of a 22px headline with only its own leading between them —
            too tight to read as a label for what follows. The margin is
            mobile-only; on md+ they're side by side and it would do nothing but
            skew the row. */}
        <div
          className={`mb-1.5 md:mb-0 md:w-1/2 ${
            index % 2 === 0 ? "md:text-right" : "md:text-left"
          }`}
        >
          <span className="font-mono text-[13px] tracking-[0.12em] text-[var(--sky)]">
            {achievement.year}
          </span>
        </div>

        {/* Content */}
        <div
          className={`md:w-1/2 ${
            index % 2 === 0 ? "md:text-left" : "md:text-right"
          }`}
        >
          {achievement.awards.length > 0 ? (
            // One headline per award — the exact lines shown on the stop labels
            // in the 3D scene above, so the written record reads identically.
            // Multi-award years (2021, 2022, 2025) list every award, each with
            // the competition it was won at.
            <ul className="list-none p-0 m-0 space-y-4">
              {achievement.awards.map((award, i) => (
                <li key={i}>
                  <h3 className="font-display font-bold text-h4 text-fg m-0 leading-tight">
                    {award.place ? `${award.place} — ` : ""}
                    {award.title}
                  </h3>
                  {/* --text-secondary, matching the same line on the 3D stop
                      label. --text-muted was ~2.3:1 on the dark page — under
                      half the AA floor, and this is the only place a reader
                      learns WHERE an award was won. */}
                  <span className="font-mono text-[12px] tracking-[0.12em] uppercase text-[var(--text-secondary)] mt-1.5 inline-block">
                    {award.competition}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            // Founding year — a real headline and description, since it has no
            // awards to list.
            <>
              <h3 className="font-display font-bold text-h4 text-fg m-0 mb-2 leading-tight">
                {achievement.title}
              </h3>
              {achievement.blurb && (
                <p className="font-sans text-small text-fg-muted leading-[1.65] m-0">
                  {achievement.blurb}
                </p>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* ── Marker ────────────────────────────────────────────────────────
          A sibling of the animated content, not a child of it, so nothing the
          row does can move it off the spine.

          Four nested elements, each with exactly one job: this one holds the
          position (including the `md:-translate-x-1/2` centring transform), the
          next scales on impact, and the two inside it are the unlit and lit
          states of the same ring, crossfaded. Splitting them is what lets the
          pop own `transform` without overwriting the centring. */}
      <span
        aria-hidden="true"
        className="absolute left-0 md:left-1/2 top-1 w-[15px] h-[15px] md:-translate-x-1/2"
      >
        {/* The halo, as a real element rather than an animated `box-shadow`. A
            box-shadow string is re-parsed and repainted on every frame it
            changes; an element's opacity is a compositor property. --sky-glow
            is a genuine glow on the dark page and a flat tint on the light one,
            which is what keeps this from becoming a blue bruise in light mode
            — see theme.css. */}
        {!reduced && (
          <motion.span
            className="absolute inset-[-7px] rounded-full pointer-events-none"
            style={{
              opacity: halo,
              background:
                "radial-gradient(circle, var(--sky-glow) 0%, transparent 70%)",
            }}
          />
        )}

        <motion.span
          className="relative block w-full h-full"
          style={reduced ? undefined : { scale: impact }}
        >
          {/* Not yet reached: a hollow ring, punched through to the band behind
              it. --band-deep and not --bg-primary — the History page bands its
              background and those two are NOT the same colour in light mode,
              so the hole would show as a paler disc. */}
          <span
            className="absolute inset-0 rounded-full border-2"
            style={{
              background: "var(--band-deep)",
              borderColor: "var(--sky)",
            }}
          />

          {/* Reached: the ball's own colour, edge to edge. Sitting on top and
              crossfading in means the ring never changes size or position as it
              lights — and because the ball is the same colour, it reads as the
              ball pouring itself into the circle and moving on.

              Absent entirely under reduced motion. There is no ball on that
              page and the spine is never filled, so a marker painted in the
              travelling light's colour would be the trail of something that
              never travelled. */}
          {!reduced && (
            <motion.span
              className="absolute inset-0 rounded-full border-2"
              style={{
                opacity: lit,
                background: "var(--journey-light)",
                borderColor: "var(--journey-light)",
              }}
            />
          )}
        </motion.span>
      </span>
    </li>
  );
}
