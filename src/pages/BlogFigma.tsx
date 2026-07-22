import { useState } from "react";
import { motion } from "framer-motion";
import BlogHeader from "@/components/blogFigma/BlogHeader";
import BlogCard from "@/components/blogFigma/BlogCard";
import { fadeUp, staggerParent, viewportOnce } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/context/ThemeContext";
import { BLOG_POSTS, type BlogFilter } from "@/data/blogFigma";

/**
 * BlogFigma — the build-log listing page ported from the Figma "Aviation
 * website" blog design: title block, category filter pills, and a
 * responsive grid of post cards. Layout, copy, and photography come from the
 * design export; every color and font comes from the site's own design
 * tokens (theme.css) instead of the export's hardcoded hex values, so it
 * reads as native to the rest of Alex Eagles and adapts with the
 * light/dark toggle.
 *
 * The manufacturing-footage video is a fixed, page-level background layer
 * (not scoped to the header): it stays pinned to the viewport as the page
 * scrolls, and the cards section below — which has its own opaque
 * background — scrolls up and covers it once it comes into view.
 */
export default function BlogFigma() {
  const [activeFilter, setActiveFilter] = useState<BlogFilter["id"]>("all");
  const reduced = useReducedMotion();
  const { isDark } = useTheme();

  const filteredPosts =
    activeFilter === "all"
      ? BLOG_POSTS
      : BLOG_POSTS.filter((post) => post.category === activeFilter);

  return (
    <div className="min-h-screen">
      {/* Fixed video background — pinned to the viewport for the whole
          page; only visible where content above it is transparent (i.e.
          behind the header). */}
      <div className="fixed inset-0 z-0 overflow-hidden">
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
      </div>

      <BlogHeader activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Cards section — transparent, so the fixed video shows through
          everywhere except the opaque panel below. */}
      <div className="relative z-10">
        <div className="max-w-[var(--maxw-content)] mx-auto px-6 pt-10 pb-16">
          {/* Canvas behind the cards — same elevated panel as the home page's
              "Latest updates" section, for the nested-card depth effect. Dark
              mode uses a Space Cadet navy; light mode is a touch darker than
              the default elevated surface. */}
          <div
            className="border border-border rounded-2xl p-[30px] shadow-[var(--elevation-2)]"
            style={{ backgroundColor: isDark ? "#121B34" : "#DEE0F0" }}
          >
            {filteredPosts.length > 0 ? (
              <motion.div
                key={activeFilter}
                className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                variants={reduced ? undefined : staggerParent}
                initial={reduced ? undefined : "hidden"}
                animate={reduced ? undefined : "visible"}
                viewport={viewportOnce}
              >
                {filteredPosts.map((post) => (
                  <motion.div key={post.id} variants={reduced ? undefined : fadeUp}>
                    <BlogCard {...post} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center text-fg-muted py-20">
                <p className="font-sans text-xl">No blog posts found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
