import GlassCard from "@/components/ui/GlassCard";
import { useTheme } from "@/context/ThemeContext";
import { CATEGORY_STYLE, CATEGORY_LABEL, type BlogPostFull } from "@/data/blog";

interface BlogCardProps extends BlogPostFull {
  /** Opens the post in the focused <BlogPostModal/> instead of navigating away. */
  onClick: () => void;
}

/**
 * BlogCard — post card for the Figma-sourced blog page: a cover photo with a
 * category badge, then title / meta / excerpt / footer styled to match the
 * home page's "Latest updates" cards (same title scale, label:value meta
 * rows, and the bordered footer with the date) so the two pages read as one
 * consistent card language. The whole card links through to its detail page
 * at `/blog/:id`.
 *
 * Card surface/text pull from the post's `CATEGORY_STYLE`, switching between
 * its `light`/`dark` tint per the site's theme toggle — `bg.dark` is a true
 * deep tone (not just a grayed pastel), so dark mode reads as genuinely dark.
 */
export default function BlogCard({
  title,
  excerpt,
  image,
  imageFit = "cover",
  category,
  date,
  readTime,
  onClick,
}: BlogCardProps) {
  const style = CATEGORY_STYLE[category];
  const { isDark } = useTheme();

  const text = isDark ? style.text.dark : style.text.light;
  const label = isDark ? style.label.dark : style.label.light;

  const cardStyle = {
    backgroundColor: isDark ? style.bg.dark : style.bg.light,
    borderColor: style.accent,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full h-full text-left appearance-none bg-transparent border-0 p-0 m-0 cursor-pointer"
      aria-label={`Read "${title}"`}
    >
      <GlassCard className="overflow-hidden flex flex-col h-full group" style={cardStyle}>
        {/* Cover photo + category badge — the one piece of chrome the home
            page's text-only cards don't need. */}
        <div className="relative h-56 overflow-hidden">
          {imageFit === "contain" && (
            <div aria-hidden="true" className="absolute inset-0 bg-white" />
          )}
          <img
            src={image}
            alt={`Cover image for "${title}"`}
            loading="lazy"
            className={
              imageFit === "contain"
                ? "relative w-full h-full object-contain p-10 transition-transform duration-300 group-hover:scale-105"
                : "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            }
          />
          {/* Bottom scrim — darkens the photo just enough for the badge and
              the card's dark surface to read as one continuous surface,
              instead of a flat color-multiply tint over the whole shot. */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0) 65%)",
            }}
          />
          <span
            className="absolute top-4 right-4 inline-flex items-center rounded-full px-3 py-0.5 font-sans text-caption font-semibold"
            style={{ backgroundColor: style.accent, color: style.badgeText }}
          >
            {CATEGORY_LABEL[category]}
          </span>
        </div>

        {/* Body — same padding, title scale, meta rows, and footer bar as
            <LatestUpdates/>'s cards, colored from the fixed category style. */}
        <div className="flex flex-col flex-1 p-[30px_28px_24px]">
          <h3
            className="font-display font-bold text-h3 leading-[1.02] tracking-[-0.01em] m-0 mb-4"
            style={{ color: text }}
          >
            {title}
          </h3>

          <div className="flex flex-col gap-1 mb-4">
            <Meta label="Read time" value={readTime} text={text} labelColor={label} />
          </div>

          <p
            className="font-sans text-[15px] leading-[1.65] m-0 flex-1 line-clamp-3"
            style={{ color: text }}
          >
            {excerpt}
          </p>

          <div className="mt-[22px] pt-[18px] border-t" style={{ borderColor: style.accent }}>
            <span
              className="font-mono text-[13px] tracking-[0.04em] uppercase font-semibold"
              style={{ color: label }}
            >
              {date}
            </span>
          </div>
        </div>
      </GlassCard>
    </button>
  );
}

/* ---- internal helpers (mirrors LatestUpdates' Meta) ---- */

function Meta({
  label,
  value,
  text,
  labelColor,
}: {
  label: string;
  value: string;
  text: string;
  labelColor: string;
}) {
  return (
    <span className="font-sans text-sm" style={{ color: labelColor }}>
      {label}: <span className="font-semibold" style={{ color: text }}>{value}</span>
    </span>
  );
}
