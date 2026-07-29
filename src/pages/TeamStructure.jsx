import { Wrench, Cpu, Crown } from "lucide-react";
import "../styles/TeamStructure.css";

const LEADS = [
  {
    id: "mechanical",
    lead: "Mechanical Lead",
    icon: Wrench,
    color: "#8b5cf6",
    children: ["Propulsion", "Aero Design", "Structure"],
  },
  {
    id: "autonomous",
    lead: "Autonomous Lead",
    icon: Cpu,
    color: "#3b82f6",
    children: ["Software", "Hardware", "AI"],
  },
];

export default function TeamStructure() {
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
        </div>

        <div className="tp-chart">
          <div className="tp-tier tp-tier--single">
            <div className="tp-box tp-box--top tp-box--lit-0">
              <Crown size={16} />
              Team Leader
            </div>
          </div>

          <div className="tp-connector tp-connector--top" />

          <div className="tp-tier tp-tier--single">
            <div className="tp-box tp-box--top tp-box--lit-1">
              <Crown size={16} />
              Team Vice Lead
            </div>
          </div>

          <div className="tp-connector tp-connector--branch" />

          <div className="tp-tier3">
            <span className="tp-split-ball tp-split-ball--left" aria-hidden="true" />
            <span className="tp-split-ball tp-split-ball--right" aria-hidden="true" />
            <div className="tp-leads">
              {LEADS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    className="tp-lead-column"
                    key={item.id}
                    style={{ "--accent": item.color }}
                  >
                    <div className="tp-connector tp-connector--split" aria-hidden="true" />
                    <div className="tp-box tp-box--lead tp-box--lit-2">
                      <span className="tp-lead-icon">
                        <Icon size={18} />
                      </span>
                      <span className="tp-lead-title">{item.lead}</span>
                    </div>
                    <div className="tp-connector tp-lead-connector" />
                    <div className="tp-owns">
                      {item.children.map((child) => (
                        <div className="tp-owns-item" key={child}>
                          {child}
                        </div>
                      ))}
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
