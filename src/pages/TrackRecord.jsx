import { useRef } from "react";
import { Link } from "react-router-dom";
import { AWARDS, AWARDS_FOOTNOTE } from "../data/home";
import { useReveal } from "../hooks/useReveal";
import "../styles/TrackRecord.css";

/**
 * "What we've won" — the season results, three cards plus the long tail as a
 * footnote. Replaces the old hardcoded "Latest Achievements" list.
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
            What we&rsquo;ve <span className="tr-headline-accent">won.</span>
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
          {AWARDS.map((award, i) => (
            <li
              className="tr-card"
              key={`${award.year}-${award.event}`}
              data-reveal=""
              data-reveal-delay={80 + i * 60}
            >
              <div className="tr-card-top">
                <span className="tr-card-year">{award.year}</span>
                <span className="tr-card-event">{award.event}</span>
              </div>

              <p className="tr-card-placement">{award.placement}</p>
              <h3 className="tr-card-title">{award.title}</h3>
              <p className="tr-card-blurb">{award.blurb}</p>
            </li>
          ))}
        </ul>

        <p className="tr-footnote" data-reveal="" data-reveal-delay="200">
          {AWARDS_FOOTNOTE}
        </p>
      </div>
    </section>
  );
}
