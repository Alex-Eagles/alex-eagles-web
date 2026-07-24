import { useState } from "react";
import "../styles/Video.css";

export default function Video() {
  const [play, setPlay] = useState(false);

  return (
    <section className="video">
      <h2>Watch Us Fly</h2>

      <div className="video-container">
        {play ? (
          <video width="100%" height="500" src="/fly.mp4" controls autoPlay />
        ) : (
          <>
            <img src="/drone-video.jpg" alt="preview" />
            <div className="play-button" onClick={() => setPlay(true)}>
              ▶
            </div>
          </>
        )}
      </div>
    </section>
  );
}