/**
 * ssr-team-entry.tsx — throwaway SSR entry used only by scripts/export-team.mjs
 * to render the Team page to static HTML. Not part of the app build; lives
 * outside src/ on purpose so tsc/vite's normal app build never sees it.
 */
import { renderToString } from "react-dom/server";
import Team from "@/pages/Team";
import type { RosterYear } from "@/data/team";

export function renderTeamPage(year: RosterYear): string {
  return renderToString(<Team initialYear={year} />);
}
