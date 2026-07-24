import "../styles/Homepage.css";

import { useTheme } from "@/context/ThemeContext";

// TODO: replace with the hosted URLs once dark.mp4 / light.mp4 are uploaded
// externally (they were removed from the repo — see /alex-eagles-media next
// to the project folder for the original files).
const BG_VIDEO_DARK_URL = "";
const BG_VIDEO_LIGHT_URL = "";
import Hero from "./Hero";
import Features from "./Features";
import Video from "./Video";
import Updates from "./Updates";
import Sponsors from "./Sponsors";
import Contact from "./Contact";

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
        <Video />
        <Updates />
        <Sponsors />
        <Contact />
      </div>
    </>
  );
}
