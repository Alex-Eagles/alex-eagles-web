import type { ReactNode } from "react";

/**
 * SectionHeader — the repeated "eyebrow → heading → gold bar" pattern that
 * opens most sections. Keeping it in one component guarantees every section
 * title looks identical.
 *
 *   <SectionHeader eyebrow="Who we are" title={<>Built by students,<br/>flown for excellence</>} />
 */

interface SectionHeaderProps {
  /** Small ALL-CAPS label above the heading. */
  eyebrow: string;
  /** The h2 text (accepts <br/> etc. for multi-line headlines). */
  title: ReactNode;
  /** Left-aligned by default; center for full-width sections. */
  align?: "left" | "center";
  className?: string;
}

export default function SectionHeader({
  eyebrow,
  title,
  align = "left",
  className = "",
}: SectionHeaderProps) {
  const isCenter = align === "center";

  return (
    <div className={`${isCenter ? "text-center" : ""} ${className}`.trim()}>
      {/* `.eyebrow` (global.css) enforces caps + letterspacing in one place. */}
      <div className="eyebrow mb-3">{eyebrow}</div>

      <h2 className="font-display font-bold text-h2 text-fg tracking-[-0.01em] m-0 leading-[1.05]">
        {title}
      </h2>

      {/* Short gold underline bar — the section-header signature. */}
      <div
        className={`h-0.5 w-12 bg-gold mt-3.5 ${isCenter ? "mx-auto" : ""}`}
      />
    </div>
  );
}
