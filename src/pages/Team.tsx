import TeamMembersSection from "@/components/team/TeamMembersSection";

/**
 * Team — the full roster page. All of the layout (photo hero, leadership row,
 * divisions → sections → member grid, jump nav) lives in TeamMembersSection,
 * which reads the roster from the data layer directly, so this page is just a
 * mount point.
 */
export default function Team() {
  return <TeamMembersSection />;
}
