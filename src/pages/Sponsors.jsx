import React from "react";
import "../styles/Sponsors.css";

const sponsors = [
  {
    name: "ALTIUM",
    logo: "/altium.jpg",
    url: "https://www.altium.com/altium-designer?srsltid=AfmBOoqhHcMOZrHFgx81JV4uApkpAL59t52VsNEuqktiRQkZZUV1uYyM",
  },
  { name: "MathWorks", logo: "/mathworks-logo.jpg", url: "https://www.mathworks.com/" },
  { name: "JLCPCB", logo: "/JLC.JPG", url: "https://jlcpcb.com/" },
  {
    name: "HITEC",
    logo: "/HITEC.JPG",
    url: "https://hitecrcd.com/?srsltid=AfmBOooo6CB00dnkEuKOXU-8PClABI7kSEK4DP_sfDjqjWZtyHJeSGke",
  },
  {
    name: "T-MOTOR",
    logo: "/T-motor.jpg",
    scale: 1.2,
    url: "https://store.tmotor.com/?srsltid=AfmBOop7-5_dvF_7aQ3W05NDnNxuU0-IOtuetsYoschCYRpeeHCdfJAc",
  },
  { name: "RUX HOBBY", logo: "/rux.jpg", url: "https://www.rjxhobby.com/" },
  {
    name: "EASY composites",
    logo: "/composites.jpg",
    url: "https://www.easycomposites.co.uk/",
  },
  { name: "ecalc", logo: "/ecalc.jpg", url: "https://www.ecalc.ch/" },
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
          {loopedSponsors.map((sponsor, index) => {
            const content = sponsor.logo ? (
              <img
                src={sponsor.logo}
                alt={`${sponsor.name} logo`}
                style={sponsor.scale ? { transform: `scale(${sponsor.scale})` } : undefined}
              />
            ) : (
              sponsor.name
            );

            return sponsor.url ? (
              <a
                key={index}
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`sponsor-card${sponsor.logo ? "" : " sponsor-card--text"}`}
              >
                {content}
              </a>
            ) : (
              <div
                key={index}
                className={`sponsor-card${sponsor.logo ? "" : " sponsor-card--text"}`}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sponsors-footer">
        <p>Interested in becoming a sponsor?</p>
        <a
          href="mailto:alex_eagles@alexu.edu.eg?subject=Sponsorship%20Inquiry"
          className="sponsors-footer-cta"
        >
          Partner With Us
        </a>
      </div>
    </section>
  );
}