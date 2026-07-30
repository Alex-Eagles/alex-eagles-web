import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { Wrench, Cpu } from "lucide-react";
import "../styles/TeamStructure.css";

/**
 * The two roles above the split. `lit` picks up the existing traveling-light
 * animation class (tp-box--lit-0 / -1), which is timed to the connector legs.
 */
const TOP_ROLES = [
  {
    id: "leader",
    title: "Team Leader",
    lit: 0,
    desc: "Sets the season plan, owns the competition roadmap and makes the final call when subsystems disagree.",
  },
  {
    id: "vice",
    title: "Team Vice Lead",
    lit: 1,
    desc: "Runs the week: schedules, design reviews, logistics and travel, and stands in for the leader whenever needed.",
  },
];

const LEADS = [
  {
    id: "mechanical",
    lead: "Mechanical Lead",
    icon: Wrench,
    color: "#8b5cf6",
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
    color: "#3b82f6",
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

  /* Props shared by every hoverable node. Descriptions stay in the DOM at all
   * times (only visually collapsed), so assistive tech can read what a
   * subsystem owns without needing to trigger the hover at all. */
  const nodeProps = (id) => ({
    tabIndex: 0,
    onMouseEnter: () => setActiveId(id),
    onFocus: () => setActiveId(id),
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

          <p className="tp-hint">Hover a role to see what it does</p>

          <Link to="/team" className="tp-cta">
            Meet the team
          </Link>
        </div>

        <div
          className={`tp-chart${activeId ? " has-active" : ""}`}
          onMouseLeave={() => setActiveId(null)}
          onBlur={() => setActiveId(null)}
        >
          {TOP_ROLES.map((role, i) => (
            <Fragment key={role.id}>
              <div className="tp-tier tp-tier--single">
                <div
                  className={nodeClass(
                    `tp-box tp-box--top tp-box--lit-${role.lit}`,
                    role.id,
                  )}
                  {...nodeProps(role.id)}
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
                      {...nodeProps(item.id)}
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
                            {...nodeProps(childId)}
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
