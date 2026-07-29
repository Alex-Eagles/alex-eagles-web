import { useRef } from "react";
import { Link } from "react-router-dom";
import { useReveal } from "../hooks/useReveal";
import "../styles/Hero.css";

/**
 * Results that scroll along the bottom edge of the hero. The list is rendered
 * twice in the markup so the rail can loop by translating exactly -50% — the
 * second copy is what's on screen while the first wraps around.
 */
const TICKER = [
  "1st Design & Presentation · SUAS 2025",
  "5th Overall · UAVC 2025",
  "1st Design · SAE Aerodesign 2022",
  "Best Use of Science · NASA Space Apps",
];

export default function Hero() {
  const rootRef = useRef(null);
  useReveal(rootRef);

  const scrollToAbout = () => {
    document.querySelector(".features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hero" ref={rootRef}>
      {/* Backdrop. The design calls for the fisheye flight clip here — drop the
          file into public/ and swap this <img> for a muted, looping, autoplay
          <video> with the same class; the scrim and layout need no changes. */}
      <img className="hero-media" src="/drone.jpg" alt="" aria-hidden="true" />
      <div className="hero-scrim" aria-hidden="true" />

      <div className="hero-body">
        <p className="hero-eyebrow" data-reveal="">
          <span className="hero-eyebrow-rule" aria-hidden="true" />
          Alexandria University · UAV Team · Est. 2013
        </p>

        <h1 className="hero-title" data-reveal="" data-reveal-delay="80">
          Alex Eagles
        </h1>

        <p className="hero-lede" data-reveal="" data-reveal-delay="160">
          Students who design, build and fly autonomous aircraft — airframe,
          avionics and autonomy, all made in-house.
        </p>

        <div className="hero-actions" data-reveal="" data-reveal-delay="240">
          <Link className="hero-cta hero-cta--solid" to="/vehicles">
            See the aircraft
          </Link>
          <button
            type="button"
            className="hero-cta hero-cta--ghost"
            onClick={scrollToAbout}
          >
            Who we are
          </button>
        </div>
      </div>

      <div className="hero-scroll" aria-hidden="true">
        Scroll
        <span className="hero-scroll-track">
          <span className="hero-scroll-bar" />
        </span>
      </div>

      {/* Decorative: every result here is also stated as real text in the
          "What we've won" section, so hiding the duplicated rail from screen
          readers avoids announcing the same awards three times over. */}
      <div className="hero-ticker" aria-hidden="true">
        <div className="hero-ticker-rail">
          {[0, 1].map((copy) => (
            <div className="hero-ticker-row" key={copy}>
              {TICKER.map((result) => (
                <span className="hero-ticker-item" key={result}>
                  {result}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
