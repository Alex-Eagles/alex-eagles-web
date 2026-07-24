import {
  Grid3x3,
  Cpu,
  Code,
  CircuitBoard,
  Eye,
  Settings,
  Plane,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { BLOG_FILTERS, type BlogFilter } from "@/data/blog";
import { useTheme } from "@/context/ThemeContext";

interface BlogFiltersProps {
  activeFilter: BlogFilter["id"];
  onFilterChange: (filter: BlogFilter["id"]) => void;
}

const ICONS: Record<BlogFilter["id"], LucideIcon> = {
  all: Grid3x3,
  hardware: Cpu,
  software: Code,
  firmware: CircuitBoard,
  computerVision: Eye,
  structure: Settings,
  aerodesign: Plane,
  propulsion: Wind,
};

/**
 * Pill filter row above the post grid. The active pill uses the site's gold
 * CTA treatment (same as `<Button variant="primary">`); inactive pills match
 * the elevated-surface/border idiom used elsewhere on the site.
 */
export default function BlogFilters({ activeFilter, onFilterChange }: BlogFiltersProps) {
  const { isDark } = useTheme();
  return (
    <div
      role="group"
      aria-label="Filter posts by category"
      className="flex gap-3 overflow-x-auto sm:flex-wrap sm:overflow-visible sm:justify-center -mx-6 px-6 sm:mx-0 sm:px-0 pb-1 sm:pb-0 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {BLOG_FILTERS.map((filter) => {
        const Icon = ICONS[filter.id];
        const active = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFilterChange(filter.id)}
            aria-pressed={active}
            className={`font-sans text-[13px] font-semibold px-3.5 py-1.5 min-h-11 sm:min-h-0 rounded-full border transition-colors duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              active
                ? "bg-gold border-gold shadow-[0_8px_24px_var(--brand-glow)]"
                : "bg-elevated text-fg-muted border-border hover:text-fg hover:border-brand"
            }`}
            /* Active pill text: the light-mode gold (#b45309) is dark enough
               that the near-white canvas token only hit 4.36:1, so pin pure
               white on light and the dark canvas ink on the bright dark-mode
               gold — both clear WCAG AA. */
            style={active ? { color: isDark ? "var(--bg-primary)" : "#ffffff" } : undefined}
          >
            <Icon className="w-3.5 h-3.5" />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
