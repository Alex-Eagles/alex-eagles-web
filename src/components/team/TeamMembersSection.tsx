import { motion } from "framer-motion";
import { UsersRound } from "lucide-react";
import type { TeamMember } from "@/data/team";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { fadeUp, staggerParent, viewportOnce } from "@/lib/motion";
import TeamMemberCard from "./TeamMemberCard";

/**
 * TeamMembersSection — renders the filtered roster as two groups, "Leadership"
 * (leads + vice leads, shown large) and "Members", each behind a labelled
 * divider. Falls back to an empty state when a filter matches nobody.
 */

interface TeamMembersSectionProps {
  members: TeamMember[];
}

/** Leads first, then vice leads; stable within each rank. */
const RANK: Record<string, number> = { Lead: 0, "Vice Lead": 1, Member: 2 };

export default function TeamMembersSection({
  members,
}: TeamMembersSectionProps) {
  const reduced = useReducedMotion();

  if (members.length === 0) {
    return (
      <div className="py-20 text-center">
        <UsersRound
          size={40}
          strokeWidth={1.5}
          className="text-fg-subtle mx-auto mb-4"
          aria-hidden="true"
        />
        <p className="font-sans text-body-lg text-fg-muted m-0">
          No team members match this filter.
        </p>
      </div>
    );
  }

  const leads = members
    .filter((m) => m.role !== "Member")
    .sort((a, b) => RANK[a.role] - RANK[b.role]);
  const regular = members.filter((m) => m.role === "Member");

  /** One labelled group: heading + rule + responsive card grid. */
  const group = (
    label: string,
    people: TeamMember[],
    size: "default" | "large",
  ) => {
    if (people.length === 0) return null;

    const grid = people.map((member) =>
      reduced ? (
        <TeamMemberCard key={member.id} member={member} size={size} />
      ) : (
        <motion.div key={member.id} variants={fadeUp} className="h-full">
          <TeamMemberCard member={member} size={size} />
        </motion.div>
      ),
    );

    return (
      <section className="mb-16 last:mb-0">
        {/* Group header — label + a rule that runs to the edge. */}
        <div className="flex items-center gap-5 mb-8">
          <h2 className="font-display font-bold text-h3 text-fg m-0 whitespace-nowrap tracking-[var(--tracking-tight)]">
            {label}
          </h2>
          <div
            className="flex-1 h-px"
            style={{
              background:
                "linear-gradient(90deg, var(--border-solid) 0%, transparent 100%)",
            }}
          />
        </div>

        {reduced ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {grid}
          </div>
        ) : (
          <motion.div
            className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerParent}
          >
            {grid}
          </motion.div>
        )}
      </section>
    );
  };

  return (
    <div>
      {group("Leadership", leads, "large")}
      {group("Members", regular, "default")}
    </div>
  );
}
