import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import TikTokIcon from "@/components/ui/TikTokIcon";

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
  email: "alex_eagles@alexu.edu.eg",
  location: "Alexandria University, Egypt",
} as const;

export interface SocialLink {
  label: string;
  href: string;
  Icon: LucideIcon | typeof TikTokIcon;
}

/** Footer social row. `Icon` is a lucide component rendered as <Icon />. */
export const SOCIALS: SocialLink[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/alex_eagles.aerodesign?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
    Icon: Instagram,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/alex-eagles-aero-design",
    Icon: Linkedin,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCcYOAKkQccqtWqalxiGJtkg",
    Icon: Youtube,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/alexeagles2015",
    Icon: Facebook,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@alexeaglesaerodesign",
    Icon: TikTokIcon,
  },
];

/** Vehicle names surfaced in the footer (full data lives with the Vehicles page). */
export const VEHICLE_NAMES: string[] = ["Falcon-X1", "Talon VTOL", "Skimmer FW"];
