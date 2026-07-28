import { Construction, Radio } from "lucide-react";
import AeLogo from "@/components/ui/AeLogo";
import AmbientImage from "@/components/ui/AmbientImage";
import Button from "@/components/ui/Button";

/**
 * Image-led holding page. It preserves the site's under-construction status
 * while giving desktop and mobile visitors artwork tailored to their screens.
 */
export default function Home() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pb-24 pt-32">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, #161A50 0%, #07091C 72%)",
        }}
      />

      <AmbientImage
        src="/media/homepage-background-poster.jpg"
        mobileSrc="/media/homepage-mobile-poster.jpg"
        className="absolute inset-0"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(7, 9, 28, 0.42) 0%, rgba(7, 9, 28, 0.72) 55%, rgba(7, 9, 28, 0.96) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(75% 58% at 50% 44%, #000 0%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(75% 58% at 50% 44%, #000 0%, transparent 80%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[780px] text-center text-white">
        <AeLogo
          size={96}
          title=""
          variant="white"
          className="mx-auto mb-5"
          style={{ filter: "drop-shadow(0 12px 36px rgba(0, 0, 0, 0.45))" }}
        />

        <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#0D1035]/65 px-3.5 py-2 backdrop-blur-md">
          <Construction size={15} className="text-gold" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/75">
            Site in active development
          </span>
        </div>

        <p className="eyebrow mb-4 text-[#A7AAE0]">SUAS Competition Team</p>
        <h1 className="m-0 font-display text-[clamp(64px,12vw,118px)] font-extrabold leading-[0.86] tracking-[-0.03em] text-white">
          ALEX EAGLES
        </h1>
        <p className="mx-auto mb-8 mt-7 max-w-[610px] font-sans text-[clamp(16px,2.2vw,20px)] leading-[1.65] text-white/75">
          Alexandria University’s student UAV team — engineering, building, and
          flight-testing autonomous aircraft for international competition.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="primary" to="/blog">
            Watch the build log
          </Button>
          <Button
            variant="secondary"
            to="/team"
            className="border-white/35 text-white hover:border-brand hover:bg-brand"
          >
            Meet the team
          </Button>
        </div>
      </div>

      <div className="absolute bottom-7 left-6 z-10 hidden items-center gap-2 text-white/60 md:flex">
        <Radio size={14} className="text-gold" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
          Flight systems online · Alexandria, Egypt
        </span>
      </div>
    </section>
  );
}
