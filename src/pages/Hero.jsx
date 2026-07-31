import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { TICKER_RESULTS } from "../data/home";
import { useTheme } from "../context/ThemeContext";
import { useReveal } from "../hooks/useReveal";
import "../styles/Hero.css";

/**
 * One clip per theme: a daylight campus flight for light mode, a night flight
 * for dark. Both elements are in the DOM so the toggle can crossfade. The
 * active clip loads immediately; the other is warmed in the background once the
 * page goes idle, so the first toggle doesn't have to wait on a download (and
 * is skipped entirely on a metered or 2G connection).
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
   * Only a clip that has actually been shown gets a `src`/`poster`. An
   * un-requested element paints nothing, which is what keeps a swap clean: the
   * outgoing clip stays visible underneath until the incoming one has a real
   * frame to show, instead of fading to a black box.
   */
  const [requested, setRequested] = useState(() => ({ [active]: true }));
  useEffect(() => {
    setRequested((prev) => (prev[active] ? prev : { ...prev, [active]: true }));
  }, [active]);

  /*
   * Fetch the other theme's clip once the page has gone idle.
   *
   * Requesting it only at the moment of the toggle meant the first toggle
   * *started* the download — and for light mode that's a third-party origin, so
   * a DNS and TLS handshake before the first byte. The crossfade would run
   * against a clip that had nothing to show yet and the hero visibly stalled.
   * Warming it in the background makes the first toggle as instant as every
   * one after it.
   *
   * Deferred to idle rather than done up front so it never competes with the
   * visible clip, the poster, or anything else on the critical path — and
   * skipped outright on a metered or very slow connection, where a second video
   * nobody asked for is a real cost and a beat of lag is not.
   */
  useEffect(() => {
    const pending = Object.keys(HERO_MEDIA).filter((key) => !requested[key]);
    if (!pending.length) return;

    const link = navigator.connection;
    if (link?.saveData || /(^|-)2g$/.test(link?.effectiveType ?? "")) return;

    const warm = () =>
      setRequested((prev) => {
        const next = { ...prev };
        pending.forEach((key) => {
          next[key] = true;
        });
        return next;
      });

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(warm, { timeout: 4000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(warm, 2500);
    return () => window.clearTimeout(id);
  }, [requested]);

  /* Only the visible clip should be decoding frames — the one underneath is
     paused rather than left looping out of sight. This is also why the
     elements carry no `autoplay` attribute: a warmed clip would honour it and
     start playing behind the visible one the moment its data arrived. */
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
  }, [active, requested]);

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
        {Object.keys(HERO_MEDIA).map((key) => (
          <video
            key={key}
            ref={(el) => {
              videoRefs.current[key] = el;
            }}
            className="hero-media"
            data-active={key === active}
            src={requested[key] ? HERO_MEDIA[key].src : undefined}
            poster={requested[key] ? HERO_MEDIA[key].poster : undefined}
            muted
            loop
            playsInline
            /* Buffer a clip properly once it's been asked for — "metadata" left
               the warmed clip holding nothing but headers, which is the stall
               this is meant to remove. Playback is started imperatively above,
               not by an `autoplay` attribute. */
            preload={requested[key] ? "auto" : "none"}
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
