import React from "react";
import "../styles/Sponsors.css";

const sponsors = [
  { name: "ALTIUM", logo: "/altium.jpg" },
  { name: "MathWorks", logo: "/mathworks-logo.jpg" },
  { name: "JLCPCB", logo: "/JLC.JPG" },
  { name: "HITEC", logo: "/HITEC.JPG" },
  { name: "T-MOTOR", logo: "/T-motor.jpg", scale: 1.2 },
  { name: "RUX HOBBY", logo: "/rux.jpg" },
  { name: "EASY composites", logo: "/composites.jpg" },
  { name: "ALC", logo: "/alc.jpg" },
];

export default function Sponsors() {
  // Sponsors are rendered twice so the marquee loop is seamless
  const loopedSponsors = [...sponsors, ...sponsors];

  return (
    <section className="sponsors">
      <div className="sponsors-header">
        <h2>Our Sponsors</h2>
        <p>
          We're proud to partner with industry-leading companies who share our passion for innovation.
        </p>
      </div>

      <div className="sponsors-marquee">
        <div className="sponsors-track">
          {loopedSponsors.map((sponsor, index) =>
            sponsor.logo ? (
              <div key={index} className="sponsor-card">
                <img
                  src={sponsor.logo}
                  alt={`${sponsor.name} logo`}
                  style={sponsor.scale ? { transform: `scale(${sponsor.scale})` } : undefined}
                />
              </div>
            ) : (
              <div key={index} className="sponsor-card sponsor-card--text">
                {sponsor.name}
              </div>
            ),
          )}
        </div>
      </div>

      <div className="sponsors-footer">
        <p>Interested in becoming a sponsor?</p>
        <button
          onClick={() =>
            document.querySelector(".contact").scrollIntoView({
              behavior: "smooth",
            })
          }
        >
          Partner With Us
        </button>
      </div>
    </section>
  );
}