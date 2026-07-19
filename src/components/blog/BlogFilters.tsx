import { LayoutGrid } from "lucide-react";
import { CATEGORY_META, type BlogCategory } from "@/data/blog";

/** "all" plus every real category — what the filter bar can be set to. */
export type BlogFilter = "all" | BlogCategory;

interface BlogFiltersProps {
  activeFilter: BlogFilter;
  onFilterChange: (filter: BlogFilter) => void;
}

/** Filter definitions, in display order. "all" is synthesised up front. */
const FILTERS: { id: BlogFilter; label: string; icon: typeof LayoutGrid }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  ...(Object.keys(CATEGORY_META) as BlogCategory[]).map((id) => ({
    id,
    label: CATEGORY_META[id].label,
    icon: CATEGORY_META[id].icon,
  })),
];

/**
 * BlogFilters — a row of pill toggles that filters the post grid by category.
 * Single-select; the active pill is filled with the gold CTA colour to match
 * the site's primary-button treatment.
 */
export default function BlogFilters({
  activeFilter,
  onFilterChange,
}: BlogFiltersProps) {
  return (
    <div
      role="group"
      aria-label="Filter posts by category"
      className="flex flex-wrap gap-3 mb-10"
    >
      {FILTERS.map(({ id, label, icon: Icon }) => {
        const active = activeFilter === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onFilterChange(id)}
            className={
              "inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full " +
              "font-sans text-small font-semibold cursor-pointer " +
              "transition-[background-color,color,border-color,transform] duration-200 ease-out " +
              (active
                ? "bg-gold text-canvas border border-gold shadow-[0_8px_24px_var(--brand-glow)]"
                : "bg-elevated text-fg-muted border border-border hover:text-fg hover:border-brand")
            }
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
