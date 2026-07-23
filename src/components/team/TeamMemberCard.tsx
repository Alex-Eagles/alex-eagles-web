import { Linkedin, User } from "lucide-react";
import { memberPhoto, type TeamMember } from "@/data/team";
import { teamAccent } from "./accents";

/**
 * TeamMemberCard — one person: portrait, name, role + sub-team, bio,
 * and an optional LinkedIn link.
 *
 * `size="large"` is used for the Leadership row (bigger portrait + name);
 * everyone else renders at the default size.
 */

interface TeamMemberCardProps {
  member: TeamMember;
  size?: "default" | "large";
}

export default function TeamMemberCard({
  member,
  size = "default",
}: TeamMemberCardProps) {
  const isLarge = size === "large";
  const photo = memberPhoto(member);
  const bio = member.bio;
  const accent = teamAccent(member.team);

  return (
    <article
      className={
        "group relative h-full flex flex-col items-center text-center " +
        "bg-[var(--card)] border border-border rounded-xl p-7 " +
        "shadow-[var(--elevation-2)] transition-[transform,box-shadow,border-color] " +
        "duration-[250ms] ease-out hover:-translate-y-1.5 " +
        "hover:shadow-[var(--elevation-4)] hover:border-[var(--accent)]"
      }
      style={
        {
          // Drives the hover border color via the arbitrary variant above.
          "--accent": accent,
        } as React.CSSProperties
      }
    >
      {/* Portrait (or placeholder when no photo exists for this member). */}
      <div
        className={
          "relative rounded-lg overflow-hidden flex items-center justify-center " +
          "bg-[var(--bg-elevated)] border-2 mt-1 mb-4 shrink-0 " +
          "transition-[border-color,transform] duration-[250ms] ease-out " +
          "group-hover:scale-[1.03] " +
          (isLarge ? "w-[148px] h-[148px]" : "w-[116px] h-[116px]")
        }
        style={{
          borderColor: `color-mix(in srgb, ${accent} 45%, transparent)`,
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt={member.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <User
            size={isLarge ? 60 : 46}
            strokeWidth={1.5}
            className="text-fg-subtle"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Name */}
      <h3
        className={
          "font-display font-bold text-fg m-0 mb-2.5 leading-[1.15] " +
          "tracking-[var(--tracking-tight)] " +
          (isLarge ? "text-[26px]" : "text-h4")
        }
      >
        {member.name}
      </h3>

      {/* Team + role, e.g. "Autonomous Lead" */}
      <p className="font-sans text-body font-bold text-fg m-0 mb-2.5">
        {member.subTeam} {member.role}
      </p>

      {/* Second position, for members holding two roles. */}
      {member.secondRole && (
        <p className="font-sans text-body font-bold text-fg m-0 mb-2.5">
          {member.secondRole}
        </p>
      )}

      {/*
       * Freeform text — write whatever you want per member in team.ts.
       * Hidden by default; revealed as a bubble above the card on hover
       * (driven by `group-hover`, since the whole <article> is `.group`).
       */}
      {bio && (
        <div
          className={
            "absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-20 " +
            "w-max max-w-[220px] rounded-lg px-3.5 py-2.5 text-center font-sans " +
            "text-small text-fg leading-[1.5] whitespace-pre-line " +
            "opacity-0 invisible translate-y-1 " +
            "transition-[opacity,transform,visibility] duration-300 ease-out " +
            "group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 " +
            "pointer-events-none"
          }
          style={{
            // Same glass treatment as the navbar pill.
            background: "var(--bg-glass)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--elevation-2)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {bio}
        </div>
      )}

      {/* LinkedIn — pushed to the card floor so cards bottom-align. */}
      {member.linkedIn && (
        <a
          href={member.linkedIn}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${member.name} on LinkedIn`}
          className="mt-auto pt-4 text-fg-subtle hover:text-brand-light transition-colors"
        >
          <Linkedin size={18} />
        </a>
      )}
    </article>
  );
}
