import { ChevronDown } from "lucide-react";
import AeLogo from "@/components/ui/AeLogo";
import AmbientVideo from "@/components/ui/AmbientVideo";
import Button from "@/components/ui/Button";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Hero — the full-viewport opening section.
 *
 * Layering (back → front):
 *   1. Radial brand gradient      — always present; also the fallback if no
 *                                    video file is provided.
 *   2. Drone background video      — muted / autoplay / loop.
 *   3. Darkening overlay           — keeps headline text readable over video.
 *   4. Animated indigo grid        — subtle aerospace texture.
 *   5. Bottom fade into the page.
 *   6. Floating brand crest + copy — parallaxes gently on scroll.
 */
export default function Hero() {
  const scrollY = useScrollPosition();
  const reduced = useReducedMotion();

  // Gentle parallax; disabled when the visitor prefers reduced motion.
  const contentParallax = reduced ? undefined : `translateY(${scrollY * 0.12}px)`;

  return (
    <header className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 1. Base radial gradient (also the no-video fallback). */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, #161A50 0%, #0A0D2B 45%, var(--bg-primary) 100%)",
        }}
      />

      {/* 2. Drone background video. */}
      <AmbientVideo
        src="/media/homepage-background.mp4"
        poster="/media/homepage-background-poster.jpg"
        mobileSrc="/media/homepage-mobile.mp4"
        mobilePoster="/media/homepage-mobile-poster.jpg"
        label="homepage background video"
        className="absolute inset-0"
        preload="auto"
        controlClassName="bottom-6 right-6 md:bottom-8 md:right-8"
      />

      {/* 3. Darkening overlay for text contrast over the video. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(7,9,28,0.55) 0%, rgba(7,9,28,0.85) 100%)",
        }}
      />

      {/* 4. Animated indigo grid texture, masked to a soft vignette. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.5,
          animation: reduced ? "none" : "ae-grid 16s linear infinite",
          maskImage:
            "radial-gradient(80% 60% at 50% 35%, #000 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(80% 60% at 50% 35%, #000 0%, transparent 75%)",
        }}
      />

      {/* 5. Bottom fade blends the hero into the page background. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(7,9,28,0) 55%, var(--bg-primary) 100%)",
        }}
      />

      {/* 6. Foreground content (parallaxed). */}
      <div
        className="relative z-10 text-center px-6 max-w-[900px]"
        style={{ transform: contentParallax }}
      >
        {/* Floating brand crest. */}
        <div className="flex justify-center mb-4">
          <AeLogo
            size={92}
            title=""
            variant="white"
            style={{
              filter: "drop-shadow(0 12px 40px var(--brand-glow))",
              animation: reduced ? "none" : "ae-float 6s ease-in-out infinite",
            }}
          />
        </div>

        <div className="eyebrow mb-4" style={{ color: "#8B8FC8" }}>
          SUAS Competition 2025
        </div>

        <h1
          className="font-display font-extrabold leading-none tracking-[-0.02em] m-0 mb-5 pb-1"
          style={{ fontSize: "var(--text-hero)", color: "#F0F2FF" }}
        >
          ALEX EAGLES
        </h1>

        <p
          className="font-sans font-normal mx-auto mb-9 leading-[1.6]"
          style={{
            fontSize: "clamp(16px, 2.2vw, 20px)",
            color: "#B7BAE0",
            maxWidth: "560px",
          }}
        >
          Alexandria University’s Unmanned Aerial Systems team — engineering
          precision flight for the SUAS competition.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Button variant="primary" to="/vehicles">
            Explore our vehicle
          </Button>
          <Button variant="secondary" to="/team">
            Meet the team
          </Button>
        </div>
      </div>

      {/* Scroll indicator. */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5">
        <span className="font-sans text-[11px] tracking-[0.16em] uppercase text-fg-subtle">
          Scroll
        </span>
        <ChevronDown
          size={22}
          className="text-fg-subtle"
          style={{
            animation: reduced ? "none" : "ae-bounce 1.8s ease-in-out infinite",
          }}
        />
      </div>
    </header>
  );
}
