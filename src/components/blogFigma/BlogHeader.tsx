/**
 * BlogHeader — the "Alex Eagles / Blogs" title block for the Figma-sourced
 * blog page. Layout/copy come from the design export; typography and color
 * come entirely from the site's own tokens (`.eyebrow`, `font-display`,
 * `text-fg` / `text-fg-muted`) so it reads as native to the rest of the site
 * and adapts correctly with the light/dark toggle.
 */
export default function BlogHeader() {
  return (
    <div className="text-center mb-12">
      <div className="eyebrow mb-3">Alex Eagles</div>

      <h1 className="font-display font-extrabold text-6xl md:text-8xl leading-none tracking-[-0.02em] mb-4 text-fg">
        Blogs
      </h1>

      <p className="font-sans text-body-lg text-fg-muted italic mt-6">
        “Technical stories, flight tests & innovations from the team”
      </p>
    </div>
  );
}
