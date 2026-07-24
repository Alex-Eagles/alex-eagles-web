import { useRef, useState } from "react";
import { motion } from "framer-motion";
import BlogHeader from "@/components/blog/BlogHeader";
import BlogCard from "@/components/blog/BlogCard";
import { fadeUp, staggerParent, viewportOnce } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/context/ThemeContext";
import { BLOG_POSTS, type BlogFilter } from "@/data/blog";

/** Posts shown per "page" before Load more reveals the next batch. */
const PAGE_SIZE = 6;

/**
 * Blog — the build-log listing page ported from the Figma "Aviation
 * website" blog design: title block, category filter pills, and a
 * responsive grid of post cards. Layout, copy, and photography come from the
 * design export; every color and font comes from the site's own design
 * tokens (theme.css) instead of the export's hardcoded hex values, so it
 * reads as native to the rest of Alex Eagles and adapts with the
 * light/dark toggle.
 */
export default function Blog() {
  const [activeFilter, setActiveFilter] = useState<BlogFilter["id"]>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const reduced = useReducedMotion();
  const { isDark } = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);

  const filteredPosts =
    activeFilter === "all"
      ? BLOG_POSTS
      : BLOG_POSTS.filter((post) => post.category === activeFilter);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  /** Filtering also scrolls the cards panel into view — the pills live up
   * in the video hero, so without this the result of a click isn't visible.
   * Also resets pagination back to the first page for the new category. */
  const handleFilterChange = (filter: BlogFilter["id"]) => {
    setActiveFilter(filter);
    setVisibleCount(PAGE_SIZE);
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: isDark
          ? "#121B34"
          : "linear-gradient(to bottom, var(--bg-elevated) 0%, var(--bg-primary) 60%)",
      }}
    >
      <BlogHeader activeFilter={activeFilter} onFilterChange={handleFilterChange} />

      <div className="max-w-[var(--maxw-content)] mx-auto px-6 pt-2 pb-16">
        {/* Canvas behind the cards — same elevated panel as the home page's
            "Latest updates" section, for the nested-card depth effect. Dark
            mode uses a Space Cadet navy; light mode is a touch darker than
            the default elevated surface. */}
        <div
          ref={panelRef}
          className="border border-border rounded-2xl p-[30px] shadow-[var(--elevation-2)] scroll-mt-24"
          style={{ backgroundColor: isDark ? "#121B34" : "#DEE0F0" }}
        >
          {filteredPosts.length > 0 ? (
            <>
              <motion.div
                key={activeFilter}
                className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                variants={reduced ? undefined : staggerParent}
                initial={reduced ? undefined : "hidden"}
                animate={reduced ? undefined : "visible"}
                viewport={viewportOnce}
              >
                {visiblePosts.map((post) => (
                  <motion.div key={post.id} variants={reduced ? undefined : fadeUp}>
                    <BlogCard {...post} />
                  </motion.div>
                ))}
              </motion.div>

              {hasMore && (
                <div className="flex justify-center mt-10">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    className="font-sans text-sm font-semibold px-6 py-2.5 rounded-full border border-border bg-elevated text-fg cursor-pointer transition-colors duration-200 hover:border-brand hover:text-brand"
                  >
                    Load more posts
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-fg-muted py-20">
              <p className="font-sans text-xl">No blog posts found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
