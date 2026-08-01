import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/TeamStructure.css";

/* Slugify matches src/data/team.ts: section anchor ids on /team are
 * slugify(sectionName). Keep this in step with that file if a section is
 * renamed. */
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/*
 * The chart's fixed canvas. Every node below is placed by absolute coordinates
 * inside it, and the whole thing is scaled to whatever width the column gives
 * us — so the composition never reflows, it only gets smaller.
 */
const CANVAS_W = 1060;
const CANVAS_H = 760;

/*
 * Below this scale the 11-13px labels stop being readable, so the component
 * switches to the stacked layout instead of shrinking further. 0.62 puts the
 * smallest label at ~7px, which is about as far as it can sensibly go.
 */
const RADIAL_MIN_SCALE = 0.62;

/** The command disc at the centre. */
const LEADER = {
  id: "leader",
  title: "Team Leader",
  // Matches the leadership card's id on /team (slugify of the role).
  to: "/team#team-leader",
  desc: "Sets the season plan, owns the competition roadmap and makes the final call when subsystems disagree.",
};

/** The deputy, directly above the disc. */
const VICE = {
  id: "vice",
  title: "Team Vice Lead",
  /* #vice-team-lead, not #vice-lead: team.ts distinguishes the team-wide
   * deputy ("Vice Team Lead") from the fifteen sub-team ones, and the card id
   * is slugify(role). See the Role union there. */
  to: "/team#vice-team-lead",
  desc: "Runs the week: schedules, design reviews, logistics and travel, and stands in for the leader whenever needed.",
};

/*
 * The two divisions, out on the ring, each with its three sub-teams fanned
 * beyond it. `x`/`y` are canvas coordinates; `wire` is where the connecting
 * line leaves the lead card.
 */
const BRANCHES = [
  {
    id: "mechanical",
    lead: "Mechanical Lead",
    x: 280,
    y: 420,
    // team.ts's Mechanical division is num "01".
    to: "/team#division-01",
    desc: "Keeps aerodesign, structures and propulsion working to the same set of numbers, so the airframe comes together as one aircraft.",
    children: [
      {
        name: "Aerodesign",
        x: 170,
        y: 168,
        desc: "We shape how the aircraft flies: the aerodynamics of the whole airframe. We set the wing and tail geometry, run the analysis, and tune for lift, drag, and stable, efficient performance.",
      },
      {
        name: "Structure",
        x: 90,
        y: 420,
        desc: "We design and build the airframe that holds everything together: sizing the load-bearing structure, choosing materials, and manufacturing the parts so the aircraft stays light and survives every flight.",
      },
      {
        name: "Propulsion",
        x: 170,
        y: 672,
        desc: "We power the aircraft: selecting motors and propellers, sizing the powertrain, and matching thrust to the mission so it takes off, climbs, and cruises reliably.",
      },
    ],
  },
  {
    id: "autonomous",
    lead: "Autonomous Lead",
    x: 780,
    y: 420,
    // team.ts's Autonomous division is num "02".
    to: "/team#division-02",
    desc: "Manages the integration between the autonomous subsystems, so software, hardware and AI arrive as one working stack rather than three separate ones.",
    children: [
      {
        name: "Software",
        x: 890,
        y: 168,
        desc: "We write the software that flies the aircraft on its own: the control and navigation stack, mission logic, and the ground station that plans and monitors every autonomous flight.",
      },
      {
        name: "Hardware",
        x: 970,
        y: 420,
        desc: "We build the electronics that make the aircraft think: the avionics, sensors, power systems, and wiring that connect the flight computer to everything on board.",
      },
      {
        name: "AI",
        x: 890,
        y: 672,
        desc: "We give the aircraft its eyes: detecting and tracking targets from the onboard camera, and turning raw images into the information the autonomy stack acts on.",
      },
    ],
  },
];

/** Every node, flattened — used to resolve the readout and the lit wires. */
const ALL_NODES = [
  LEADER,
  VICE,
  ...BRANCHES.flatMap((b) => [
    b,
    ...b.children.map((c) => ({
      id: `${b.id}-${c.name}`,
      title: c.name,
      desc: c.desc,
      to: `/team#${slugify(c.name)}`,
    })),
  ]),
];

export default function TeamStructure() {
  /** Which node is hovered, focused or tapped. `null` = chart at rest. */
  const [activeId, setActiveId] = useState(null);
  const navigate = useNavigate();

  /* True on mice/trackpads, false on touch — computed once, since it tracks
   * the device, not anything that changes mid-session. */
  const [prefersHover] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover)").matches,
  );

  /*
   * How much the canvas has to shrink to fit its column, measured rather than
   * derived from the viewport: the chart sits in a grid track whose width
   * depends on the section padding and the breakpoint, and guessing that from
   * window.innerWidth was how the concept ended up mis-sized between the two.
   */
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setScale(Math.min(1, w / CANVAS_W));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const mode = scale < RADIAL_MIN_SCALE ? "stack" : "radial";

  /*
   * On a hover-capable device the description is already showing (hover got
   * there first), so a click or Enter navigates straight away.
   *
   * On touch there is no hover, so a tap only reveals the description — it
   * never navigates. Getting to the team page is then an explicit link on the
   * role's name in the readout below the chart. This replaces an earlier
   * tap-once-to-reveal, tap-again-to-navigate scheme: the second tap was
   * invisible state, indistinguishable from the first, so the same gesture did
   * two different things depending on history. A named link says where it goes.
   */
  const handleActivate = useCallback(
    (id, to) => {
      setActiveId(id);
      if (prefersHover) navigate(to);
    },
    [prefersHover, navigate],
  );

  /* Props shared by every interactive node. */
  const nodeProps = useCallback(
    (id, to) => ({
      className: `tp-node${activeId === id ? " is-active" : ""}`,
      "data-target": to ? "true" : undefined,
      tabIndex: 0,
      onMouseEnter: () => setActiveId(id),
      onFocus: () => setActiveId(id),
      ...(to
        ? {
            role: "link",
            onClick: () => handleActivate(id, to),
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleActivate(id, to);
              }
            },
          }
        : {}),
    }),
    [activeId, handleActivate],
  );

  const clearActive = () => setActiveId(null);

  const active = ALL_NODES.find((n) => n.id === activeId) ?? null;

  /* A wire lights when the node it feeds is the active one. */
  const lit = (id) => String(activeId === id);

  /* ── node renderers, shared by both layouts ─────────────────────────────── */

  const discNode = (style) => (
    <div {...nodeProps(LEADER.id, LEADER.to)} style={style}>
      <div className="tp-disc-ring">
        <div className="tp-disc">
          <span className="tp-disc-title">
            Team
            <br />
            Leader
          </span>
        </div>
      </div>
      <span className="tp-sr">{LEADER.desc}</span>
    </div>
  );

  const viceNode = (style) => (
    <div {...nodeProps(VICE.id, VICE.to)} style={style}>
      <div className="tp-pill">{VICE.title}</div>
      <span className="tp-sr">{VICE.desc}</span>
    </div>
  );

  const leadNode = (branch, style) => (
    <div {...nodeProps(branch.id, branch.to)} style={style}>
      <div className="tp-node-shell">
        <div className="tp-card">
          <div className="tp-card-title">{branch.lead}</div>
        </div>
      </div>
      <span className="tp-sr">{branch.desc}</span>
    </div>
  );

  const chipNode = (branch, child, style) => {
    const id = `${branch.id}-${child.name}`;
    return (
      <div
        key={child.name}
        {...nodeProps(id, `/team#${slugify(child.name)}`)}
        style={style}
      >
        <div className="tp-chip">
          <span className="tp-chip-dot" aria-hidden="true" />
          {child.name}
        </div>
        <span className="tp-sr">{child.desc}</span>
      </div>
    );
  };

  const at = (x, y) => ({ left: `${x}px`, top: `${y}px` });
  const delay = (s) => ({ animationDelay: `${s}s` });

  return (
    <section className="tp-section">
      <div className="tp-seam-bridge" aria-hidden="true" />

      <div className="tp-layout">
        <div className="tp-intro">
          <div className="tp-eyebrow">
            <span className="tp-eyebrow-index">02</span>
            <span className="tp-eyebrow-line" />
            <span className="tp-eyebrow-label">Team Overview</span>
          </div>

          <h2 className="tp-headline">
            <span className="tp-headline-line">Built by</span>
            <span className="tp-headline-line tp-headline-accent">
              Subsystems
            </span>
          </h2>

          <p className="tp-copy">
            Every part of the aircraft belongs to someone. Subsystems work in
            parallel and the leads keep them in sync.
          </p>

          <p className="tp-hint tp-hint--desktop">
            Hover a role to see what it does
          </p>
          <p className="tp-hint tp-hint--mobile">
            Tap a role to see what it does
          </p>

          <Link to="/team" className="tp-cta">
            Meet the team
          </Link>
        </div>

        <div
          className="tp-stage"
          data-mode={mode}
          ref={stageRef}
          onMouseLeave={clearActive}
          onBlur={clearActive}
        >
          {mode === "radial" ? (
            <div
              className="tp-canvas-clip"
              style={{ height: `${Math.round(CANVAS_H * scale)}px` }}
            >
              <div
                className="tp-canvas"
                style={{ transform: `scale(${scale.toFixed(3)})` }}
              >
                <svg
                  className="tp-wires"
                  viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                  aria-hidden="true"
                >
                  <circle
                    className="tp-ring-breathe"
                    cx="530"
                    cy="420"
                    r="250"
                    fill="none"
                    stroke="var(--tp-ring)"
                    strokeWidth="1"
                  />
                  <circle
                    cx="530"
                    cy="420"
                    r="360"
                    fill="none"
                    stroke="var(--tp-ring-faint)"
                    strokeWidth="1"
                    strokeDasharray="2 9"
                  />
                  {/* The two arcs that sweep from the disc out to each lead. */}
                  <path
                    className="tp-arc"
                    d="M530 170 A250 250 0 0 0 280 420"
                    fill="none"
                    stroke="var(--tp-arc)"
                    strokeWidth="1.4"
                    strokeDasharray="12 628"
                  />
                  <path
                    className="tp-arc tp-arc--b"
                    d="M530 170 A250 250 0 0 1 780 420"
                    fill="none"
                    stroke="var(--tp-arc)"
                    strokeWidth="1.4"
                    strokeDasharray="12 628"
                  />

                  <line
                    className="tp-wire"
                    data-lit={lit(VICE.id)}
                    x1="530"
                    y1="330"
                    x2="530"
                    y2="182"
                    stroke="var(--tp-hairline)"
                    strokeWidth="1"
                  />

                  {BRANCHES.flatMap((b) =>
                    b.children.map((c) => (
                      <line
                        key={`${b.id}-${c.name}`}
                        className="tp-wire"
                        data-lit={lit(`${b.id}-${c.name}`)}
                        x1={b.x}
                        y1={b.y}
                        x2={c.x}
                        y2={c.y}
                        stroke="var(--tp-hairline)"
                        strokeWidth="1"
                      />
                    )),
                  )}
                </svg>

                {discNode(at(530, 420))}
                {viceNode({ ...at(530, 170), ...delay(0.1) })}

                {BRANCHES.map((b, bi) => (
                  <Fragment key={b.id}>
                    {leadNode(b, { ...at(b.x, b.y), ...delay(0.18 + bi * 0.06) })}
                    {b.children.map((c, ci) =>
                      chipNode(b, c, {
                        ...at(c.x, c.y),
                        ...delay(0.3 + ci * 0.06),
                      }),
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          ) : (
            /*
             * Phones. The same nodes, read top to bottom — the radial would be
             * scaled past the point its labels survive (see RADIAL_MIN_SCALE).
             */
            <div className="tp-stack">
              {discNode()}
              <span className="tp-stem" aria-hidden="true" />
              {viceNode()}

              {BRANCHES.map((b) => (
                <div className="tp-branch" key={b.id}>
                  {leadNode(b)}
                  <div className="tp-branch-chips">
                    {b.children.map((c) => chipNode(b, c))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/*
           * One shared readout rather than a popover per node: on the radial the
           * nodes sit at the canvas edges, where an attached tooltip would
           * either overflow the section or cover its neighbours.
           *
           * The role's name here is a real link, and on touch it's the only way
           * into the team page — so this can't be aria-hidden, and it isn't
           * aria-live either: every node already carries its own description
           * for screen readers, and announcing on hover would just be noise.
           */}
          <div className="tp-readout" data-empty={String(!active)}>
            <p className="tp-readout-title">
              {active ? (
                <Link className="tp-readout-link" to={active.to}>
                  {active.title ?? active.lead}
                  <span className="tp-readout-arrow" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              ) : (
                "Select a role"
              )}
            </p>
            <p className="tp-readout-text">
              {active
                ? active.desc
                : "Every subsystem owns a piece of the aircraft. Pick one to see what it covers."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
