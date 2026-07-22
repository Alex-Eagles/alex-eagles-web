import {
  Github,
  Instagram,
  Linkedin,
  Youtube,
  type LucideIcon,
} from "lucide-react";

/**
 * site.ts — global, cross-page content: navigation, brand strings, contact,
 * and social links. Editing the site's nav or contact details happens here.
 */

export interface NavLink {
  label: string;
  /** Router path. Home is "/"; the rest are their own routes. */
  path: string;
}

/** The primary navigation, shared by the Navbar and the Footer quick-links. */
export const NAV_LINKS: NavLink[] = [
  { label: "Home", path: "/" },
  { label: "Team", path: "/team" },
  { label: "Blog", path: "/blog" },
  { label: "Vehicles", path: "/vehicles" },
  { label: "Gallery", path: "/gallery" },
  { label: "History", path: "/history" },
];

export const BRAND = {
  name: "Alex Eagles",
  unit: "UAV Team",
  mission:
    "A young, multidisciplinary team engineering the autonomous aircraft of tomorrow — today.",
} as const;

export const CONTACT = {
  email: "team@alexeagles.org",
  location: "Alexandria University, Egypt",
} as const;

export interface SocialLink {
  label: string;
  href: string;
  Icon: LucideIcon;
}

/** Footer social row. `Icon` is a lucide component rendered as <Icon />. */
export const SOCIALS: SocialLink[] = [
  { label: "Instagram", href: "#", Icon: Instagram },
  { label: "LinkedIn", href: "#", Icon: Linkedin },
  { label: "YouTube", href: "#", Icon: Youtube },
  { label: "GitHub", href: "#", Icon: Github },
];

/** Vehicle names surfaced in the footer (full data lives with the Vehicles page). */
export const VEHICLE_NAMES: string[] = [
  "Falcon-X1",
  "Talon VTOL",
  "Skimmer FW",
];
