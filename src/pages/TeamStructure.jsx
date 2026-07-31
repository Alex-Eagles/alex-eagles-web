import { Fragment, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wrench, Cpu } from "lucide-react";
import "../styles/TeamStructure.css";

/* Slugify matches src/data/team.ts: section anchor ids on /team are
 * slugify(sectionName), and the leadership block is #leadership. Keep this in
 * step with that file if a section is renamed. */
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/**
 * The two roles above the split. `lit` picks up the existing traveling-light
 * animation class (tp-box--lit-0 / -1), which is timed to the connector legs.
 */
const TOP_ROLES = [
  {
    id: "leader",
    title: "Team Leader",
    lit: 0,
    // Matches the leadership card's id in Team.tsx (slugify(leader.role) for
    // the "Team Leader" role) — lands on that specific card, not just the
    // top of the leadership section.
    to: "/team#team-leader",
    desc: "Sets the season plan, owns the competition roadmap and makes the final call when subsystems disagree.",
  },
  {
    id: "vice",
    title: "Team Vice Lead",
    lit: 1,
    // Matches the "Vice Lead" role's card id — was previously the same
    // #leadership anchor as Team Leader, which always landed on the leader's
    // card since it comes first in the section.
    to: "/team#vice-lead",
    desc: "Runs the week: schedules, design reviews, logistics and travel, and stands in for the leader whenever needed.",
  },
];

/* Accents are the site's own brand colors, fixed (not swapped per theme)
 * because the cards are solid fills with white text on top: dark mode's
 * --sky (#60a5fa) is deliberately light for text-on-dark use and fails
 * contrast as a background under white labels. #3c40b5/#1d4ed8 are the
 * site's own indigo/sky, already used with white text elsewhere (the CTA
 * button; theme.css's own contrast notes measure #1d4ed8 at 6.0:1). */
const LEADS = [
  {
    id: "mechanical",
    lead: "Mechanical Lead",
    icon: Wrench,
    color: "#3c40b5",
    // Matches Team.tsx's division heading id (`division-${division.num}`) —
    // team.ts's Mechanical division is num "01".
    to: "/team#division-01",
    desc: "Keeps aerodesign, structures and propulsion working to the same set of numbers, so the airframe comes together as one aircraft.",
    children: [
      {
        name: "Aerodesign",
        desc: "We shape how the aircraft flies: the aerodynamics of the whole airframe. We set the wing and tail geometry, run the analysis, and tune for lift, drag, and stable, efficient performance.",
      },
      {
        name: "Structure",
        desc: "We design and build the airframe that holds everything together: sizing the load-bearing structure, choosing materials, and manufacturing the parts so the aircraft stays light and survives every flight.",
      },
      {
        name: "Propulsion",
        desc: "We power the aircraft: selecting motors and propellers, sizing the powertrain, and matching thrust to the mission so it takes off, climbs, and cruises reliably.",
      },
    ],
  },
  {
    id: "autonomous",
    lead: "Autonomous Lead",
    icon: Cpu,
    color: "#1d4ed8",
    // team.ts's Autonomous division is num "02".
    to: "/team#division-02",
    desc: "Manages the integration between the autonomous subsystems, so software, hardware and AI arrive as one working stack rather than three separate ones.",
    children: [
      {
        name: "Software",
        desc: "We write the software that flies the aircraft on its own: the control and navigation stack, mission logic, and the ground station that plans and monitors every autonomous flight.",
      },
      {
        name: "Hardware",
        desc: "We build the electronics that make the aircraft think: the avionics, sensors, power systems, and wiring that connect the flight computer to everything on board.",
      },
      {
        name: "AI",
        desc: "We give the aircraft its eyes: detecting and tracking targets from the onboard camera, and turning raw images into the information the autonomy stack acts on.",
      },
    ],
  },
];

export default function TeamStructure() {
  /** Which role is being hovered or focused. `null` = nothing, chart at rest. */
  const [activeId, setActiveId] = useState(null);
  /* Second-tap arming for touch devices — see handleActivate. Unused on
   * hover-capable devices, where a single click still navigates. */
  const [tappedId, setTappedId] = useState(null);
  const navigate = useNavigate();

  /* True on mice/trackpads, false on touch — computed once, since it tracks
   * the device, not anything that changes mid-session. */
  const [prefersHover] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches,
  );

  /* On a hover-capable device the role's info is already showing (hover got
   * there first), so a click/Enter navigates immediately — unchanged from
   * before. On touch there's no hover, so the first tap only reveals the
   * info (arms `tappedId`); a second tap on the same node navigates. Tapping
   * a different node re-arms for that node instead of navigating. */
  const handleActivate = (id, to) => {
    setActiveId(id);
    if (prefersHover || tappedId === id) {
      setTappedId(null);
      navigate(to);
    } else {
      setTappedId(id);
    }
  };

  /* Props shared by every hoverable node. Descriptions stay in the DOM at all
   * times (only visually collapsed), so assistive tech can read what a
   * subsystem owns without needing to trigger the hover at all.
   *
   * `to` (optional) makes the node navigate to a /team anchor on click or
   * Enter/Space — the top roles go to #leadership, each subteam pill to its own
   * section. Nodes with a target get button semantics + a pointer cursor. */
  const nodeProps = (id, to) => ({
    tabIndex: 0,
    onMouseEnter: () => setActiveId(id),
    onFocus: () => setActiveId(id),
    ...(to
      ? {
          role: "link",
          style: { cursor: "pointer" },
          onClick: () => handleActivate(id, to),
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleActivate(id, to);
            }
          },
        }
      : {}),
  });

  const nodeClass = (base, id) =>
    `${base} tp-node${activeId === id ? " is-active" : ""}`;

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

          <p className="tp-hint tp-hint--desktop">Hover a role to see what it does</p>
          <p className="tp-hint tp-hint--mobile">
            Tap a role to see what it does, tap again to open its team page
          </p>

          <Link to="/team" className="tp-cta">
            Meet the team
          </Link>
        </div>

        <div
          className={`tp-chart${activeId ? " has-active" : ""}`}
          onMouseLeave={() => {
            setActiveId(null);
            setTappedId(null);
          }}
          onBlur={() => {
            setActiveId(null);
            setTappedId(null);
          }}
        >
          {TOP_ROLES.map((role, i) => (
            <Fragment key={role.id}>
              <div className="tp-tier tp-tier--single">
                <div
                  className={nodeClass(
                    `tp-box tp-box--top tp-box--lit-${role.lit}`,
                    role.id,
                  )}
                  {...nodeProps(role.id, role.to)}
                >
                  <span className="tp-node-head">{role.title}</span>
                  <span className="tp-node-desc">
                    <span>{role.desc}</span>
                  </span>
                </div>
              </div>

              <div
                className={`tp-connector tp-connector--${i === 0 ? "top" : "branch"}`}
              />
            </Fragment>
          ))}

          <div className="tp-tier3">
            <span
              className="tp-split-ball tp-split-ball--left"
              aria-hidden="true"
            />
            <span
              className="tp-split-ball tp-split-ball--right"
              aria-hidden="true"
            />
            <div className="tp-leads">
              {LEADS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    className="tp-lead-column"
                    key={item.id}
                    style={{ "--accent": item.color }}
                  >
                    <div
                      className="tp-connector tp-connector--split"
                      aria-hidden="true"
                    />

                    <div
                      className={nodeClass(
                        "tp-box tp-box--lead tp-box--lit-2",
                        item.id,
                      )}
                      {...nodeProps(item.id, item.to)}
                    >
                      <span className="tp-node-head">
                        <span className="tp-lead-icon">
                          <Icon size={18} />
                        </span>
                        <span className="tp-lead-title">{item.lead}</span>
                      </span>
                      <span className="tp-node-desc">
                        <span>{item.desc}</span>
                      </span>
                    </div>

                    <div className="tp-connector tp-lead-connector" />

                    <div className="tp-owns">
                      {item.children.map((child) => {
                        const childId = `${item.id}-${child.name}`;
                        return (
                          <div
                            className={nodeClass("tp-owns-item", childId)}
                            key={child.name}
                            {...nodeProps(childId, `/team#${slugify(child.name)}`)}
                          >
                            <span className="tp-node-head">{child.name}</span>
                            <span className="tp-node-desc">
                              <span>{child.desc}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
