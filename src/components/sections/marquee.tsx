import { cn } from "@/lib/utils";

interface MarqueeProps {
  text: string;
  className?: string;
}

function Marquee({ text, className }: MarqueeProps) {
  const textItems = new Array(5).fill(text).map((item, index) => (
    <li key={index} className="whitespace-nowrap">
      {item}
    </li>
  ));

  return (
    <div
      className={cn(
        "overflow-hidden marquee absolute top-1/2 left-0 right-0 -translate-y-1/2",
        className,
      )}
    >
      <ul className="flex gap-x-4 text-6xl ps-4 w-fit ">
        {textItems}
        {textItems}
      </ul>
    </div>
  );
}
export default Marquee;
