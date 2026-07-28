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
          title="Weight"
          impact={"6500g"}
          description="High-performance engine with advanced fuel efficiency."
          icon={Plus}
        />
        {/* <Card
          title="Weight (Without Payload)"
          impact={"6500g"}
          description="High-performance engine with advanced fuel efficiency."
          icon={Plus}
        /> */}
        <Card
          title="Flight time"
          impact={"40mins"}
          description="High-performance engine with advanced fuel efficiency."
          icon={Plus}
        />
        <Card
          title="Propulsion System"
          impact={"320kv"}
          description="KDE 4215"
          icon={Plus}
        />
        <Card
          title="Power System"
          impact={"20Ah"}
          description="6S8P Custom LiOn Pack"
          icon={Plus}
        />
      </div>
      <MoveDown size={24} className="mx-auto mt-10" />
    </section>
  );
}

interface CardProps {
  title: string;
  impact: string;
  description: string;
  icon: LucideIcon;
}

function Card({ title, impact, description, icon: Icon }: CardProps) {
  return (
    <div
      className="glassmorphism rounded-2xl text-white"
      style={{
        background: "var(--bg-glass)",
        border: `1px solid var(--border-subtle)`,
        boxShadow: "var(--elevation-2)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <h3 className="text-2xl p-5">{title}</h3>
      <div className="flex w-max items-center gap-2 p-5">
        <span className="flex items-center">
          {"["}
          <Icon size={13} />
          {"]"}
        </span>
        <p className="text-5xl">{impact}</p>
      </div>
      <p className="border-t border-gray-300/5 p-5">{description}</p>
    </div>
  );
}
export default Technical;
