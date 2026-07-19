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
      <h3 className="text-2xl ">Experts in solid state battery technology</h3>
      <p className="">
        Replacing toxic and flammable liquid electrolytes in conventional
        batteries with solid, more sustainable materials will unlock the next
        generation in battery technology.
      </p>
      <figure className="my-16">
        <img src={drone} alt="Solid State Battery" />
      </figure>
      <div className="counter space-y-6 ">
        <div className="space-y-2">
          <h4 className="text-xl counter__superscript">Solid electrolytes</h4>
          <p>
            Non-flammable, non-toxic, more recyclable solid materials for higher
            energy density.
          </p>
          <a href="#" className="border-b">
            More about solid electrolytes
          </a>
        </div>
        <div className="space-y-2">
          <h4 className="text-xl counter__superscript">Solid electrolytes</h4>
          <p>
            Non-flammable, non-toxic, more recyclable solid materials for higher
            energy density.
          </p>
          <a href="#" className="border-b">
            More about solid electrolytes
          </a>
        </div>
      </div>
    </div>
  );
}
