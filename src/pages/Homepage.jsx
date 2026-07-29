import "../styles/Homepage.css";

import Hero from "./Hero";
import Features from "./Features";
import Video from "./Video";
import TrackRecord from "./TrackRecord";
import Sponsors from "./Sponsors";
import TeamStructure from "./TeamStructure";

export default function Homepage() {
  return (
    <div className="homepage-content">
      <Hero />
      <Features />
      <TeamStructure />
      <TrackRecord />
      <Video />
      <Sponsors />
    </div>
  );
}
