import { useState } from "react";
import { motion } from "framer-motion";
import BlogHeader from "@/components/blogFigma/BlogHeader";
import BlogFilters from "@/components/blogFigma/BlogFilters";
import BlogCard from "@/components/blogFigma/BlogCard";
import { fadeUp, staggerParent, viewportOnce } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { BLOG_POSTS, type BlogFilter } from "@/data/blogFigma";

/**
 * BlogFigma — the build-log listing page ported from the Figma "Aviation
 * website" blog design: title block, category filter pills, and a
 * responsive grid of post cards. Layout, copy, and photography come from the
 * design export; every color and font comes from the site's own design
 * tokens (theme.css) instead of the export's hardcoded hex values, so it
 * reads as native to the rest of Alex Eagles and adapts with the
 * light/dark toggle.
 */
export default function BlogFigma() {
  const [activeFilter, setActiveFilter] = useState<BlogFilter["id"]>("all");
  const reduced = useReducedMotion();

  const filteredPosts =
    activeFilter === "all"
      ? BLOG_POSTS
      : BLOG_POSTS.filter((post) => post.category === activeFilter);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(to bottom, var(--bg-elevated) 0%, var(--bg-primary) 60%)",
      }}
    >
      <div className="max-w-[var(--maxw-content)] mx-auto px-6 pt-36 pb-16 md:pt-40">
        <BlogHeader />
        <BlogFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        <motion.div
          key={activeFilter}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
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

        {filteredPosts.length === 0 && (
          <div className="text-center text-fg-muted py-20">
            <p className="font-sans text-xl">No blog posts found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
