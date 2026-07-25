/**
 * JourneyProgressRail — "how far through the history am I?", and a way to jump.
 *
 * A vertical stack of horizontal bars pinned to the right of the pinned scene,
 * in the same blue as the travelling light, so the readout and the thing it
 * reports on are visibly the same object. Hovering (or focusing, or tapping)
 * expands it into the full list of achievements; picking one flies the journey
 * there.
 *
 * ─── IT FILLS ON TWO AXES ───────────────────────────────────────────────────
 * Each bar fills horizontally, RIGHT TO LEFT, and the stack advances BOTTOM TO
 * TOP. The bottom bar sweeps leftward first; when it's full the one above it
 * starts, and so on up to the top bar, which is the last to fill. Shown here
 * roughly half way through the journey:
 *
 *        ░░░░░░░░░░   bar 5  — empty, fills last
 *        ░░░░░░░░░░   bar 4  — empty
 *        ░░░░░▓▓▓▓▓   bar 3  — in progress, sweeping left ←
 *        ▓▓▓▓▓▓▓▓▓▓   bar 2  — full
 *        ▓▓▓▓▓▓▓▓▓▓   bar 1  — full, filled first
 *
 * ─── WHY IT EXISTS ──────────────────────────────────────────────────────────
 * A pinned scroll section breaks the one progress cue every web page otherwise
 * gets for free: the scrollbar. The page is ~9.7 viewports tall, but visually
 * nothing scrolls — the scene sits still and changes. So the scrollbar says
 * "you are 40% down a long page" while the screen says "you are looking at a
 * static image", and the visitor has no way to tell whether there are two more
 * achievements or eight. This rail restores that, in the scene's own language.
 *
 * The jump list answers the complaint that follows immediately from fixing
 * that one: once you know there are ten stops, you want to reach the sixth
 * without scrubbing through five. There is no other way to do it — the journey
 * has no controls, and the scrollbar can't be aimed at a milestone.
 *
 * ─── TRAVEL IS A SIDE EFFECT OF SCROLLING ───────────────────────────────────
 * Picking an achievement does not animate the scene. It scrolls the PAGE to
 * that achievement's position (`scrollToProgress`), and everything else
 * follows for free: the scene reads scroll, the light eases toward it, the
 * camera springs and banks after the light. Forward and backward travel are
 * the same code path, and there is no bespoke fly-to animation to keep in sync
 * with the scroll machinery. See useScrollProgress for why moving the scroll —
 * rather than writing `progressRef` directly — is the only correct approach.
 *
 * ─── IT COUNTS ACHIEVEMENTS, NOT PIXELS ─────────────────────────────────────
 * The obvious build divides scroll position evenly into five. That would be
 * wrong at both ends, because the path has a lead-in before the first stop and
 * a lead-out after the last (LAYOUT.leadLength): scrolling into the run-out
 * would keep filling the final bar for a while after the last achievement had
 * gone by, and the rail would only top out on empty track.
 *
 * So the bar boundaries are the STOPS themselves. `stopUs[i]` is the exact
 * curve parameter where achievement `i` sits, and bar `k` is full the moment
 * the light reaches the last achievement in its group. The final bar therefore
 * completes exactly as the last achievement is passed, which is the promise
 * the rail is implicitly making. Those same numbers are what the jump list
 * scrolls to, so the readout and the destinations can't disagree.
 *
 * ─── THE GLASS IS DELIBERATELY ITS OWN ──────────────────────────────────────
 * The recipe below is the navbar's and the theme toggle's — translucent fill,
 * 20px backdrop blur, hairline border, one soft drop shadow — but written out
 * here with its own literal values instead of reaching for the shared
 * `--bg-glass` / `--border-subtle` / `--elevation-2` tokens those two use.
 *
 * That's on purpose. This rail sits on a near-empty 3D floor, not over dense
 * page content, and glass only reads as glass when there's something behind it
 * to refract — so it needs a lower fill opacity and a stronger edge than the
 * navbar does to land the same impression. Sharing the tokens would mean any
 * future tuning here silently restyles the site's chrome, and any tuning of the
 * chrome silently changes this. Same look, independent dials.
 *
 * ─── IT NEVER RE-RENDERS WHILE YOU SCROLL ───────────────────────────────────
 * Same rule as the rest of this page (see useScrollProgress): progress is a
 * ref plus a subscription, and both the bar fills AND the list's "you are
 * here" highlight are written straight to the DOM. React state here covers
 * exactly one thing — whether the panel is open — which changes on hover, not
 * on scroll. `scaleX` on a `transform-origin: right` element is composited:
 * no layout, no paint, no main-thread work per frame.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PROGRESS_SEGMENTS } from "./sceneConfig";
import { useTheme } from "@/context/ThemeContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Achievement } from "@/data/achievements";

/* ═══════════════════════════════════════════════════════════════════════════
 *  ▼  TUNING DIALS — everything you'd want to adjust by eye lives here.  ▼
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Rail geometry, in px. Every value below is applied as an inline style, so
 * these are the ONLY place any of it is set — there are no competing Tailwind
 * size classes to hunt down.
 */
const RAIL = {
  /**
   * ◀── WIDTH DIAL. How long each bar is; the rail's overall width is this
   * plus 2 × padX. Lower = thinner. 34 was the first pass and read chunky;
   * 26 is the current setting. Below about 18 the fill stops being legible
   * as a proportion and starts looking like a dot.
   *
   * NB the rail is now a button, so its total width doubles as a touch
   * target: barWidth 26 + 2×padX 9 = 44, exactly the 44px minimum. Going
   * thinner means widening padX to compensate, or the tap target shrinks
   * below it.
   */
  barWidth: 25,
  /** Bar thickness. Keep it well under barWidth or they stop reading as bars. */
  barHeight: 8,
  /** Vertical gap between bars. */
  barGap: 8,
  /** Glass padding around the stack. */
  padX: 9,
  padY: 11,
} as const;

/** Jump-list geometry, in px. */
const PANEL = {
  /** Width of the expanded achievement list. */
  width: 232,
  /**
   * Minimum height of a row. 44 is not a style choice — it's the touch-target
   * floor, and these are the primary controls of the whole feature.
   */
  rowHeight: 44,
  /** Gap between the list and the rail it expands from. */
  offset: 10,
} as const;

/**
 * The rail's own glass, per theme. See the header for why these are literals
 * rather than the shared chrome tokens.
 *
 * ◀── TRANSPARENCY DIAL: `fill` on each theme. 0 is invisible, 1 is fully
 * opaque. It sets the TOP of the gradient and the bottom is derived from it
 * (see `glassSurface`), so this single number moves the whole surface and the
 * two stops can never drift out of relationship with each other.
 *
 * Higher = more solid and more legible over a busy scene; lower = more glass,
 * but past a point the panel stops separating from the floor behind it. The
 * light theme sits higher than the dark one because a pale tint over a pale
 * floor has far less to work with.
 *
 * The `inset 0 1px 0` in each shadow is the highlight along the top edge — the
 * single cue that most sells a surface as glass rather than as flat
 * translucency, because it reads as light catching a physical lip.
 */
const GLASS = {
  dark: {
    /** ◀── transparency */
    fill: 0.08,
    /** RGB channels of the glass tint, as a bare `r, g, b` triplet. */
    tint: "38, 43, 110",
    border: "rgba(148,158,240,0.24)",
    shadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)",
    /** Unfilled bars are recessed into the glass, not sitting on top of it. */
    trackInset: "inset 0 1px 2px rgba(0,0,0,0.38)",
  },
  light: {
    /** ◀── transparency */
    fill: 0.1,
    tint: "255, 255, 255",
    border: "rgba(255,255,255,0.80)",
    shadow:
      "0 10px 30px rgba(60,64,181,0.16), inset 0 1px 0 rgba(255,255,255,0.90)",
    trackInset: "inset 0 1px 2px rgba(60,64,181,0.16)",
  },
} as const;

/**
 * `saturate` alongside the blur is what separates "frosted" from "foggy": a
 * plain blur averages the colours behind it toward grey, and pushing
 * saturation back up restores the tint real glass carries through.
 */
const BACKDROP = "blur(20px) saturate(180%)";

/**
 * The glass fill: a vertical gradient that thins toward the bottom, which is
 * what stops a flat translucent panel reading as a sheet of plastic. The lower
 * stop is derived at 70% of the upper one, so `fill` alone drives the surface.
 */
function glassSurface({ tint, fill }: { tint: string; fill: number }): string {
  const bottom = (fill * 0.7).toFixed(3);
  return `linear-gradient(180deg, rgba(${tint}, ${fill}), rgba(${tint}, ${bottom}))`;
}

interface JourneyProgressRailProps {
  /** Live journey progress 0 → 1. Read imperatively; never triggers a render. */
  progressRef: React.MutableRefObject<number>;
  /** Scroll-change subscription from useScrollProgress. */
  subscribe: (listener: () => void) => () => void;
  /**
   * Curve parameter of each achievement stop, published by the scene once it
   * has built the curve. Null until then — see `boundaries` for the stand-in.
   */
  stopUs: number[] | null;
  /** The achievements themselves, for the jump list. */
  achievements: Achievement[];
  /** Scrolls the page so the journey lands on a given progress value. */
  scrollToProgress: (progress: number, smooth?: boolean) => void;
}

export default function JourneyProgressRail({
  progressRef,
  subscribe,
  stopUs,
  achievements,
  scrollToProgress,
}: JourneyProgressRailProps) {
  const { isDark } = useTheme();
  const reduced = useReducedMotion();
  const glass = isDark ? GLASS.dark : GLASS.light;

  const [open, setOpen] = useState(false);
  const fillsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rowsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  /** Mirrors `open` for `draw`, which must not be rebuilt when it changes. */
  const openRef = useRef(false);
  /** Last highlighted row, so `draw` only touches the DOM on a real change. */
  const activeRef = useRef(-1);

  const achievementCount = achievements.length;

  /**
   * Progress values at which each bar starts and finishes, so
   * `boundaries[k] → boundaries[k + 1]` is bar k's span.
   *
   * Bar k covers the achievements in `[k·n/S, (k+1)·n/S)` and completes on the
   * LAST of them, so with 10 achievements and 5 bars the boundaries land on
   * stops 2, 4, 6, 8 and 10 — one bar per pair, as intended.
   *
   * The scene is lazy-loaded, so `stopUs` is briefly null on first paint. Even
   * spacing stands in for that window. It is only ever visible at a progress
   * of ~0 (the scene mounts as the section comes into view), so the difference
   * is unobservable — but it does mean the rail is never blank or wrong-shaped
   * while the 3D chunk downloads.
   */
  const boundaries = useMemo(() => {
    const evenly = (k: number) => k / PROGRESS_SEGMENTS;
    const result = [0];

    for (let k = 1; k <= PROGRESS_SEGMENTS; k++) {
      const lastStopInGroup =
        Math.floor((k * achievementCount) / PROGRESS_SEGMENTS) - 1;
      const stopU = stopUs?.[lastStopInGroup];
      // Guard the boundaries into a strictly increasing sequence. Fewer
      // achievements than bars would otherwise repeat an index and produce a
      // zero-width span, and a zero-width span is a divide-by-zero away from
      // NaN reaching a style property.
      const previous = result[k - 1];
      const candidate = stopU ?? evenly(k);
      result.push(candidate > previous ? candidate : evenly(k));
    }

    return result;
  }, [stopUs, achievementCount]);

  /**
   * The list, newest FIRST.
   *
   * The panel reads bottom-up like the rail and the journey — 2013 at the
   * bottom, the latest year at the top — and the naive way to get that is
   * `flex-col-reverse` over the natural array. That would put DOM order and
   * visual order in opposite directions, so a keyboard user tabbing "down" the
   * list would travel UP the screen. Reversing the data instead means DOM
   * order, visual order and tab order all agree, and each entry still carries
   * its true index for `stopUs` and the counter.
   */
  const rows = useMemo(
    () =>
      achievements
        .map((achievement, index) => ({ achievement, index }))
        .reverse(),
    [achievements],
  );

  const draw = useCallback(() => {
    // This is the scroll TARGET, whereas the light eases toward it (see
    // SceneController) — so during a fast flick the rail is a fraction ahead of
    // the ball rather than locked to it. That's the right choice for a scroll
    // readout: it answers the input immediately, and the two agree exactly the
    // moment scrolling stops, which is when anyone actually looks at it.
    const u = progressRef.current;

    for (let k = 0; k < PROGRESS_SEGMENTS; k++) {
      const start = boundaries[k];
      const span = boundaries[k + 1] - start;
      const fill = span > 0 ? Math.min(Math.max((u - start) / span, 0), 1) : 0;

      const node = fillsRef.current[k];
      if (node) node.style.transform = `scaleX(${fill})`;
    }

    // "You are here" in the jump list. Skipped entirely while the panel is
    // shut, which is almost always — there's nothing to highlight, and this
    // runs on every scroll frame.
    // The length check matters now that the search below seeds itself from
    // `stopUs[0]`: on an empty array that seed is undefined, and every
    // comparison against NaN is false, so it would silently settle on index 0.
    if (!openRef.current || !stopUs || stopUs.length === 0) return;

    /*
     * The NEAREST stop — the achievement you are looking at.
     *
     * ─── WHY "MOST RECENTLY PASSED" WAS WRONG ───────────────────────────────
     * This used to pick the last stop with `u >= stopUs[i]`, which sounds
     * equivalent and isn't. A stop fades in over STOP.activationRange and is
     * centred, readable and plainly the subject of the screen well BEFORE the
     * light physically reaches its curve position. Park where 2018 fills the
     * view and `u` is usually still a hair short of `stopUs[3]`, so the test
     * fell through to 2017 and bolded the wrong year.
     *
     * It looked intermittent — right for some years, wrong for others —
     * because the stops are not evenly spaced in `u`. The curve is
     * reparametrised by arc length and swings laterally between stops, so the
     * distance from "this label is centred" to "the light is on the anchor"
     * differs at every stop. Whether you landed before or after the boundary
     * was effectively down to which year you stopped at.
     *
     * Nearest has neither problem: it is symmetric, so it flips at the
     * midpoint between two stops regardless of how far apart they are, and it
     * always names something — where the old test returned -1 (nothing bolded
     * at all) anywhere before the first stop.
     */
    let active = 0;
    let closest = Math.abs(u - stopUs[0]);
    for (let i = 1; i < stopUs.length; i++) {
      const distance = Math.abs(u - stopUs[i]);
      // `<` not `<=`: on an exact tie keep the earlier stop, so the highlight
      // advances only once you're genuinely nearer the next one.
      if (distance < closest) {
        closest = distance;
        active = i;
      }
    }
    if (active === activeRef.current) return;

    const previous = rowsRef.current[activeRef.current];
    if (previous) {
      previous.removeAttribute("data-active");
      previous.removeAttribute("aria-current");
    }
    const next = rowsRef.current[active];
    if (next) {
      next.setAttribute("data-active", "true");
      // `data-active` drives the visuals; `aria-current` is what tells a
      // screen-reader user which entry they're currently standing on. It's a
      // plain attribute, not a live region, so updating it never interrupts.
      next.setAttribute("aria-current", "true");
    }
    activeRef.current = active;
  }, [boundaries, progressRef, stopUs]);

  // Draw once on mount and whenever the boundaries change (i.e. when the scene
  // publishes the real stop positions), then follow the scroll. Returning the
  // unsubscribe directly is the cleanup.
  useEffect(() => {
    draw();
    return subscribe(draw);
  }, [draw, subscribe]);

  // Opening needs an immediate highlight pass: `draw` skips the list while
  // shut, so without this the "you are here" row would stay blank until the
  // next scroll event — which, for someone who stopped scrolling in order to
  // hover, may never come.
  //
  // It also has to wipe every row first. `draw` clears the PREVIOUS row by
  // index, and while the panel was shut that index went stale — the journey
  // kept moving with the highlight frozen on whatever row was marked when it
  // closed. Resetting the index alone would leave that row lit and light a
  // second one, so the panel would reopen claiming to be in two places at
  // once. Clearing outright is the only state that's always correct, and it
  // runs on open, not on scroll.
  useEffect(() => {
    openRef.current = open;
    if (!open) return;

    for (const row of rowsRef.current) {
      row?.removeAttribute("data-active");
      row?.removeAttribute("aria-current");
    }
    activeRef.current = -1;
    draw();
  }, [open, draw]);

  const jumpTo = (index: number) => {
    // Fall back to even spacing on the vanishing chance someone clicks before
    // the scene has published its curve; better an approximate jump than none.
    const target = stopUs?.[index] ?? (index + 0.5) / achievementCount;
    scrollToProgress(target, !reduced);
    setOpen(false);
    // Hand focus back to the trigger. Closing the panel makes the row that was
    // just activated `visibility: hidden`, and a focused element disappearing
    // drops focus to <body> — which would dump a keyboard user back at the top
    // of the tab order, several hundred stops away from where they were.
    triggerRef.current?.focus();
  };

  return (
    /*
     * The wrapper is sized by the RAIL ALONE — the panel below is absolutely
     * positioned and therefore out of flow. That matters for two reasons:
     * a `visibility: hidden` panel still occupies layout space, so an in-flow
     * one would have left a ~232px invisible box sitting over the 3D scene,
     * swallowing clicks meant for the canvas and arming the hover zone far
     * outside anything the visitor can see.
     *
     * Hover lives on the wrapper rather than the button so that moving the
     * pointer onto the open panel doesn't close it: `mouseleave` only fires
     * once the pointer leaves the element AND all its descendants, and the
     * panel is a descendant.
     */
    <div
      className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      // Escape is the expected way out of any disclosure, and without it a
      // keyboard user who has opened the panel can only leave by tabbing
      // through all ten rows.
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
      // Note there is deliberately no "open on focus". It reads like a
      // convenience, but it makes returning focus to the trigger after a jump
      // instantly reopen the panel you just dismissed. The plain disclosure
      // contract — Enter or Space on the trigger — has no such conflict, and
      // is what a keyboard user expects from `aria-expanded` anyway.
      //
      // The capture-phase blur still closes the group once focus leaves it.
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >


      {/* ── The rail ────────────────────────────────────────────────────────
          A disclosure button, not decoration: it names the panel it controls
          so screen readers get the relationship, and it's the tap target that
          opens the list on touch, where there is no hover to rely on. The bars
          inside stay aria-hidden — they're a picture of the scroll position,
          which the button's own label already describes in words.

          It comes BEFORE the panel in the DOM even though it sits to the right
          of it on screen. The panel is absolutely positioned, so source order
          costs nothing visually — and it buys the tab order a keyboard user
          needs: trigger first, then the rows it reveals. The other way round,
          Tab from the trigger would leap straight past the list it had just
          opened. */}
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="journey-jump-list"
        aria-label={
          open
            ? "Hide the list of achievements"
            : "Journey progress. Show the list of achievements to jump to one."
        }
        onClick={() => setOpen((current) => !current)}
        className="flex flex-col-reverse rounded-full cursor-pointer shrink-0"
        style={{
          gap: RAIL.barGap,
          padding: `${RAIL.padY}px ${RAIL.padX}px`,
          background: glassSurface(glass),
          border: `1px solid ${glass.border}`,
          boxShadow: glass.shadow,
          backdropFilter: BACKDROP,
          WebkitBackdropFilter: BACKDROP,
        }}
      >
        {/* `flex-col-reverse`: bar 0 is the LAST child laid out, so it sits at
            the bottom and the stack advances upward, without reversing the
            array (which would put the indices out of step with the
            achievements they stand for). Safe here in a way it wasn't for the
            list above, because these bars aren't focusable. */}
        {Array.from({ length: PROGRESS_SEGMENTS }, (_, k) => (
          <div
            key={k}
            aria-hidden="true"
            className="relative rounded-full overflow-hidden"
            style={{
              width: RAIL.barWidth,
              height: RAIL.barHeight,
              background: "var(--journey-track)",
              boxShadow: glass.trackInset,
            }}
          >
            {/* The fill. Square-cornered on purpose: scaling a rounded box
                squashes its radius into an ellipse, so the pill shape comes
                from the track clipping it instead, and stays a true pill at
                every fill level — including the small rounded nub at the right
                end when a bar has only just started. */}
            <div
              ref={(node) => {
                fillsRef.current[k] = node;
              }}
              className="absolute inset-0 origin-right"
              style={{
                background: "var(--journey-light)",
                boxShadow: "var(--journey-glow)",
                transform: "scaleX(0)",
                // Ease-out quart, in the 150-300ms micro-interaction band.
                // Because scroll retargets this every frame, the curve acts as
                // a smoothing filter rather than a one-shot animation: each
                // update moves fast then decelerates, so a flick reads as
                // liquid catching up and the level settles instead of
                // arriving. Linear would track just as closely but stop dead
                // at the end of every scroll, which is the robotic tell.
                transition: "transform 160ms cubic-bezier(0.25, 1, 0.5, 1)",
              }}
            />
          </div>
        ))}
      </button>

      {/* ── The jump list ───────────────────────────────────────────────────
          Hidden with `visibility` rather than unmounted: it keeps the
          open/close transition animatable in both directions, and
          `visibility: hidden` (unlike opacity 0) genuinely removes the rows
          from the tab order and from hit-testing, so a shut panel can't be
          tabbed into or clicked through. The delayed visibility transition is
          what lets the fade-out finish before it disappears.

          The gap to the rail is PADDING on this positioning layer, not a
          margin: that keeps the element's box touching the rail, so the
          pointer never crosses dead space on its way to the list. A 10px gap
          the mouse can fall through is the classic way a hover menu closes
          itself just as you reach for it.

          Animated on opacity + transform only — never width or height, which
          would relayout the panel on every frame of the open. `top`/`transform`
          are set inline rather than with Tailwind's `-translate-y-1/2` because
          the open/close transform has to compose with the centring, and two
          sources writing `transform` would simply overwrite each other. */}
      <div
        className="absolute right-full"
        style={{
          top: "50%",
          paddingRight: PANEL.offset,
          transformOrigin: "right center",
          transform: open
            ? "translateY(-50%) translateX(0) scale(1)"
            : "translateY(-50%) translateX(10px) scale(0.97)",
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
          transition: reduced
            ? "none"
            : [
                "opacity 200ms cubic-bezier(0.25, 1, 0.5, 1)",
                "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
                `visibility 0s linear ${open ? "0s" : "200ms"}`,
              ].join(", "),
        }}
      >
        <div
          id="journey-jump-list"
          className="rounded-[18px] overflow-y-auto"
          style={{
            width: PANEL.width,
            // Never wider than the room actually available to the left of the
            // rail. Without this the list runs off a 320px screen.
            maxWidth: "calc(100vw - 92px)",
            maxHeight: "70vh",
            padding: 6,
            background: glassSurface(glass),
            border: `1px solid ${glass.border}`,
            boxShadow: glass.shadow,
            backdropFilter: BACKDROP,
            WebkitBackdropFilter: BACKDROP,
          }}
        >
          {rows.map(({ achievement, index }) => (
            <button
              key={achievement.id}
              ref={(node) => {
                rowsRef.current[index] = node;
              }}
              type="button"
              onClick={() => jumpTo(index)}
              className="ae-jump-row w-full flex items-baseline gap-2.5 px-2.5 py-2 rounded-[12px] text-left cursor-pointer bg-transparent border-0"
              style={{ minHeight: PANEL.rowHeight }}
            >
              <span className="ae-jump-year font-mono text-[12px] tracking-[0.1em] text-[var(--sky)] shrink-0">
                {achievement.year}
              </span>
              <span className="font-sans text-[13px] leading-[1.35] text-fg">
                {achievement.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
