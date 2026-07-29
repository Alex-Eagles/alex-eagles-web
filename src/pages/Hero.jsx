import { ChevronDown } from "lucide-react";
import "../styles/Hero.css";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-overlay">
        <h1>ALEX EAGLES</h1>
        <p>Pushing the boundaries of aerial innovation and expertise</p>

        <button
          onClick={() =>
            document.querySelector(".features").scrollIntoView({
              behavior: "smooth",
            })
          }
        >
          Discover More
        </button>
      </div>

      <div className="hero-scroll-indicator" aria-hidden="true">
        <ChevronDown className="hero-scroll-arrow" />
        <ChevronDown className="hero-scroll-arrow hero-scroll-arrow--second" />
      </div>
    </section>
  );
}