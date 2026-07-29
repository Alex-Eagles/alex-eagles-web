import { Fragment, useState } from "react";
import { Wrench, Cpu, Crown } from "lucide-react";
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
    desc: "Runs the week: schedules, design reviews, logistics and travel — and stands in for the leader whenever needed.",
  },
];

const LEADS = [
  {
    id: "mechanical",
    lead: "Mechanical Lead",
    icon: Wrench,
    color: "#8b5cf6",
    desc: "The aircraft as a physical object — its shape, its strength and its thrust.",
    children: [
      {
        name: "Propulsion",
        desc: "Motor, ESC and propeller selection, thrust testing and endurance budgets.",
      },
      {
        name: "Aero Design",
        desc: "Wing and fuselage aerodynamics, stability and performance sizing.",
      },
      {
        name: "Structure",
        desc: "Carbon layups, load paths and manufacturing of every structural part.",
      },
    ],
  },
  {
    id: "autonomous",
    lead: "Autonomous Lead",
    icon: Cpu,
    color: "#3b82f6",
    desc: "Onboard hardware, flight software and perception — everything that lets the aircraft think for itself.",
    children: [
      {
        name: "Software",
        desc: "Flight logic, ground station and mission autonomy — waypoints to full autonomous runs.",
      },
      {
        name: "Hardware",
        desc: "Avionics boards, power distribution, wiring and sensor integration.",
      },
      {
        name: "Computer Vision",
        desc: "Detection, classification and geolocation of targets from the onboard camera.",
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
      <div className="tp-grid-bg" aria-hidden="true" />
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
              Subsystems.
            </span>
          </h2>

          <p className="tp-copy">
            Every part of the aircraft belongs to someone. Subsystems work in
            parallel and the leads keep them in sync.
          </p>

          <p className="tp-hint">Hover a role to see what it owns</p>
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
                  <span className="tp-node-head">
                    <Crown size={16} />
                    {role.title}
                  </span>
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
