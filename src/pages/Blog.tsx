import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import BlogHeader from "@/components/blog/BlogHeader";
import BlogFilters, { type BlogFilter } from "@/components/blog/BlogFilters";
import BlogCard from "@/components/blog/BlogCard";
import { fadeUp, staggerParent } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { BLOG_POSTS } from "@/data/blog";

/**
 * Blog — the team build log. A hero header, a category filter bar, and a
 * responsive grid of post cards that fade up in a stagger. Filtering is
 * client-side against the mock data in `@/data/blog`; swap that for an API
 * later without touching this component. (Navbar + Footer come from the App
 * shell, so this page renders only its own content.)
 */
export default function Blog() {
  const reduced = useReducedMotion();
  const [activeFilter, setActiveFilter] = useState<BlogFilter>("all");

  const filtered = useMemo(
    () =>
      activeFilter === "all"
        ? BLOG_POSTS
        : BLOG_POSTS.filter((p) => p.category === activeFilter),
    [activeFilter],
  );

  return (
    <>
      <BlogHeader />

      <section className="bg-surface pt-12 pb-24 px-6">
        <div className="max-w-[var(--maxw-content)] mx-auto">
          <BlogFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {filtered.length > 0 ? (
            <motion.div
              /* Re-mount on filter change so the stagger replays. */
              key={activeFilter}
              className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              variants={reduced ? undefined : staggerParent}
              initial={reduced ? undefined : "hidden"}
              animate={reduced ? undefined : "visible"}
            >
              {filtered.map((post) => (
                <motion.div key={post.id} variants={reduced ? undefined : fadeUp}>
                  <BlogCard post={post} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <p className="font-sans text-body text-fg-muted py-16 text-center">
              No posts in this category yet — check back soon.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
