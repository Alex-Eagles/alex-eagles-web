import quadGround from "@/assets/vehicles/quad-test/ground.jpg";
import quadFlight from "@/assets/vehicles/quad-test/flight.jpg";
import hexaGround from "@/assets/vehicles/hexa-test/ground.png";
import hexaFlight from "@/assets/vehicles/hexa-test/flight.png";

/**
 * Prototypes — the two test airframes flown before the final rescue-drone
 * hexacopter, in build order: the Hexa came first and established the
 * avionics stack, frame-build method, and PID baseline; the Quad came next,
 * carrying that stack over into a near-identical frame size to validate the
 * full build → calibrate → fly → tune process end to end.
 *
 * Each carries a ground shot, an in-flight shot, and (once filmed) a YouTube
 * flight video — Prototypes.tsx renders a placeholder in the video modal
 * until `videoUrl` is filled in.
 */

export interface PrototypeStat {
  label: string;
  value: string;
}

export interface Prototype {
  id: string;
  name: string;
  role: string;
  tagline: string;
  summary: string;
  stats: PrototypeStat[];
  highlights: string[];
  lesson: string;
  groundImage: string;
  flightImage: string;
  /**
   * YouTube embed URL, dropped straight into the modal's <iframe src>, so it
   * must be the /embed/ form — a youtu.be or /watch?v= link refuses to frame.
   * Use the nocookie host like Video.jsx does: same embed, but YouTube holds
   * off on tracking cookies until someone actually presses play. Drop the `si`
   * share token from a copied link; it only identifies who shared it.
   * Undefined = footage not filmed/uploaded yet.
   */
  videoUrl?: string;
}

export const prototypes: Prototype[] = [
  {
    id: "hexa-test",
    name: "Hexa Test Drone",
    role: "Prototype 01",
    tagline: "T-Motor Air Gear 450, FEA-verified wooden frame",
    summary:
      "Our first test platform: six T-Motor Air Gear 450 motors on 10-inch propellers, a wooden frame, sized and stress-tested with real calculations rather than guesswork — full mass breakdown, thrust-to-weight sizing per flight phase, and FEA safety-factor / von Mises stress analysis on the frame itself. It established the avionics stack and PID tuning baseline every airframe since has built on.",
    stats: [
      { label: "Motors", value: "T-Motor Air Gear 450" },
      { label: "Propellers", value: "10 in" },
      { label: "Battery", value: "4S · 7200 mAh" },
      { label: "MTOW", value: "3.3 kg" },
      { label: "Flight time", value: "10 min" },
      { label: "Take-off thrust:weight", value: "2.3 : 1" },
      { label: "Cruise thrust:weight", value: "1.2 : 1" },
      { label: "Hover thrust:weight", value: "1.0 : 1" },
    ],
    highlights: [
      "Full mass breakdown (frame, battery, avionics, propulsion) drove every sizing decision",
      "Battery capacity derived from a per-phase current draw model (take-off / cruise / hover), then padded 10% for safety margin",
      "Frame validated in FEA: safety factor stayed above target and max von Mises stress stayed well within material limits under tilted-landing and static loads",
    ],
    lesson:
      "This was our first real airframe, so it set the baseline everything after inherited: the avionics stack, the plywood-frame build method, and the first PID tuning pass — all validated with FEA rather than assumed safe.",
    groundImage: hexaGround,
    flightImage: hexaFlight,
    videoUrl: "https://www.youtube-nocookie.com/embed/KrsQcj8R7ck",
  },
  {
    id: "quad-test",
    name: "Quad Test Drone",
    role: "Prototype 02",
    tagline: "Same avionics stack, near-identical frame, next in line",
    summary:
      "Built right after the Hexa, close to it in frame size and carrying over the same avionics stack — including the battery — with PID tuning transferred directly rather than re-derived from scratch. With the baseline already proven, this is where we ran the full build → calibrate → fly → tune process end to end.",
    stats: [
      { label: "Motors", value: "T-Motor MN5008" },
      { label: "Propellers", value: "15 in" },
      { label: "Battery", value: "6S · 20 Ah" },
      { label: "MTOW", value: "6 kg" },
      { label: "Payload capacity", value: "1.5 kg" },
      { label: "Cruise speed (unloaded)", value: "60 km/h" },
      { label: "Takeoff speed (loaded)", value: "14 km/h" },
      { label: "Flight time", value: "40 min" },
    ],
    highlights: [
      "Wooden (plywood) frame, close in size to the Hexa, for a direct apples-to-apples comparison",
      "Inherited avionics and PID baseline from the Hexa instead of re-tuning from zero",
      "Full process validated end to end: calibration → tuning → payload-loaded flight, up to 1.5 kg at 6 kg MTOW",
    ],
    lesson:
      "Because it inherited a proven avionics stack and tuning from the Hexa, the Quad let us validate the complete test process — calibration, PID tuning, and payload-loaded flight — end to end, which is the same process every airframe since has followed.",
    groundImage: quadGround,
    flightImage: quadFlight,
    videoUrl: "https://www.youtube-nocookie.com/embed/rcxx8AeXm1c",
  },
];
