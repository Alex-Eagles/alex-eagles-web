import drone from "@/assets/images/drone.png";
import Marquee from "@/components/sections/marquee";

function Hero() {
  return (
    <section className="bg-surface">
      <div className="h-dvh flex flex-col pt-20 pb-10 justify-between">
        <h1 className="text-3xl section-inline-padding md:w-1/2 lg:text-5xl lg:mt-6">
          Building the future of <span className="text-brand">drones</span>{" "}
          technology
        </h1>
        <div className="my-5 relative isolate">
          <figure className="sm:w-1/2 mx-auto">
            <img src={drone} alt="Drone image" />
          </figure>
          <Marquee text="drone" className="text-brand -z-10" />
        </div>
        <div className="flex flex-wrap gap-x-1 section-inline-padding text-xs justify-between *:uppercase *:lg:text-base">
          <span>Safer</span>
          <span>Sustainable</span>
          <span>More reliable</span>
          <span>Longer lasting</span>
          <span>Faster charging</span>
          <span>Smaller</span>
          <span>Lighter</span>
        </div>
      </div>
    </section>
  );
}
export default Hero;
