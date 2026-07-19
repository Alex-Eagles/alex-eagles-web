/**
 * BlogHeader — the Blog page hero: eyebrow, oversized display title, and a
 * one-line intro, over the same brand-grid backdrop used by the hero and the
 * ComingSoon template. Purely presentational.
 */
export default function BlogHeader() {
  return (
    <header className="relative overflow-hidden px-6 pt-32 pb-16 text-center">
      {/* Subtle brand grid backdrop (matches the hero texture). */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(70% 70% at 50% 40%, #000 0%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(70% 70% at 50% 40%, #000 0%, transparent 78%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[var(--maxw-content)]">
        <div className="eyebrow mb-4">Alex Eagles</div>

        <h1 className="font-display font-extrabold text-hero text-fg leading-none tracking-[-0.02em] m-0">
          Blog
        </h1>

        <p className="font-sans text-body-lg text-fg-muted leading-[1.7] mx-auto mt-6 prose-measure">
          Technical stories, flight tests, and innovations from the team — the
          build log behind every subteam.
        </p>
      </div>
    </header>
  );
}
