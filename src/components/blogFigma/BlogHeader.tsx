import BlogFilters from "@/components/blogFigma/BlogFilters";
import type { BlogFilter } from "@/data/blogFigma";

interface BlogHeaderProps {
  activeFilter: BlogFilter["id"];
  onFilterChange: (filter: BlogFilter["id"]) => void;
}

/**
 * BlogHeader — the "Alex Eagles / Blogs" title block for the Figma-sourced
 * blog page, with a looping background video of the team manufacturing the
 * drone and fixed-wing. The video is scoped to this section only (scrolls
 * away with the header, not pinned to the viewport); the title, tagline,
 * and category filter pills sit inset to the site's normal content width,
 * directly over the footage.
 *
 * Colors here are hardcoded, not theme tokens — same convention as <Hero/>.
 * This band is always a dark video + scrim regardless of the site's
 * light/dark toggle, so the text needs to stay light-on-dark either way.
 */
export default function BlogHeader({ activeFilter, onFilterChange }: BlogHeaderProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Background video — muted/loop/autoplay, no controls. */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        <source src="/media/blog-hero.mp4" type="video/mp4" />
      </video>

      {/* Darkening scrim so the title/tagline/filters stay readable over the footage. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(7,9,28,0.55) 0%, rgba(7,9,28,0.88) 100%)",
        }}
      />

      <div className="relative z-10 max-w-[var(--maxw-content)] mx-auto px-6 pt-36 pb-10 md:pt-40 min-h-screen flex flex-col text-center">
        {/* Title block — vertically centered in the space above the pills,
            using the exact same treatment as the home hero's title. */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="eyebrow mb-3" style={{ color: "#8B8FC8" }}>
            Alex Eagles
          </div>

          <h1
            className="font-display font-extrabold leading-none tracking-[-0.02em] m-0 mb-5 pb-1"
            style={{ fontSize: "var(--text-hero)", color: "#F0F2FF" }}
          >
            Blogs
          </h1>

          <p className="font-sans text-body-lg italic mt-6" style={{ color: "#B7BAE0" }}>
            “Technical stories, flight tests & innovations from the team”
          </p>
        </div>

        {/* Category filter pills, pinned near the bottom of the hero — the
            last thing over the video before the cards panel. */}
        <div>
          <BlogFilters activeFilter={activeFilter} onFilterChange={onFilterChange} />
        </div>
      </div>
    </div>
  );
}
