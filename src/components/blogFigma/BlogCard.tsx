import GlassCard from "@/components/ui/GlassCard";
import { useTheme } from "@/context/ThemeContext";
import {
  CATEGORY_STYLE,
  CATEGORY_LABEL,
  type BlogPostFull,
  type CategoryStyle,
} from "@/data/blogFigma";

type BlogCardProps = Omit<BlogPostFull, "id">;

/**
 * BlogCard — post card for the Figma-sourced blog page: a cover photo with a
 * category badge, then title / meta / excerpt / footer styled to match the
 * home page's "Latest updates" cards (same title scale, label:value meta
 * rows, and the bordered footer with the date + decorative dots) so the two
 * pages read as one consistent card language.
 *
 * The whole card — photo, badge, and body alike — uses the post's fixed
 * `CATEGORY_STYLE` (accent/text/label straight from the subteam reference
 * sheet), not the site's theme tokens — those stay the same in light or
 * dark mode. Both themes render an opaque card — `bg.light` or `bg.dark` —
 * with no transparency or blur.
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
  const style = CATEGORY_STYLE[category];
  const { isDark } = useTheme();

  const cardStyle = {
    backgroundColor: isDark ? style.bg.dark : style.bg.light,
    borderColor: style.accent,
  };

  return (
    <GlassCard className="overflow-hidden flex flex-col h-full group" style={cardStyle}>
      {/* Cover photo + category badge — the one piece of chrome the home
          page's text-only cards don't need. */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={image}
          alt={`Cover image for "${title}"`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Category-color wash over the photo, matching the card's accent. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundColor: style.accent, opacity: 0.35, mixBlendMode: "multiply" }}
        />
        <span
          className="absolute top-4 right-4 inline-flex items-center rounded-full px-3 py-0.5 font-sans text-caption font-semibold"
          style={{ backgroundColor: style.accent, color: style.text }}
        >
          {CATEGORY_LABEL[category]}
        </span>
      </div>

      {/* Body — same padding, title scale, meta rows, and footer bar as
          <LatestUpdates/>'s cards, colored from the fixed category style. */}
      <div className="flex flex-col flex-1 p-[30px_28px_24px]">
        <h3
          className="font-display font-bold text-h3 leading-[1.02] tracking-[-0.01em] m-0 mb-4"
          style={{ color: style.text }}
        >
          {title}
        </h3>

        <div className="flex flex-col gap-1 mb-4">
          <Meta label="Author" value={author} style={style} />
          <Meta label="Read time" value={readTime} style={style} />
        </div>

        <p
          className="font-sans text-[15px] leading-[1.65] m-0 flex-1 line-clamp-3"
          style={{ color: style.text }}
        >
          {excerpt}
        </p>

        <div
          className="flex items-center justify-between mt-[22px] pt-[18px] border-t"
          style={{ borderColor: style.accent }}
        >
          <span
            className="font-mono text-[13px] tracking-[0.04em] uppercase font-semibold"
            style={{ color: style.label }}
          >
            {date}
          </span>
          <span aria-hidden="true" className="inline-flex items-center gap-1.5">
            <Dot color={style.label} />
            <Dot color={style.label} />
            <Dot color={style.label} />
          </span>
        </div>
      </div>
    </GlassCard>
  );
}

/* ---- internal helpers (mirrors LatestUpdates' Meta/Dot) ---- */

function Meta({ label, value, style }: { label: string; value: string; style: CategoryStyle }) {
  return (
    <span className="font-sans text-sm" style={{ color: style.label }}>
      {label}: <span className="font-semibold" style={{ color: style.text }}>{value}</span>
    </span>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: color }} />;
}
