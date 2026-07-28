import drone from "@/assets/images/drone.png";

const keywords = [
  "Safer",
  "More efficient",
  "Longer lasting",
  "Sustainable",
  "High Energy Density",
  "Faster Charging",
  "Cost-effective",
  "Scalable",
];

// TODO: add figure annotations and animations
function Overview() {
  const keywordsItems = keywords.map((keyword, index) => (
    <Keyword text={keyword} colorClassName="text-content-primary" key={index} />
  ));

  return (
    <section className="">
      <h2 className="text-content-brand text-4xl mb-8">
        Leading the way to a sustainable battery future
      </h2>
      <ul className="flex gap-2 flex-wrap">{keywordsItems}</ul>
      <Card />
    </section>
  );
}
export default Overview;

function Keyword({
  text,
  colorClassName,
}: {
  text: string;
  colorClassName: string;
}) {
  return (
    <li
      className={`text-xs p-1 ${colorClassName} border-2 border-current rounded-md font-bold`}
    >
      {text}
    </li>
  );
}

function Card() {
  return (
    <div className="bg-brand-light px-4 py-8 rounded-lg mt-8 text-[#f0f2ff] space-y-4">
      <h3 className="text-2xl ">Experts in drone technology</h3>
      {/* <p className="">
        Replacing toxic and flammable liquid electrolytes in conventional
        batteries with solid, more sustainable materials will unlock the next
        generation in battery technology.
      </p> */}
      <figure className="my-16 w-2/3 mx-auto relative">
        <img src={drone} alt="Solid State Battery" />
        <ImageMarker number={1} x={55} y={30} />
        <ImageMarker number={2} x={45} y={61} />
        <ImageMarker number={3} x={55} y={85} />
        <ImageMarker number={4} x={25} y={20} />
      </figure>
      <div className="counter grid grid-cols-3 gap-8">
        <Info
          title="Pixhawk (Flight Controller)"
          description="The Cube Orange Pixhawk is a high-performance flight controller with a fast STM32H7 processor, triple redundant IMUs, and support for PX4 and ArduPilot. It offers reliable performance, multiple interfaces, and is ideal for advanced autonomous UAVs."
        />
        <Info
          title="Camera"
          description="The SIYI A8 Mini is a compact 3-axis gimbal camera with a 4K 8MP Sony sensor, 6X digital zoom, and smooth FOC stabilization. It offers outputs like HDMI and Ethernet for versatile UAV use."
        />
        <Info
          title="Motor"
          description="Our state-of-the-art propulsion system utilizes T-motors P80III 120kv waterproof, Dust resistant, and extremely durable motors compatible for a UAV of this scale, providing more than enough thrust to effectively maneuver our drone at high speeds."
        />
        <Info
          title="Propellers"
          description="We paired our motors with T-Motor MF3016 polymer propellers to provide us with the required thrust."
        />
      </div>
    </div>
  );
}

interface InfoProps {
  title: string;
  description: string;
}

function Info({ title, description }: InfoProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-xl counter__superscript">{title}</h4>
      <p>{description}</p>
    </div>
  );
}

type MarkerProps = {
  number: number | string;
  x: number;
  y: number;
};

export function ImageMarker({ number, x, y }: MarkerProps) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
    >
      {/* Outer ring */}
      <div className="flex w-10 aspect-square items-center justify-center rounded-full border-[3px] border-lime-300">
        {/* Inner circle */}
        <div className="flex w-6 aspect-square items-center justify-center rounded-full bg-lime-300">
          <span className="text-sm font-medium text-black">{number}</span>
        </div>
      </div>
    </div>
  );
}
