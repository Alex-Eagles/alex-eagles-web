import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { BLOG_POSTS, CATEGORY_STYLE, CATEGORY_LABEL } from "@/data/blog";

/**
 * BlogPost — the single-post detail view opened by clicking a <BlogCard/>
 * on /blog. Reuses the card's own per-category palette (bg/accent/text/label
 * from `CATEGORY_STYLE`) inside a panel styled like the rest of the site, so
 * the two pages read as one consistent language.
 */
export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const { isDark } = useTheme();
  const post = BLOG_POSTS.find((p) => String(p.id) === id);

  if (!post) return <Navigate to="/blog" replace />;

  const style = CATEGORY_STYLE[post.category];
  const cardBg = isDark ? style.bg.dark : style.bg.light;
  const text = isDark ? style.text.dark : style.text.light;
  const label = isDark ? style.label.dark : style.label.light;

  return (
    <div
      className="min-h-dvh"
      style={{
        // --blog-bg-stop1/2 are registered via @property in theme.css so
        // this gradient can crossfade on theme toggle. Matches Blog.tsx's
        // root wrapper — see its comment for why a plain isDark-ternary
        // background doesn't transition smoothly.
        background: "linear-gradient(to bottom, var(--blog-bg-stop1) 0%, var(--blog-bg-stop2) 60%)",
        transition: "--blog-bg-stop1 var(--transition-slow), --blog-bg-stop2 var(--transition-slow)",
      }}
    >
      <div className="max-w-[820px] mx-auto px-6 pt-32 pb-24">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 font-sans text-sm font-semibold mb-8 text-fg-muted hover:text-fg transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        <div
          className="rounded-2xl border p-8 md:p-10"
          style={{
            backgroundColor: cardBg,
            borderColor: style.accent,
            transition: "background-color var(--transition-slow), border-color var(--transition-slow)",
          }}
        >
          <span
            className="inline-flex items-center rounded-full px-3 py-0.5 font-sans text-caption font-semibold mb-5"
            style={{ backgroundColor: style.accent, color: style.badgeText }}
          >
            {CATEGORY_LABEL[post.category]}
          </span>

          <h1
            className="font-display font-extrabold text-h1 leading-[1.05] tracking-[-0.02em] m-0 mb-5"
            style={{ color: text }}
          >
            {post.title}
          </h1>

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
        </div>
      </div>
    </div>
  );
}
