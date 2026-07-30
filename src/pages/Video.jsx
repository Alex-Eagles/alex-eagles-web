import { Link } from "react-router-dom";
import "../styles/Video.css";

/**
 * The YouTube video's ID: the part after `v=` in its watch URL, e.g.
 * https://www.youtube.com/watch?v=dQw4w9WgXcQ → "dQw4w9WgXcQ".
 */
const YOUTUBE_ID = "1K5YwEMZjnU";

export default function Video() {
  return (
    <section className="video">
      {/* Flight photo behind the copy column only (one per theme, picked in
          CSS), fading out before it reaches the embed on the right. */}
      <div className="video-photo" aria-hidden="true" />
      <div className="video-photo-scrim" aria-hidden="true" />

      <div className="video-layout">
        <div className="video-content">
          <div className="video-watermark" aria-hidden="true">
            <span className="video-watermark-year">2026</span>
            <span className="video-watermark-main">SUAS</span>
          </div>

          <div className="video-eyebrow">
            <span className="video-eyebrow-index">03</span>
            <span className="video-eyebrow-line" />
            <span className="video-eyebrow-label">Watch Us Fly</span>
          </div>

          <h2 className="video-headline">
            <span className="video-headline-line">Built in-house.</span>
            <span className="video-headline-line video-headline-accent">
              Flown by
            </span>
            <span className="video-headline-line video-headline-accent">
              the team
            </span>
          </h2>

          <p className="video-copy">
            Every flight you see is the same aircraft our subsystems built from
            scratch: airframe, avionics, and autonomy stack, engineered
            in-house from the ground up.
          </p>

          <Link to="/vehicles" className="video-cta">
            Explore Our Vehicle →
          </Link>
        </div>

        {/* nocookie host: same embed, but YouTube holds off on tracking
            cookies until someone actually presses play. */}
        <div className="video-embed">
          <iframe
            className="video-embed-frame"
            src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}`}
            title="Alex Eagles flight footage"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
