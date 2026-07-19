import Hero from "@/components/sections/Hero";
import StatsBar from "@/components/sections/StatsBar";
import About from "@/components/sections/About";
import LatestUpdates from "@/components/sections/LatestUpdates";
import Sponsors from "@/components/sections/Sponsors";

/**
 * Home — composes the home page from its section components, in the order set
 * by the design: hero → stats → about → latest updates → sponsors.
 * (The Navbar and Footer are provided by the App layout shell.)
 */
export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <About />
      <LatestUpdates />
      <Sponsors />
    </>
  );
}
