import { Linkedin, User } from "lucide-react";
import { memberPhoto, type TeamMember } from "@/data/team";
import { chipStyle, roleAccent, teamAccent } from "./accents";

/**
 * TeamMemberCard — one person: role badge, portrait, name, sub-team tag,
 * year/major, and an optional LinkedIn link.
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
  const accent = teamAccent(member.team);
  const badge = roleAccent(member.role);

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
      {/* Role badge — pinned top-left so the portrait stays optically centered. */}
      <span
        className="absolute top-4 left-4 font-sans text-caption font-bold uppercase
                   tracking-[var(--tracking-caps)] px-2.5 py-1 rounded-lg border"
        style={chipStyle(badge)}
      >
        {member.role}
      </span>

      {/* Portrait (or placeholder when no photo exists for this member). */}
      <div
        className={
          "relative rounded-full overflow-hidden flex items-center justify-center " +
          "bg-[var(--bg-elevated)] border-2 mt-8 mb-5 shrink-0 " +
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

      {/* Sub-team tag */}
      <span
        className="font-sans text-caption font-semibold px-2.5 py-1 rounded-lg border mb-3.5"
        style={chipStyle(accent)}
      >
        {member.subTeam}
      </span>

      {/* Year + major — mono, per the "technical numbers" typography rule. */}
      <div className="font-mono text-[12px] text-fg-subtle leading-[1.6] mb-1">
        Year {member.year}
      </div>
      <div className="font-sans text-small text-fg-muted leading-[1.5]">
        {member.major}
      </div>

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
