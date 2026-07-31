import { useRef } from "react";
import { Link } from "react-router-dom";
import { TICKER_RESULTS } from "../data/home";
import { useTheme } from "../context/ThemeContext";
import { useReveal } from "../hooks/useReveal";
import "../styles/Hero.css";

/**
 * One clip per theme: a daylight campus flight for light mode, a night flight
 * for dark. Only the active one is ever in the DOM, so a visitor downloads a
 * single video rather than both.
 */
const CLOUDINARY = "https://res.cloudinary.com/deqkkrtk/video/upload";

/* Posters stay local and unversioned: they are ~30-90KB, they are what paints
 * on first frame, and serving them from our own origin avoids a third-party
 * DNS + TLS round trip before the hero has anything to show.
 *
 * The light clip is delivered without a q_auto/f_auto transformation on
 * purpose. It was already encoded at CRF 30 before upload, and Cloudinary's
 * auto-quality re-encodes it UPWARD from that: measured 3.02MB -> 3.74MB.
 *
 * The dark clip is served locally at 1080p/CRF 21 (a reversed flight-in
 * clip) rather than from Cloudinary, since it isn't part of that account. */
const HERO_MEDIA = {
  dark: {
    src: "/media/hero-night.mp4",
    poster: "/Home/hero-night-poster.jpg",
  },
  light: {
    src: `${CLOUDINARY}/v1785383038/hero-light_hnajae.mp4`,
    poster: "/Home/hero-light-poster.jpg",
  },
};

export default function Hero() {
  const rootRef = useRef(null);
  useReveal(rootRef);

  const { theme } = useTheme();
  const media = HERO_MEDIA[theme] ?? HERO_MEDIA.dark;

  const scrollToAbout = () => {
    document.querySelector(".features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hero" ref={rootRef}>
      {/* Muted, looping flight footage. The poster paints immediately so the
          hero is never a black rectangle while the file buffers. Keyed by
          theme so switching modes remounts the element and actually loads the
          other clip, rather than leaving the old one decoded in place. */}
      <video
        key={theme}
        className="hero-media"
        src={media.src}
        poster={media.poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <div className="hero-scrim" aria-hidden="true" />

      <div className="hero-body">
        <p className="hero-eyebrow" data-reveal="">
          <span className="hero-eyebrow-rule" aria-hidden="true" />
          Alexandria University · UAV Team · Est. 2013
        </p>

        <h1 className="hero-title" data-reveal="" data-reveal-delay="80">
          Alex Eagles
        </h1>

        <div className="hero-actions" data-reveal="" data-reveal-delay="160">
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
              {TICKER_RESULTS.map((result) => (
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
