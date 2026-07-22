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
   * Card surface — the pale card background from the reference sheet.
   * `light` is the sheet's exact value; `dark` is the same hue a few
   * shades darker so the card reads correctly against the site's dark
   * canvas (everything else — accent/text/label — stays fixed per theme).
   */
  bg: { light: string; dark: string };
  /** Saturated swatch — card border, photo wash, footer rule. */
  accent: string;
  /** Primary dark text (title, excerpt, meta values) — reads on `bg`. */
  text: string;
  /** Secondary dark text (meta labels, footer date/dots) — reads on `bg`. */
  label: string;
}

/**
 * Per-category card styling, values taken exactly from the subteam
 * reference sheet (color_usage_map_toggle_3.html). Unlike site-wide theme
 * tokens, the accent/text/label stay fixed regardless of the toggle —
 * `bg.light` is untouched (exactly the reference sheet's value); `bg.dark`
 * is the same hue darkened further and rendered translucent + blurred
 * (see BlogCard's glass treatment) for a frosted look in dark mode.
 * (The oval badge on the photo stays theme-reactive/uniform, separately.)
 */
export const CATEGORY_STYLE: Record<BlogCategory, CategoryStyle> = {
  hardware: {
    bg: { light: "#FAEEDA", dark: "#C8BEAE" },
    accent: "#FAC775",
    text: "#5F3A0A",
    label: "#854F0B",
  },
  software: {
    bg: { light: "#E1F5EE", dark: "#B4C4BE" },
    accent: "#9FE1CB",
    text: "#085041",
    label: "#0F6E56",
  },
  firmware: {
    bg: { light: "#EEEDFE", dark: "#BEBECB" },
    accent: "#C5C6F5",
    text: "#26215C",
    label: "#3C3489",
  },
  computerVision: {
    bg: { light: "#FBEAF0", dark: "#C9BBC0" },
    accent: "#F4C0D1",
    text: "#4B1528",
    label: "#993556",
  },
  structure: {
    bg: { light: "#F1EFE8", dark: "#C1BFBA" },
    accent: "#D3D1C7",
    text: "#2C2C2A",
    label: "#5F5E5A",
  },
  aerodesign: {
    bg: { light: "#E6F1FB", dark: "#B8C1C9" },
    accent: "#B5D4F4",
    text: "#042C53",
    label: "#185FA5",
  },
  propulsion: {
    bg: { light: "#EAF3DE", dark: "#BBC2B2" },
    accent: "#C0DD97",
    text: "#173404",
    label: "#3B6D11",
  },
};

export interface BlogPostFull {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  category: BlogCategory;
  date: string;
  author: string;
  readTime: string;
}

export const BLOG_POSTS: BlogPostFull[] = [
  {
    id: 1,
    title: "Building Our First Autonomous Drone",
    excerpt:
      "Deep dive into the hardware and software architecture that powers our autonomous flight systems. Learn about the sensors, processors, and algorithms we use.",
    image:
      "https://images.unsplash.com/photo-1575686467550-7d2a658eb1cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcm9uZSUyMGZsaWdodCUyMHRlc3Rpbmd8ZW58MXx8fHwxNzczNjgzODg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "hardware",
    date: "Mar 10, 2026",
    author: "Sarah Chen",
    readTime: "8 min read",
  },
  {
    id: 2,
    title: "Optimizing Flight Control Algorithms",
    excerpt:
      "How we achieved 40% better flight stability through advanced PID tuning and machine learning techniques. A technical breakdown of our approach.",
    image:
      "https://images.unsplash.com/photo-1625459201773-9b2386f53ca2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2Z0d2FyZSUyMGNvZGUlMjBwcm9ncmFtbWluZ3xlbnwxfHx8fDE3NzM2ODM4ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "software",
    date: "Mar 8, 2026",
    author: "Alex Rivera",
    readTime: "6 min read",
  },
  {
    id: 3,
    title: "Custom PCB Design for Edge Computing",
    excerpt:
      "Designing and manufacturing our custom circuit boards for real-time processing. From schematic to production, here's our journey.",
    image:
      "https://images.unsplash.com/photo-1760842543713-108c3cadbba1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXJjdWl0JTIwYm9hcmQlMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc3MzY2MjE5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "hardware",
    date: "Mar 5, 2026",
    author: "Mike Thompson",
    readTime: "10 min read",
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
    id: 5,
    title: "Real-Time Object Detection for Navigation",
    excerpt:
      "Implementing computer vision models for obstacle avoidance and path planning. Our approach to edge AI processing.",
    image:
      "https://images.unsplash.com/photo-1612338762643-298feee70520?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2JvdGljcyUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzczNjM2NTEyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "computerVision",
    date: "Feb 28, 2026",
    author: "David Kim",
    readTime: "9 min read",
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
