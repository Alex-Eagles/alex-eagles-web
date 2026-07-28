import "../styles/Hero.css";

const HERO_VIDEO_URL = "/suas_camera_stream.mp4";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true">
        <video
          className="hero-bg-el"
          src={HERO_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
        />
      </div>

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
    </section>
  );
}