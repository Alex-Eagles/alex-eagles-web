import { useEffect, useState, type CSSProperties } from "react";
import heroPhoto from "@/assets/team/team-2025.jpg";
import {
  SUB_TEAMS,
  TEAM_MEMBERS,
  type Role,
  type Team,
  type TeamMember,
} from "@/data/team";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import TeamMemberCard from "./TeamMemberCard";

/**
 * TeamMembersSection — the full Team page, ported from the "Team Member Hover
 * Card" design handoff: a full-height photo hero, a Leadership row (the team
 * lead centred and raised), then divisions → sections → member grid, plus a
 * collapsible "jump to section" side nav.
 *
 * High-fidelity to the spec, so this page is intentionally always-dark
 * (#070919) and uses Archivo — it does not follow the site theme tokens.
 *
 * Data comes from our own roster (`TEAM_MEMBERS`): the Executive squad is the
 * Leadership row; Mechanical and Autonomous are the two divisions, each split
 * into its sub-teams.
 */

const EASE = "cubic-bezier(.2,.8,.2,1)";

const RANK: Record<Role, number> = { Lead: 0, "Vice Lead": 1, Member: 2 };
const byRank = (a: TeamMember, b: TeamMember) => RANK[a.role] - RANK[b.role];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const DIVISIONS: { num: string; name: string; team: Team }[] = [
  { num: "01", name: "Mechanical", team: "Mechanical" },
  { num: "02", name: "Autonomous", team: "Autonomous" },
];

interface Section {
  name: string;
  id: string;
  members: TeamMember[];
}

/** Sub-teams of a division that actually have members, in canonical order. */
function sectionsFor(team: Team): Section[] {
  return SUB_TEAMS[team]
    .map((sub) => ({
      name: sub,
      id: slug(`${team}-${sub}`),
      members: TEAM_MEMBERS.filter(
        (m) => m.team === team && m.subTeam === sub,
      ).sort(byRank),
    }))
    .filter((s) => s.members.length > 0);
}

export default function TeamMembersSection() {
  const reduced = useReducedMotion();
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY || 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Leadership row: the Executive squad, lead centred (prefer the cut-out member
  // so the row's hero card does the full reveal), the rest flanking and raised.
  const leadership = TEAM_MEMBERS.filter((m) => m.team === "Executive").sort(
    byRank,
  );
  const center = leadership.find((m) => m.cutout) ?? leadership[0];
  const flanks = leadership.filter((m) => m !== center);
  const [left, right] = [flanks[0], flanks[1]];

  const divisions = DIVISIONS.map((d) => ({
    ...d,
    sections: sectionsFor(d.team),
  }));

  const navGroups = [
    { label: "Leadership", items: [{ name: "Leadership", href: "#leadership" }] },
    ...divisions.map((d) => ({
      label: d.name,
      items: d.sections.map((s) => ({ name: s.name, href: `#${s.id}` })),
    })),
  ];

  const hintOpacity = Math.max(0, 1 - scrolled / 180);
  const hintShift = reduced ? 0 : Math.min(40, scrolled * 0.7);

  const eyebrow: CSSProperties = {
    fontSize: 13,
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    color: "#f0910e",
    fontWeight: 700,
    margin: "0 0 6px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#070919",
        fontFamily: "'Archivo', system-ui, sans-serif",
        color: "#e9ebff",
        overflowX: "hidden",
      }}
    >
      {/* HERO */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          minHeight: 600,
          overflow: "hidden",
        }}
      >
        <img
          src={heroPhoto}
          alt="The Alex Eagles team"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 82%",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg,rgba(7,9,25,.34) 0%,rgba(7,9,25,0) 22%,rgba(7,9,25,0) 62%,rgba(7,9,25,.55) 82%,rgba(7,9,25,.94) 95%,#070919 100%)",
          }}
        />

        {/* Scroll hint */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 24,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 7,
            pointerEvents: "none",
            color: "#c3c8f2",
            opacity: hintOpacity,
            transform: `translateY(${hintShift}px)`,
            transition: reduced
              ? "none"
              : `opacity .7s ease, transform .7s ${EASE}`,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.02em",
              textShadow: "0 2px 12px rgba(0,0,0,.5)",
            }}
          >
            Hover a card to reveal the person
          </span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={reduced ? undefined : { animation: "crewBob 1.6s ease-in-out infinite" }}
          >
            <path d="M12 5v14" />
            <path d="m6 13 6 6 6-6" />
          </svg>
        </div>

        {/* Hero heading */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "0 48px 40px",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "left" }}>
            <p
              style={{
                fontSize: 13,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#f0910e",
                fontWeight: 700,
                margin: "0 0 8px",
              }}
            >
              Meet the team
            </p>
            <h1
              style={{
                fontSize: "clamp(40px,6vw,68px)",
                lineHeight: 0.92,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: 0,
                color: "#ffffff",
                textShadow: "0 4px 30px rgba(0,0,0,.55)",
              }}
            >
              THE CREW
            </h1>
          </div>
        </div>
      </div>

      {/* LEADERSHIP */}
      <div
        id="leadership"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "88px 48px 40px",
          scrollMarginTop: 24,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <p style={{ ...eyebrow, letterSpacing: "0.24em", margin: "0 0 6px" }}>
            Leadership
          </p>
          <h2
            style={{
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: 0,
              color: "#ffffff",
            }}
          >
            The people steering the team
          </h2>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: 28,
            flexWrap: "wrap",
          }}
        >
          {left && (
            <div style={{ width: 250, maxWidth: "100%", marginTop: 44 }}>
              <TeamMemberCard member={left} />
            </div>
          )}
          {center && (
            <div style={{ width: 270, maxWidth: "100%" }}>
              <TeamMemberCard member={center} size="large" />
            </div>
          )}
          {right && (
            <div style={{ width: 250, maxWidth: "100%", marginTop: 44 }}>
              <TeamMemberCard member={right} />
            </div>
          )}
        </div>
      </div>

      {/* DIVISIONS */}
      {divisions.map((d) => (
        <div key={d.num}>
          <div
            style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 48px 8px" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 6,
                borderTop: "1px solid rgba(139,143,196,.16)",
                paddingTop: 40,
              }}
            >
              <span
                style={{
                  fontSize: 64,
                  fontWeight: 900,
                  color: "rgba(240,145,14,.18)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                {d.num}
              </span>
              <p style={eyebrow}>Division</p>
              <h2
                style={{
                  fontSize: 38,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  color: "#ffffff",
                }}
              >
                {d.name}
              </h2>
            </div>
          </div>

          {d.sections.map((sec) => (
            <div
              key={sec.id}
              id={sec.id}
              style={{
                maxWidth: 1200,
                margin: "0 auto",
                padding: "34px 48px 0",
                scrollMarginTop: 24,
              }}
            >
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#c3c8f2",
                  letterSpacing: "0.02em",
                  margin: "0 0 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: "#f0910e",
                    display: "inline-block",
                  }}
                />
                {sec.name}
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(216px,1fr))",
                  gap: 22,
                }}
              >
                {sec.members.map((m) => (
                  <TeamMemberCard key={m.id} member={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "56px 48px 80px",
          textAlign: "center",
          color: "#5f6598",
          fontSize: 13,
          letterSpacing: "0.02em",
        }}
      >
        <p style={{ margin: 0 }}>Alex Eagles · Unmanned Aerial Systems Team</p>
      </div>

      {/* JUMP-TO NAV (collapsible) */}
      <button
        onClick={() => setNavOpen((v) => !v)}
        aria-label={navOpen ? "Close section nav" : "Jump to section"}
        aria-expanded={navOpen}
        style={{
          position: "fixed",
          top: "50%",
          zIndex: 51,
          right: navOpen ? 236 : 16,
          transform: "translateY(-50%)",
          width: 46,
          height: 56,
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          cursor: "pointer",
          color: "#0a0c24",
          background: "#f0910e",
          border: "none",
          boxShadow: "0 8px 22px -8px rgba(240,145,14,.6)",
          transition: `right .38s ${EASE}`,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: "transform .35s ease",
            transform: navOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {navOpen ? "Close" : "Jump"}
        </span>
      </button>
      <nav
        aria-label="Jump to section"
        style={{
          position: "fixed",
          top: "50%",
          zIndex: 50,
          width: 212,
          right: 16,
          transform: `translateY(-50%) translateX(${navOpen ? "0" : "120%"})`,
          opacity: navOpen ? 1 : 0,
          pointerEvents: navOpen ? "auto" : "none",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          padding: "16px 12px",
          background: "rgba(12,15,44,.9)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(139,143,196,.2)",
          borderRadius: 16,
          boxShadow: "0 20px 50px -18px rgba(0,0,0,.75)",
          maxHeight: "82vh",
          overflow: "auto",
          transition: `transform .38s ${EASE}, opacity .3s ease`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "0 6px 8px",
          }}
        >
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#8b8fc4",
              fontWeight: 700,
            }}
          >
            Jump to
          </span>
        </div>
        {navGroups.map((g) => (
          <div key={g.label}>
            <p
              style={{
                fontSize: 9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#f0910e",
                fontWeight: 700,
                margin: "10px 8px 3px",
              }}
            >
              {g.label}
            </p>
            {g.items.map((it) => (
              <a
                key={it.href}
                href={it.href}
                onClick={() => setNavOpen(false)}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#c3c8f2",
                  padding: "8px 11px",
                  borderRadius: 8,
                  whiteSpace: "nowrap",
                  display: "block",
                  textDecoration: "none",
                }}
              >
                {it.name}
              </a>
            ))}
          </div>
        ))}
      </nav>

      <style>{`@keyframes crewBob { 0%,100% { transform: translateY(0);} 50% { transform: translateY(6px);} }`}</style>
    </div>
  );
}
