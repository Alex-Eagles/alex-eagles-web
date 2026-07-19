import { Calendar, Clock, User } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { CATEGORY_META, type BlogPost } from "@/data/blog";

/**
 * BlogCard — a single build-log post as an elevated glass card: cover banner
 * with a category badge, then title, excerpt, and a meta row (author / date /
 * read time). When a post has no `image`, the banner falls back to a branded
 * gradient with the category icon so the layout still reads as intentional.
 *
 * The card uses GlassCard's default hover-lift, matching the Home page's
 * "Latest updates" cards for a consistent feel across the site.
 */
export default function BlogCard({ post }: { post: BlogPost }) {
  const { title, excerpt, image, category, date, author, readTime } = post;
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;

  return (
    <GlassCard className="overflow-hidden flex flex-col h-full group">
      {/* Cover banner (image, or branded gradient fallback). */}
      <div className="relative h-52 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={`Cover image for “${title}”`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden="true"
            className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${meta.accent}33 0%, var(--bg-elevated) 70%)`,
            }}
          >
            <Icon size={56} strokeWidth={1.25} style={{ color: meta.accent, opacity: 0.55 }} />
          </div>
        )}

        {/* Category badge. Dark text on the light accent reads in both themes. */}
        <span
          className="absolute top-4 right-4 inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold"
          style={{ background: meta.accent, color: "#0B1020" }}
        >
          {meta.label}
        </span>
      </div>

      {/* Body. */}
      <div className="flex flex-col flex-1 p-6">
        <h3 className="font-display font-bold text-h4 leading-snug tracking-[-0.01em] m-0 mb-3 text-fg transition-colors duration-200 group-hover:text-brand-light">
          {title}
        </h3>

        <p className="font-sans text-small leading-[1.6] text-fg-muted m-0 mb-5 line-clamp-3">
          {excerpt}
        </p>

        <div className="mt-auto pt-4 border-t border-border flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-fg-subtle">
          <span className="inline-flex items-center gap-1.5">
            <User size={14} aria-hidden="true" />
            {author}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} aria-hidden="true" />
            {date}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} aria-hidden="true" />
            {readTime}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
