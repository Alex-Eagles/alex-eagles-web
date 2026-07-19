import { Calendar, Clock, User } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import type { BlogPostFull } from "@/data/blogFigma";

type BlogCardProps = Omit<BlogPostFull, "id">;

/**
 * BlogCard — post card for the Figma-sourced blog page: cover photo with a
 * category badge, title, excerpt, and an author/date/read-time meta row.
 * Built on the site's <GlassCard/> primitive (same surface + hover-lift used
 * for sponsor tiles and the home page's "Latest updates" cards) instead of
 * the design export's ad-hoc `bg-white/5` styling.
 */
export default function BlogCard({
  title,
  excerpt,
  image,
  category,
  date,
  author,
  readTime,
}: BlogCardProps) {
  return (
    <GlassCard className="overflow-hidden flex flex-col h-full group">
      <div className="relative h-56 overflow-hidden">
        <img
          src={image}
          alt={`Cover image for "${title}"`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute top-4 right-4 inline-flex items-center rounded-md bg-sky px-2 py-0.5 font-sans text-caption font-semibold text-[#0B1020]">
          {category}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-6">
        <h3 className="font-display font-bold text-h4 leading-snug tracking-[-0.01em] m-0 mb-3 text-fg transition-colors duration-200 group-hover:text-brand-light">
          {title}
        </h3>
        <p className="font-sans text-small leading-[1.6] text-fg-muted m-0 mb-5 line-clamp-2">
          {excerpt}
        </p>

        <div className="mt-auto flex flex-wrap gap-4 font-sans text-caption text-fg-subtle">
          <span className="flex items-center gap-1.5">
            <User size={14} />
            {author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {readTime}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
