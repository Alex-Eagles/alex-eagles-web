/**
 * blog.ts — content for the full /blog page (build-log posts + category
 * filters), ported from the Figma "Aviation website" blog design.
 * Swap for a CMS/API later; the components don't care where it comes from.
 */

/** The team's real subteams, matching the reference subteam card sheet. */
export type BlogCategory =
  | "hardware"
  | "software"
  | "firmware"
  | "computerVision"
  | "structure"
  | "aerodesign"
  | "propulsion";

/** Display label for each category — used by both the badge and the filter pills. */
export const CATEGORY_LABEL: Record<BlogCategory, string> = {
  hardware: "hardware",
  software: "software",
  firmware: "firmware",
  computerVision: "AI",
  structure: "structure",
  aerodesign: "aerodesign",
  propulsion: "propulsion",
};

export interface CategoryStyle {
  /**
   * Card surface. `light` is a slightly deeper tint of the reference
   * sheet's pastel (a bit darker/richer than the raw value); `dark` is a
   * true deep, moody tone of the same hue — not just a grayed-down pastel —
   * so the card reads as genuinely dark against the site's dark canvas.
   */
  bg: { light: string; dark: string };
  /** Saturated swatch — card border, badge fill, hover glow, footer rule.
   *  Stays the same vivid value in both themes. */
  accent: string;
  /** Primary text (title, excerpt, meta values) — `light` reads on `bg.light`,
   *  `dark` (a light tint of the hue) reads on the now much-darker `bg.dark`. */
  text: { light: string; dark: string };
  /** Secondary text (meta labels, footer date) — same light/dark split as `text`. */
  label: { light: string; dark: string };
  /** Text drawn on top of the badge's `accent` fill. The accent stays a pale/vivid
   *  pastel in both themes, so this is always the dark tone (same as `text.light`). */
  badgeText: string;
}

/**
 * Per-category card styling. Hue families come from the subteam reference
 * sheet (color_usage_map_toggle_3.html); `bg`/`text`/`label` are tuned per
 * theme from there so the card is noticeably darker/richer than the raw
 * pastel while keeping accessible contrast in both modes.
 */
export const CATEGORY_STYLE: Record<BlogCategory, CategoryStyle> = {
  hardware: {
    bg: { light: "#F5E4C4", dark: "#241C12" },
    accent: "#FAC775",
    text: { light: "#5F3A0A", dark: "#F5D9AE" },
    label: { light: "#6E4109", dark: "#D9A65C" },
    badgeText: "#5F3A0A",
  },
  software: {
    bg: { light: "#D2EEE2", dark: "#10241D" },
    accent: "#9FE1CB",
    text: { light: "#085041", dark: "#B7ECD9" },
    label: { light: "#0C5744", dark: "#59C79E" },
    badgeText: "#085041",
  },
  firmware: {
    bg: { light: "#DEDCFC", dark: "#1A1830" },
    accent: "#C5C6F5",
    text: { light: "#26215C", dark: "#D6D3FB" },
    label: { light: "#3C3489", dark: "#9A93E8" },
    badgeText: "#26215C",
  },
  computerVision: {
    bg: { light: "#F6D9E5", dark: "#260F1A" },
    accent: "#F4C0D1",
    text: { light: "#4B1528", dark: "#F4C7DA" },
    label: { light: "#812D49", dark: "#DD79A0" },
    badgeText: "#4B1528",
  },
  structure: {
    bg: { light: "#E7E3D6", dark: "#201E19" },
    accent: "#D3D1C7",
    text: { light: "#2C2C2A", dark: "#E5E2D8" },
    label: { light: "#4C4B48", dark: "#B0AB9C" },
    badgeText: "#2C2C2A",
  },
  aerodesign: {
    bg: { light: "#D5E7F7", dark: "#10202E" },
    accent: "#B5D4F4",
    text: { light: "#042C53", dark: "#C6E1F7" },
    label: { light: "#144D86", dark: "#6AA8E0" },
    badgeText: "#042C53",
  },
  propulsion: {
    bg: { light: "#DCEAC7", dark: "#1A2211" },
    accent: "#C0DD97",
    text: { light: "#173404", dark: "#D4EAB0" },
    label: { light: "#2E550D", dark: "#8FC257" },
    badgeText: "#173404",
  },
};

export interface BlogPostFull {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  /**
   * How the cover image fills its banner. Defaults to "cover" (crop to
   * fill, for photos). Use "contain" for small/transparent logo-style
   * images so they stay crisp and uncropped on a plain backdrop instead of
   * being stretched and blurred.
   */
  imageFit?: "cover" | "contain";
  category: BlogCategory;
  date: string;
  author: string;
  readTime: string;
}

export const BLOG_POSTS: BlogPostFull[] = [
  {
    id: 16,
    title: "Flight Controller v3: Revising the Design",
    excerpt:
      "Back into the flight controller design, working through a new iteration based on lessons from the PCBWay contest board. Testing is planned in the coming weeks.",
    image:
      "https://images.unsplash.com/photo-1760842543713-108c3cadbba1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXJjdWl0JTIwYm9hcmQlMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc3MzY2MjE5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "hardware",
    date: "Jul 2026 – Present",
    author: "Hardware Team",
    readTime: "4 min read",
  },
  {
    id: 17,
    title: "Manufacturing a UGV for ICMTC",
    excerpt:
      "Applied our hardware design expertise to a new platform, manufacturing a ground vehicle for the ICMTC competition.",
    image:
      "https://images.unsplash.com/photo-1575686467550-7d2a658eb1cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcm9uZSUyMGZsaWdodCUyMHRlc3Rpbmd8ZW58MXx8fHwxNzczNjgzODg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "hardware",
    date: "May – Jun 2026",
    author: "Hardware Team",
    readTime: "5 min read",
  },
  {
    id: 18,
    title: "PDB Design Review: What We'd Change Next",
    excerpt:
      "Reviewed our power distribution board's first revision, identified key improvement areas, and kicked off development of a next-generation version.",
    image:
      "https://images.unsplash.com/photo-1760842543713-108c3cadbba1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXJjdWl0JTIwYm9hcmQlMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc3MzY2MjE5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "hardware",
    date: "Apr – Jun 2026",
    author: "Hardware Team",
    readTime: "5 min read",
  },
  {
    id: 9,
    title: "Auditing the Team Website",
    excerpt:
      "We started editing the team website itself — auditing what was already in place, identifying what was missing, and mapping out the requirements it still needed to meet.",
    image: "/images/blog/website-audit.jpg",
    category: "software",
    date: "Feb 15, 2026",
    author: "Software Team",
    readTime: "4 min read",
  },
  {
    id: 10,
    title: "Sprint 3: Front End Structure, Live Tracking & MAVLink",
    excerpt:
      "This sprint tied the front end's main structure together, connected the endpoints to our Drone class, improved live drone tracking on the map, and simulated our MavlinkController class against PX4 firmware.",
    image: "/images/blog/mavlink.png",
    category: "software",
    date: "Dec 5, 2025",
    author: "Software Team",
    readTime: "6 min read",
  },
  {
    id: 11,
    title: "Sprint 2: Ground Station UI, Satellite Maps & the Drone Class",
    excerpt:
      "Sprint 2 covered a lot of ground: building the ground station's UI and layout, researching satellite map integration, implementing our core Drone class, and standing up the API gateway.",
    image: "/images/blog/ground-station.jpg",
    category: "software",
    date: "Nov 23, 2025",
    author: "Software Team",
    readTime: "6 min read",
  },
  {
    id: 12,
    title: "Sprint 1: GCS Architecture & Simulation",
    excerpt:
      "Kicked off our first sprint by reviewing the ground control station's overall architecture and running early simulations to validate our approach before writing production code.",
    image:
      "https://images.unsplash.com/photo-1625459201773-9b2386f53ca2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2Z0d2FyZSUyMGNvZGUlMjBwcm9ncmFtbWluZ3xlbnwxfHx8fDE3NzM2ODM4ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "software",
    date: "Oct 24, 2025",
    author: "Software Team",
    readTime: "5 min read",
  },
  {
    id: 13,
    title: "Getting Up to Speed with React",
    excerpt:
      "Before sprint work began, the team spent the week studying React fundamentals — components, hooks, and state management — to build a shared foundation for the ground station front end.",
    image: "/images/blog/react.png",
    imageFit: "contain",
    category: "software",
    date: "Oct 21, 2025",
    author: "Software Team",
    readTime: "3 min read",
  },
  {
    id: 19,
    title: "Designing Our Custom Power Distribution Board",
    excerpt:
      "Designed, built, and tested a custom power distribution board to power every onboard electronic system on the team's UAV.",
    image:
      "https://images.unsplash.com/photo-1760842543713-108c3cadbba1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXJjdWl0JTIwYm9hcmQlMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc3MzY2MjE5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "hardware",
    date: "Feb – Mar 2026",
    author: "Hardware Team",
    readTime: "6 min read",
  },
  {
    id: 20,
    title: "Entering the PCBWay Design Contest",
    excerpt:
      "Entered the PCBWay Design Contest with an original flight controller module, engineered entirely in-house from schematic to layout.",
    image:
      "https://images.unsplash.com/photo-1575686467550-7d2a658eb1cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcm9uZSUyMGZsaWdodCUyMHRlc3Rpbmd8ZW58MXx8fHwxNzczNjgzODg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "hardware",
    date: "Nov 2025 – Jan 2026",
    author: "Hardware Team",
    readTime: "7 min read",
  },
  {
    id: 21,
    title: "Onboarding the Hardware Team on Altium Designer",
    excerpt:
      "Trained new members to proficiency in Altium Designer, building the team's core PCB design capability from the ground up.",
    image:
      "https://images.unsplash.com/photo-1760842543713-108c3cadbba1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXJjdWl0JTIwYm9hcmQlMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc3MzY2MjE5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "hardware",
    date: "Sep – Nov 2025",
    author: "Hardware Team",
    readTime: "4 min read",
  },
  {
    id: 4,
    title: "3D Printed Carbon Fiber Frame Design",
    excerpt:
      "Engineering a lightweight yet durable frame using advanced materials and manufacturing techniques. Stress testing results included.",
    image:
      "https://images.unsplash.com/photo-1715322506425-2fc19fe0fc5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNoYW5pY2FsJTIwZW5naW5lZXJpbmclMjBnZWFyc3xlbnwxfHx8fDE3NzM2ODM4ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "structure",
    date: "Mar 3, 2026",
    author: "Jessica Park",
    readTime: "7 min read",
  },
  {
    id: 14,
    title: "Sprint 2: Diffusion Models, Gimbal Control & Camera Streaming",
    excerpt:
      "Sprint 2 explored diffusion models for 3D texturing, implemented gimbal control via Herelink, and got camera stream acquisition working through Herelink.",
    image:
      "https://images.unsplash.com/photo-1612338762643-298feee70520?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2JvdGljcyUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzczNjM2NTEyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "computerVision",
    date: "Nov 17, 2025",
    author: "AI Team",
    readTime: "5 min read",
  },
  {
    id: 15,
    title: "Sprint 1: Dataset Generation with Blender",
    excerpt:
      "Kicked off with a synthetic dataset generation pipeline built in Blender — the foundation we'd use to train our computer vision models.",
    image:
      "https://images.unsplash.com/photo-1612338762643-298feee70520?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2JvdGljcyUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzczNjM2NTEyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "computerVision",
    date: "Oct 21, 2025",
    author: "AI Team",
    readTime: "4 min read",
  },
  {
    id: 6,
    title: "Power Management System Design",
    excerpt:
      "Creating an intelligent battery management system with safety features and real-time monitoring capabilities.",
    image:
      "https://images.unsplash.com/photo-1694466464626-7bd06595cf2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXJkd2FyZSUyMGVsZWN0cm9uaWNzJTIwY29tcG9uZW50c3xlbnwxfHx8fDE3NzM2ODM4ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "propulsion",
    date: "Feb 25, 2026",
    author: "Emma Watson",
    readTime: "5 min read",
  },
  {
    id: 7,
    title: "Real-Time Flight Controller Firmware",
    excerpt:
      "Rewriting our flight controller's real-time loop for a deterministic 1kHz update rate. Why we moved off the RTOS scheduler and what it took to keep every control cycle on time.",
    image:
      "https://images.unsplash.com/photo-1625459201773-9b2386f53ca2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2Z0d2FyZSUyMGNvZGUlMjBwcm9ncmFtbWluZ3xlbnwxfHx8fDE3NzM2ODM4ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "firmware",
    date: "Mar 12, 2026",
    author: "Youssef Adel",
    readTime: "7 min read",
  },
  {
    id: 8,
    title: "Wing Profile Selection for Cruise Efficiency",
    excerpt:
      "Comparing airfoil candidates in simulation to maximize lift-to-drag at cruise speed, then validating the winner on the test range. Here's how we picked our final wing profile.",
    image:
      "https://images.unsplash.com/photo-1575686467550-7d2a658eb1cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcm9uZSUyMGZsaWdodCUyMHRlc3Rpbmd8ZW58MXx8fHwxNzczNjgzODg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "aerodesign",
    date: "Mar 14, 2026",
    author: "Lina Farouk",
    readTime: "6 min read",
  },
];

export interface BlogFilter {
  id: "all" | BlogCategory;
  label: string;
}

export const BLOG_FILTERS: BlogFilter[] = [
  { id: "all", label: "all" },
  ...(Object.keys(CATEGORY_LABEL) as BlogCategory[]).map((id) => ({
    id,
    label: CATEGORY_LABEL[id],
  })),
];
