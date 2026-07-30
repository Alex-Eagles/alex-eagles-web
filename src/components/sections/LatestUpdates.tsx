import { motion } from "framer-motion";
import SectionHeader from "@/components/ui/SectionHeader";
import Button from "@/components/ui/Button";
import GlassCard from "@/components/ui/GlassCard";
import { fadeUp, staggerParent, viewportOnce } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { LATEST_POSTS } from "@/data/home";

/**
 * LatestUpdates — the three most recent build-log posts, presented as glass
 * cards on an elevated "canvas". Cards fade up in a stagger as they scroll in.
 */
export default function LatestUpdates() {
  const reduced = useReducedMotion();

  return (
    <section id="blog" className="bg-surface py-24 px-6">
      <div className="max-w-[var(--maxw-content)] mx-auto">
        {/* Header row: title on the left, CTA on the right. */}
        <div className="flex items-end justify-between flex-wrap gap-5 mb-9">
          <SectionHeader eyebrow="From the build log" title="Latest updates" />
          <Button variant="primary" to="/blog">
            View all updates
          </Button>
        </div>

        {/* Canvas behind the cards. */}
        <div className="bg-elevated border border-border rounded-2xl p-[30px] shadow-[var(--elevation-2)]">
          <motion.div
            className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            variants={reduced ? undefined : staggerParent}
            initial={reduced ? undefined : "hidden"}
            whileInView={reduced ? undefined : "visible"}
            viewport={viewportOnce}
          >
            {LATEST_POSTS.map((post) => (
              <motion.div key={post.title} variants={reduced ? undefined : fadeUp}>
                <GlassCard className="relative p-[30px_28px_24px] flex flex-col min-h-[340px] h-full">
                  {/* Subteam accent dot. */}
                  <span
                    aria-hidden="true"
                    className="absolute top-6 right-6 w-2.5 h-2.5 rounded-full"
                    style={{
                      background: post.dotColor,
                      boxShadow: `0 0 10px ${post.dotColor}`,
                    }}
                  />

                  <h3 className="font-display font-bold text-[33px] leading-[1.02] tracking-[-0.01em] m-0 mr-4 mb-4 text-fg">
                    {post.title}
                  </h3>

                  <div className="flex flex-col gap-1 mb-4">
                    <Meta label="Subteam" value={post.subteam} />
                    <Meta label="Author" value={post.author} />
                  </div>

                  <p className="font-sans text-[15px] leading-[1.65] text-fg-secondary m-0 flex-1 line-clamp-4">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between mt-[22px] pt-[18px] border-t border-border">
                    <span className="font-mono text-[13px] tracking-[0.04em] uppercase text-fg-muted font-medium">
                      {post.date}
                    </span>
                    <span aria-hidden="true" className="inline-flex items-center gap-1.5">
                      <Dot />
                      <Dot />
                      <Dot />
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---- internal helpers ---- */

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="font-sans text-sm text-fg-secondary">
      {label}: <span className="text-fg font-semibold">{value}</span>
    </span>
  );
}

function Dot() {
  return <span className="w-[5px] h-[5px] rounded-full bg-[var(--text-muted)]" />;
}
