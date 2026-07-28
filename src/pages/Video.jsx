import { useState } from "react";
import "../styles/Video.css";

// TODO: replace with the hosted URL once fly.mp4 is uploaded externally (it
// was removed from the repo — see /alex-eagles-media next to the project
// folder for the original file).
const FLY_VIDEO_URL = "";

export default function Video() {
  const [play, setPlay] = useState(false);

  return (
    <section className="video">
      <h2>Watch Us Fly</h2>

      <div className="video-container">
        {play && FLY_VIDEO_URL ? (
          <video width="100%" height="500" src={FLY_VIDEO_URL} controls autoPlay />
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