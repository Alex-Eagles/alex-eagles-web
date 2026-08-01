import "../styles/Features.css";

function Features() {
  return (
    <section className="features">
      <div className="features-bg" aria-hidden="true">
        <img src="/Home/who%20we%20are.JPG" alt="" />
      </div>
      <div className="features-scrim" aria-hidden="true" />
      <div className="features-fade" aria-hidden="true" />

      <span className="features-watermark" aria-hidden="true">
        2013
      </span>

      <div className="features-content">
        <div className="features-eyebrow">
          <span className="features-eyebrow-index">01</span>
          <span className="features-eyebrow-line" />
          <span className="features-eyebrow-label">Who We Are</span>
        </div>

        <h2 className="features-headline">
          <span className="features-headline-line">
            Engineers <span className="features-headline-accent">by Degree.</span>
          </span>
          <span className="features-headline-line">Aviators by Passion.</span>
        </h2>

        <p className="features-copy-text">
          Established in 2013 at Alexandria University's Faculty of
          Engineering: a multidisciplinary team of mechanical, mechatronics,
          electrical, and software engineers with no aviation department to
          lean on — we taught ourselves to design, build, and fly autonomous
          aircraft end to end, out of passion.
        </p>

        <div className="features-credential">
          Alexandria University · SUAS Team
        </div>
      </div>
    </section>
  );
}

export default Features;
