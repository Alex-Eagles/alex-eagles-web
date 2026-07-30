import {
  Facebook,
  Github,
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
  /** Google Maps link for the location line in the footer. */
  mapsUrl: "https://maps.app.goo.gl/xop1aPn1M7CSjY4d6",
} as const;

/**
 * The pre-written "I'm interested" message the footer newsletter form sends to
 * the team. When a visitor submits their email, the form opens their mail client
 * with this subject/body addressed to CONTACT.email — `{email}` is replaced with
 * whatever the visitor typed. Edit the wording here to change the outgoing email.
 */
export const NEWSLETTER_EMAIL = {
  subject: "New updates subscriber — interested in Alex Eagles",
  body: [
    "Hello Alex Eagles team,",
    "",
    "I came across your website and I'm interested in learning more about the",
    "team. Please add me to your mailing list so I receive your constant updates,",
    "news, and developments.",
    "",
    "My email address: {email}",
    "",
    "Thank you!",
  ].join("\n"),
} as const;

export interface SocialLink {
  label: string;
  href: string;
  Icon: LucideIcon | typeof TikTokIcon;
}

/** Footer social row. `Icon` is a lucide component rendered as <Icon />. */
export const SOCIALS: SocialLink[] = [
  { label: "Instagram", href: "https://www.instagram.com/alex_eagles.aerodesign/", Icon: Instagram },
  { label: "Facebook", href: "https://www.facebook.com/alexeagles2015/", Icon: Facebook },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/alex-eagles-aero-design/posts/?feedView=all", Icon: Linkedin },
  { label: "YouTube", href: "https://www.youtube.com/@AlexEagles.aerodesign", Icon: Youtube },
  { label: "TikTok", href: "https://www.tiktok.com/@alexeaglesaerodesign", Icon: TikTokIcon },
  { label: "GitHub", href: "https://github.com/Alex-Eagles", Icon: Github },
];

/** Vehicle names surfaced in the footer (full data lives with the Vehicles page). */
export const VEHICLE_NAMES: string[] = ["Neith"];
