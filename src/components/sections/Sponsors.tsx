import AeLogo from "@/components/ui/AeLogo";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SPONSORS } from "@/data/home";

/**
 * Sponsors — an auto-scrolling marquee of sponsor tiles over a faint,
 * parallaxing brand watermark. Tiles are grayscale by default and gain color
 * on hover; hovering the strip pauses the scroll.
 *
 * The list is rendered twice back-to-back so the -50% keyframe loop is seamless.
 */
export default function Sponsors() {
  const scrollY = useScrollPosition();
  const reduced = useReducedMotion();
  const watermarkShift = reduced ? undefined : `translateX(${-(scrollY * 0.05)}px)`;

  return (
    <section
      id="sponsors"
      className="relative py-[90px] overflow-hidden bg-canvas"
    >
      {/* Faint brand watermark, parallaxed. */}
      <AeLogo
        title=""
        size={900}
        className="absolute pointer-events-none text-fg"
        style={{
          top: "-30%",
          left: "50%",
          opacity: 0.04,
          transform: `translate(-50%, -50%) ${watermarkShift ?? ""}`,
        }}
      />

      {/* Heading. */}
      <div className="relative z-10 text-center mb-11 px-6">
        <div className="eyebrow mb-3">Backed by</div>
        <h2 className="font-display font-bold text-h2 text-fg tracking-[-0.01em] m-0">
          Our sponsors
        </h2>
      </div>

      {/* Marquee, edge-masked so tiles fade in/out at the sides. */}
      <div
        className="relative z-10"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
        }}
      >
        <div
          className="flex gap-6 w-max px-3 hover:[animation-play-state:paused]"
          style={{ animation: "ae-marquee 36s linear infinite" }}
        >
          {/* Two copies for a seamless loop. */}
          {[...SPONSORS, ...SPONSORS].map((sp, i) => (
            <div
              key={`${sp.name}-${i}`}
              className="flex-none w-[268px] h-[170px] rounded-[14px] bg-elevated border border-border flex flex-col items-center justify-center gap-3.5 p-6 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-[filter,opacity] duration-300"
            >
              <span className="font-display font-bold text-[30px] tracking-[0.02em] text-fg">
                {sp.name}
              </span>
              <span className="font-sans text-[13px] text-fg-secondary">{sp.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
