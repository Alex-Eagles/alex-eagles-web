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
import { BLOG_FILTERS, type BlogFilter } from "@/data/blogFigma";

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
  return (
    <div role="group" aria-label="Filter posts by category" className="flex flex-wrap gap-3 mb-12">
      {BLOG_FILTERS.map((filter) => {
        const Icon = ICONS[filter.id];
        const active = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFilterChange(filter.id)}
            aria-pressed={active}
            className={`font-sans text-[13px] font-semibold px-3.5 py-1.5 rounded-full border transition-colors duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              active
                ? "bg-gold text-canvas border-gold shadow-[0_8px_24px_var(--brand-glow)]"
                : "bg-elevated text-fg-muted border-border hover:text-fg hover:border-brand"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
