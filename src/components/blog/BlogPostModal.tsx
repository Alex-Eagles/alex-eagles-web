import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CATEGORY_STYLE, CATEGORY_LABEL, type BlogPostFull } from "@/data/blog";

interface BlogPostModalProps {
  post: BlogPostFull;
  onClose: () => void;
}

/**
 * BlogPostModal — the focused lightbox opened when a <BlogCard/> on /blog
 * is clicked: the grid behind it dims and blurs while this panel holds the
 * full post front and center, closing on backdrop click, the X, or Escape.
 * Reuses the same per-category palette as the card/detail page.
 */
export default function BlogPostModal({ post, onClose }: BlogPostModalProps) {
  const { isDark } = useTheme();
  const style = CATEGORY_STYLE[post.category];
  const cardBg = isDark ? style.bg.dark : style.bg.light;
  const text = isDark ? style.text.dark : style.text.light;
  const label = isDark ? style.label.dark : style.label.light;

  // Read through a ref so the scroll-lock effect below can run exactly once
  // per open. Blog builds a fresh `onClose` on every render, and listing it
  // as a dependency made the effect tear down and re-arm the body lock on
  // unrelated re-renders (theme toggle, filter change, the close itself).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Locks background scroll for the lifetime of the modal. `overflow:hidden`
  // alone doesn't stop touch-scroll on iOS Safari when a fixed overlay sits
  // on top, so the body is pinned in place with `position:fixed` instead —
  // the standard workaround — and the scroll position is restored on close.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);

    const scrollY = window.scrollY;
    const body = document.body;
    const root = document.documentElement;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);

      // Unpinning the body drops the document back to scroll offset 0, so the
      // scrollTo below is what puts the reader back where they were. Under the
      // global `html { scroll-behavior: smooth }` that restore *animates* —
      // the page visibly rewinds to the top and scrolls back down every time
      // the modal closes. Suspend smooth scrolling across the restore (inline
      // style outranks the stylesheet rule) so it snaps instead, leaving the
      // exact screen the reader left. Restored right after, so anchor links
      // elsewhere keep their smooth scrolling.
      const prevScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
      root.style.scrollBehavior = prevScrollBehavior;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
    >
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      <motion.div
        className="relative w-full max-w-[720px] max-h-[85dvh] rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: cardBg, borderColor: style.accent }}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute z-10 top-4 right-4 md:top-5 md:right-5 inline-flex items-center justify-center w-11 h-11 rounded-full transition-opacity duration-200 hover:opacity-70"
          style={{ backgroundColor: style.accent, color: style.badgeText }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrolls internally when a post's content is taller than the
            viewport, instead of clipping — the close button above stays
            fixed in place since it lives outside this scroll container. */}
        <div className="h-full max-h-[85dvh] overflow-y-auto overscroll-contain p-6 md:p-8">
          <span
            className="inline-flex items-center rounded-full px-3 py-0.5 font-sans text-caption font-semibold mb-3"
            style={{ backgroundColor: style.accent, color: style.badgeText }}
          >
            {CATEGORY_LABEL[post.category]}
          </span>

          <h2
            className="font-display font-bold text-h3 leading-[1.05] tracking-[-0.01em] m-0 mb-3 pr-10"
            style={{ color: text }}
          >
            {post.title}
          </h2>

          <div
            className="mb-4 font-mono text-[13px] tracking-[0.04em] uppercase font-semibold"
            style={{ color: label }}
          >
            {post.date} · {post.readTime}
          </div>

          <div className="rounded-xl overflow-hidden mb-4">
            <img
              src={post.image}
              alt={`Cover image for "${post.title}"`}
              className={
                post.imageFit === "contain"
                  ? "w-full h-auto max-h-[220px] object-contain p-6 bg-white"
                  : "w-full h-[200px] md:h-[240px] object-cover"
              }
            />
          </div>

          <p className="font-sans text-[15px] leading-[1.65] m-0" style={{ color: text }}>
            {post.excerpt}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
