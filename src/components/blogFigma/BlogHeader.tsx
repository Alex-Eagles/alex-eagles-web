import BlogFilters from "@/components/blogFigma/BlogFilters";
import type { BlogFilter } from "@/data/blogFigma";

interface BlogHeaderProps {
  activeFilter: BlogFilter["id"];
  onFilterChange: (filter: BlogFilter["id"]) => void;
}

/**
 * BlogHeader — the "Alex Eagles / Blogs" title block + category filter
 * pills. Purely content, no background of its own: it floats transparently
 * over the page-level fixed video (rendered by <BlogFigma/>) for exactly
 * one viewport height, so the footage shows through until the cards
 * section scrolls up and covers it.
 *
 * Colors here are hardcoded, not theme tokens — same convention as <Hero/>.
 * This band always sits over a dark video + scrim regardless of the site's
 * light/dark toggle, so the text needs to stay light-on-dark either way.
 */
export default function BlogHeader({ activeFilter, onFilterChange }: BlogHeaderProps) {
  return (
    <div className="relative z-10 max-w-[var(--maxw-content)] mx-auto px-6 pt-36 pb-16 md:pt-40 min-h-screen flex flex-col justify-center text-center">
      <div className="eyebrow mb-3" style={{ color: "#8B8FC8" }}>
        Alex Eagles
      </div>

      <h1
        className="font-display font-extrabold text-6xl md:text-8xl leading-none tracking-[-0.02em] mb-4"
        style={{ color: "#F0F2FF" }}
      >
        Blogs
      </h1>

      <p className="font-sans text-body-lg italic mt-6" style={{ color: "#B7BAE0" }}>
        “Technical stories, flight tests & innovations from the team”
      </p>

      {/* Category filter pills, pushed further down so more of the video
          shows between the tagline and the pills. */}
      <div className="mt-24 md:mt-32">
        <BlogFilters activeFilter={activeFilter} onFilterChange={onFilterChange} />
      </div>
    </div>
  );
}
