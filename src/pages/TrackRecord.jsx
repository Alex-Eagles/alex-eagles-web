import { Fragment, useRef } from "react";
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
          <span className="tr-eyebrow-index">03</span>
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

        {/* The cards sit ON a panel rather than directly on the section, so the
            row reads as a shelf of trophies rather than three loose tiles. */}
        <div className="tr-panel" data-reveal="">
          <ul className="tr-grid">
            {FEATURED_AWARDS.map((award, i) => (
              <li
                className="tr-card"
                key={`${award.competition}-${award.year}-${award.title
                  .map((part) => part.text)
                  .join("")}`}
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
                  {award.title.map((part, p) =>
                    part.accent ? (
                      <span className="tr-card-accent" key={p}>
                        {part.text}
                      </span>
                    ) : (
                      <Fragment key={p}>{part.text}</Fragment>
                    ),
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
