import { Link } from "react-router-dom";
import "../styles/Video.css";

export default function Video() {
  return (
    <section className="video">
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
          scratch — airframe, avionics, and autonomy stack, engineered
          in-house from the ground up.
        </p>

        <Link to="/vehicles" className="video-cta">
          Explore Our Vehicle →
        </Link>
      </div>
    </section>
  );
}
