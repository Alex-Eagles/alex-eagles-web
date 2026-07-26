import { useEffect } from "react";
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

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
        className="relative w-full max-w-[820px] max-h-[85vh] overflow-y-auto rounded-2xl border p-8 md:p-10 shadow-2xl"
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
          className="absolute top-5 right-5 md:top-6 md:right-6 inline-flex items-center justify-center w-9 h-9 rounded-full transition-opacity duration-200 hover:opacity-70"
          style={{ backgroundColor: style.accent, color: style.badgeText }}
        >
          <X className="w-4 h-4" />
        </button>

        <span
          className="inline-flex items-center rounded-full px-3 py-0.5 font-sans text-caption font-semibold mb-5"
          style={{ backgroundColor: style.accent, color: style.badgeText }}
        >
          {CATEGORY_LABEL[post.category]}
        </span>

        <h2
          className="font-display font-extrabold text-h1 leading-[1.05] tracking-[-0.02em] m-0 mb-5 pr-10"
          style={{ color: text }}
        >
          {post.title}
        </h2>

        <div
          className="mb-8 font-mono text-[13px] tracking-[0.04em] uppercase font-semibold"
          style={{ color: label }}
        >
          {post.date} · {post.readTime}
        </div>

        <div className="rounded-xl overflow-hidden mb-8">
          <img
            src={post.image}
            alt={`Cover image for "${post.title}"`}
            className={
              post.imageFit === "contain"
                ? "w-full h-auto object-contain p-10 bg-white"
                : "w-full h-[340px] md:h-[420px] object-cover"
            }
          />
        </div>

        <p className="font-sans text-body-lg leading-[1.75] m-0" style={{ color: text }}>
          {post.excerpt}
        </p>
      </motion.div>
    </div>
  );
}
