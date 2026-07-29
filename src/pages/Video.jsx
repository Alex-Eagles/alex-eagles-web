import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import "../styles/Video.css";

/**
 * The unlisted YouTube video's ID: the part after `v=` in its watch URL, e.g.
 * https://www.youtube.com/watch?v=dQw4w9WgXcQ → "dQw4w9WgXcQ".
 * Leave empty and the section shows a placeholder frame instead of a broken
 * embed. Unlisted videos embed exactly like public ones; private ones do not.
 */
const YOUTUBE_ID = "";

export default function Video() {
  return (
    <section className="video">
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
              the team.
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

        <div className="video-embed">
          {YOUTUBE_ID ? (
            <iframe
              className="video-embed-frame"
              src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}`}
              title="Alex Eagles flight footage"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="video-embed-placeholder">
              <span className="video-embed-icon" aria-hidden="true">
                <Play size={22} />
              </span>
              <p className="video-embed-label">Flight footage goes here</p>
              <p className="video-embed-hint">
                Set YOUTUBE_ID in Video.jsx to the unlisted video&rsquo;s ID
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
