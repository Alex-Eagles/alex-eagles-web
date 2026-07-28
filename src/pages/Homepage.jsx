import "../styles/Homepage.css";

import { useTheme } from "@/context/ThemeContext";

// Theme background clips, hosted on Cloudinary (cloud "deqkkrtk") — the source
// files were removed from the repo. Same credit-saving delivery transforms as
// the blog hero: f_auto (modern codecs), q_auto:eco (aggressive auto-quality,
// hidden under the scrim), w_960 (background, not 4K). Not trimmed — each plays
// its full length.
const BG_VIDEO_DARK_URL =
  "https://res.cloudinary.com/deqkkrtk/video/upload/f_auto,q_auto:eco,w_960/v1785007301/bck_dark_bhfj2m.mp4";
const BG_VIDEO_LIGHT_URL =
  "https://res.cloudinary.com/deqkkrtk/video/upload/f_auto,q_auto:eco,w_960/v1785007302/bck_light_p3nbxr.mp4";
import Hero from "./Hero";
import Features from "./Features";
import Video from "./Video";
import Updates from "./Updates";
import Sponsors from "./Sponsors";
import TeamStructure from "./TeamStructure";

export default function Homepage() {
  const { isDark } = useTheme();

  return (
    <>
      {/* Fixed drone-video background: sits behind every section, visible
       * through their translucent panels as the page scrolls. Swaps source
       * per theme — `key` forces a clean remount so the browser reloads and
       * plays the new file instead of just swapping the src attribute. */}
      <div className="homepage-bg-video" aria-hidden="true">
        {(isDark ? BG_VIDEO_DARK_URL : BG_VIDEO_LIGHT_URL) && (
          <video
            key={isDark ? "dark" : "light"}
            className="homepage-bg-video-el"
            src={isDark ? BG_VIDEO_DARK_URL : BG_VIDEO_LIGHT_URL}
            autoPlay
            muted
            loop
            playsInline
          />
        )}
        <div className="homepage-bg-scrim" />
      </div>

      <div className="homepage-content">
        <Hero />
        <Features />
        <TeamStructure />
        <Updates />
        <Video />
        <Sponsors />
      </div>
    </>
  );
}
