import { useRef } from "react";
import { Link } from "react-router-dom";
import { FEATURED_AWARDS } from "../data/home";
import { useReveal } from "../hooks/useReveal";
import "../styles/TrackRecord.css";

/**
 * "What we've won" — the three results from the latest season, one per card.
 * The full record is a click away rather than laid out here.
 */
export default function TrackRecord() {
  const rootRef = useRef(null);
  useReveal(rootRef);

  return (
    <section className="tr-section" ref={rootRef}>
      <div className="tr-layout">
        <div className="tr-eyebrow" data-reveal="">
          <span className="tr-eyebrow-index">04</span>
          <span className="tr-eyebrow-line" />
          <span className="tr-eyebrow-label">Track record</span>
        </div>

        <div className="tr-head">
          <h2 className="tr-headline" data-reveal="" data-reveal-delay="60">
            What we&rsquo;ve <span className="tr-headline-accent">won</span>
          </h2>

          <Link
            to="/history"
            className="tr-cta"
            data-reveal=""
            data-reveal-delay="160"
          >
            Full history →
          </Link>
        </div>

        <ul className="tr-grid">
          {FEATURED_AWARDS.map((award, i) => (
            <li
              className="tr-card"
              key={`${award.title}-${award.competition}-${award.year}`}
              data-reveal=""
              data-reveal-delay={80 + i * 90}
            >
              <span className="tr-card-event">
                {award.competition} · {award.year}
              </span>

              <span className="tr-card-title">
                {award.place && (
                  <span className="tr-card-place">{award.place} </span>
                )}
                {award.title}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
