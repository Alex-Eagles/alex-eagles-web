import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BlogHeader from "@/components/blog/BlogHeader";
import BlogCard from "@/components/blog/BlogCard";
import BlogPostModal from "@/components/blog/BlogPostModal";
import { fadeUp, staggerParent, viewportOnce } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTheme } from "@/context/ThemeContext";
import { BLOG_FILTERS, BLOG_POSTS, type BlogFilter, type BlogPostFull } from "@/data/blog";

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
  const [selectedPost, setSelectedPost] = useState<BlogPostFull | null>(null);

  /**
   * A search result points at one card. Behave like a visitor who found it:
   * switch to its category, page it into view, scroll to it, and only then
   * open it — so closing the card leaves you where the card is.
   */
  const [searchParams] = useSearchParams();
  const postParam = searchParams.get("post");
  const openedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!postParam) return;
    const match = BLOG_POSTS.find((p) => String(p.id) === postParam);
    if (!match) return;
    if (BLOG_FILTERS.some((f) => f.id === match.category)) setActiveFilter(match.category);
  }, [postParam]);

  useEffect(() => {
    if (!postParam || openedFor.current === postParam) return;
    const match = BLOG_POSTS.find((p) => String(p.id) === postParam);
    if (!match) return;

    const list =
      activeFilter === "all"
        ? BLOG_POSTS
        : BLOG_POSTS.filter((post) => post.category === activeFilter);
    const index = list.findIndex((post) => String(post.id) === postParam);
    if (index === -1) return;

    // Still behind "load more" — page it in and let the effect run again.
    if (index >= visibleCount) {
      setVisibleCount(Math.ceil((index + 1) / PAGE_SIZE) * PAGE_SIZE);
      return;
    }

    const card = document.getElementById("blog-card-" + postParam);
    if (!card) return;
    card.scrollIntoView({ behavior: "auto", block: "center" });

    openedFor.current = postParam;
    const timer = window.setTimeout(() => setSelectedPost(match), 550);
    return () => clearTimeout(timer);
  }, [postParam, activeFilter, visibleCount]);

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
      className="min-h-dvh"
      style={{
        // --blog-bg-stop1/2 are registered via @property in theme.css
        // specifically so this gradient can crossfade on theme toggle — a
        // plain isDark-ternary background (the old approach) snaps instantly
        // because unregistered custom-property/gradient swaps don't
        // interpolate.
        background: "linear-gradient(to bottom, var(--blog-bg-stop1) 0%, var(--blog-bg-stop2) 60%)",
        transition: "--blog-bg-stop1 var(--transition-slow), --blog-bg-stop2 var(--transition-slow)",
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
          style={{
            backgroundColor: isDark ? "#121B34" : "#E3E3E8",
            transition: "background-color var(--transition-slow)",
          }}
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
                  <motion.div
                    key={post.id}
                    id={`blog-card-${post.id}`}
                    className="scroll-mt-28"
                    variants={reduced ? undefined : fadeUp}
                  >
                    <BlogCard {...post} onClick={() => setSelectedPost(post)} />
                  </motion.div>
                ))}
              </motion.div>

              {hasMore && (
                <div className="flex justify-center mt-10">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    className="font-sans text-sm font-semibold px-6 py-2.5 min-h-11 rounded-full border border-border bg-elevated text-fg cursor-pointer transition-colors duration-200 hover:border-brand hover:text-brand"
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

      <AnimatePresence>
        {selectedPost && (
          <BlogPostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
