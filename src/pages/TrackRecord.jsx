import { useRef } from "react";
import { Link } from "react-router-dom";
import { AWARD_YEARS_LATEST_FIRST } from "../data/home";
import { useReveal } from "../hooks/useReveal";
import "../styles/TrackRecord.css";

/**
 * "What we've won" — every competition result, newest season first, one card
 * per year. A year that won more than once lists each award on its own line.
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
          {AWARD_YEARS_LATEST_FIRST.map(({ year, awards }, i) => (
            <li
              className="tr-card"
              key={year}
              data-reveal=""
              /* Cap the stagger so the last cards don't sit visibly waiting. */
              data-reveal-delay={Math.min(80 + i * 50, 320)}
            >
              <span className="tr-card-year">{year}</span>

              <ul className="tr-card-awards">
                {awards.map((award) => (
                  <li
                    className="tr-card-award"
                    key={`${award.title}-${award.competition}`}
                  >
                    {award.place && (
                      <span className="tr-card-place">{award.place}</span>
                    )}
                    <span className="tr-card-title">{award.title}</span>
                    <span className="tr-card-event">{award.competition}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
