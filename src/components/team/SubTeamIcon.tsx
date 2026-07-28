import type { SubTeamIconKey } from "@/data/team";

/**
 * SubTeamIcon — a small line-glyph per sub-team, drawn to read at 18–22px on the
 * info chip. All share stroke settings so they sit as a consistent set; each
 * shape is chosen to say what the team does at a glance.
 */
export function SubTeamIcon({
  name,
  size = 20,
}: {
  name: SubTeamIconKey;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "software": // code brackets
      return (
        <svg {...common}>
          <path d="m8 7-5 5 5 5" />
          <path d="m16 7 5 5-5 5" />
          <path d="m13 4-2 16" />
        </svg>
      );
    case "hardware": // microchip
      return (
        <svg {...common}>
          <rect x="7" y="7" width="10" height="10" rx="1.5" />
          <path d="M10 10h4v4h-4z" />
          <path d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2" />
        </svg>
      );
    case "computer-vision": // eye + scan
      return (
        <svg {...common}>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "structure": // truss / frame
      return (
        <svg {...common}>
          <path d="M4 20 12 4l8 16Z" />
          <path d="M8 20 12 12l4 8M4 20h16" />
        </svg>
      );
    case "aerodesign": // airflow over a wing
      return (
        <svg {...common}>
          <path d="M3 15c5 0 8-4 18-9-3 6-8 9-14 9" />
          <path d="M4 19h6M3 11h4" />
        </svg>
      );
    case "wing": // swept wing
      return (
        <svg {...common}>
          <path d="M3 6c7 1 13 4 18 12-6-2-10-2-13-1" />
          <path d="M8 17c-1-2-1-4 0-6" />
        </svg>
      );
    case "tail-stability": // rudder / axes
      return (
        <svg {...common}>
          <path d="M12 21V7" />
          <path d="M12 7 6 12M12 7l6 5" />
          <path d="M4 21h16" />
        </svg>
      );
    case "propulsion": // propeller
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="1.6" />
          <path d="M12 10.4c0-3 .5-6-1.5-7.4-1.6 1 .5 5 1.5 7.4Z" />
          <path d="M13.6 12c3 0 6 .5 7.4-1.5-1-1.6-5 .5-7.4 1.5Z" />
          <path d="M12 13.6c0 3-.5 6 1.5 7.4 1.6-1-.5-5-1.5-7.4Z" />
          <path d="M10.4 12c-3 0-6-.5-7.4 1.5 1 1.6 5-.5 7.4-1.5Z" />
        </svg>
      );
  }
}
