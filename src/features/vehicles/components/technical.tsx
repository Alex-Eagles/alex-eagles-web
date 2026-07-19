import { MoveDown, Plus, type LucideIcon } from "lucide-react";

function Technical() {
  return (
    <section className="">
      <h2 className="text-4xl">Technical Details</h2>
      <p className="mb-12">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempore, totam.
      </p>
      <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
        <Card
          title="Engine"
          impactPercentage={85}
          description="High-performance engine with advanced fuel efficiency."
          icon={Plus}
        />
        <Card
          title="Engine"
          impactPercentage={85}
          description="High-performance engine with advanced fuel efficiency."
          icon={Plus}
        />
        <Card
          title="Engine"
          impactPercentage={85}
          description="High-performance engine with advanced fuel efficiency."
          icon={Plus}
        />
      </div>
      <MoveDown size={24} className="mx-auto mt-10" />
    </section>
  );
}

interface CardProps {
  title: string;
  impactPercentage: number;
  description: string;
  icon: LucideIcon;
}

function Card({ title, impactPercentage, description, icon: Icon }: CardProps) {
  return (
    <div className="glassmorphism rounded-2xl">
      <h3 className="text-2xl p-5">{title}</h3>
      <div className="flex w-max items-center gap-2 p-5">
        <span className="flex items-center">
          {"["}
          <Icon size={13} />
          {"]"}
        </span>
        <p className="text-5xl">{impactPercentage}%</p>
      </div>
      <p className="border-t border-gray-300/5 p-5">{description}</p>
    </div>
  );
}
export default Technical;
