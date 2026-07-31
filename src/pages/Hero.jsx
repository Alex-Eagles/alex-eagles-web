import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { TICKER_RESULTS } from "../data/home";
import { useTheme } from "../context/ThemeContext";
import { useReveal } from "../hooks/useReveal";
import "../styles/Hero.css";

/**
 * One clip per theme: a daylight campus flight for light mode, a night flight
 * for dark. Both are stacked in the DOM and both load up front, so switching
 * theme reveals a clip that already has frames rather than starting a download.
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
  const active = HERO_MEDIA[theme] ? theme : "dark";

  /*
   * Both clips are their own <video> element, stacked, and the theme toggle
   * crossfades between them (see .hero-media in Hero.css).
   *
   * This used to be a single <video> keyed on the theme, which remounted the
   * element on every toggle: the old clip left the DOM in the same frame the
   * new one entered it, so there was nothing to fade from and the hero cut
   * while the rest of the page crossfaded around it.
   *
   * Both clips load from the first render.
   *
   * Earlier versions fetched the second one lazily — at the moment of the
   * toggle, then on an idle callback — to save a visitor who never switches a
   * download. Both still lagged: at the toggle the swap waited on the whole
   * download (and for light mode that's a third-party origin, so DNS and TLS
   * before the first byte), and the idle version simply lost the race whenever
   * someone toggled early or the callback hadn't fired.
   *
   * There is no clever version of this. A clip can only appear instantly if its
   * data is already there, so both are fetched up front and the toggle is
   * guaranteed to be immediate. That costs one extra video for visitors who
   * never switch themes, which is the deliberate trade.
   */
  const mediaKeys = Object.keys(HERO_MEDIA);

  /*
   * The clip that isn't showing is kept loaded but paused — not playing.
   *
   * Paused is enough for an instant swap: once a video has data it paints its
   * current frame, so the incoming clip is already showing real footage the
   * moment it's revealed, and resuming a buffered video costs a frame. Leaving
   * both playing would look identical and risks far more — iOS has historically
   * allowed only one inline video to play at a time, and a hidden clip that
   * steals playback from the visible one is a worse bug than any it fixes.
   *
   * Also why there's no `autoplay` attribute: playback is started here, for the
   * visible clip only.
   */
  const videoRefs = useRef({});
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([key, el]) => {
      if (!el) return;
      if (key !== active) {
        el.pause();
        return;
      }
      // Autoplay can be refused (low power mode, a paused-media preference);
      // the poster stays up in that case, so there's nothing to recover from.
      const playing = el.play();
      if (playing && playing.catch) playing.catch(() => {});
    });
  }, [active]);

  const scrollToAbout = () => {
    document.querySelector(".features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hero" ref={rootRef}>
      {/* Muted, looping flight footage. The poster paints immediately so the
          hero is never a black rectangle while the file buffers. The wrapper
          keeps the clips' crossfade z-index from escaping over the scrim and
          the headline — see .hero-media-stack in Hero.css. */}
      <div className="hero-media-stack" aria-hidden="true">
        {mediaKeys.map((key) => (
          <video
            key={key}
            ref={(el) => {
              videoRefs.current[key] = el;
            }}
            className="hero-media"
            data-active={key === active}
            src={HERO_MEDIA[key].src}
            poster={HERO_MEDIA[key].poster}
            muted
            loop
            playsInline
            /* "auto", not "metadata": metadata fetches headers and stops, which
               leaves the hidden clip with nothing to paint and is exactly the
               stall this is meant to remove. */
            preload="auto"
          />
        ))}
      </div>
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
