/**
 * blog.ts — mock content for the Blog page (posts + the category filter set).
 * Swap these arrays for a CMS/API later; the components don't care where the
 * data comes from. Mirrors the shape used by the design resources, extended to
 * fit the Alex Eagles design system. Note: apostrophes use the curly ’ form.
 */

import { Cpu, Code2, Wrench, Radio, type LucideIcon } from "lucide-react";

/** Category ids used by both the posts and the filter bar. */
export type BlogCategory = "hardware" | "software" | "mechanical" | "avionics";

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: BlogCategory;
  /** Human date, e.g. "Mar 10, 2026". */
  date: string;
  author: string;
  /** e.g. "8 min read". */
  readTime: string;
  /**
   * Optional cover image (path under /public or an imported asset URL). When
   * omitted, BlogCard renders a branded gradient banner instead — so the page
   * looks intentional until real photography is dropped in.
   */
  image?: string;
}

/**
 * Per-category accent + icon. Keeps the badge colour and filter icon defined
 * in one place so a new category is a single edit. Colours echo the subteam
 * dots used on the Home page's "Latest updates" cards.
 */
export const CATEGORY_META: Record<
  BlogCategory,
  { label: string; accent: string; icon: LucideIcon }
> = {
  hardware: { label: "Hardware", accent: "#60A5FA", icon: Cpu },
  software: { label: "Software", accent: "#34D399", icon: Code2 },
  mechanical: { label: "Mechanical", accent: "#F59E0B", icon: Wrench },
  avionics: { label: "Avionics", accent: "#5458CC", icon: Radio },
};

/** The build-log posts, newest first. */
export const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: "Building our first autonomous drone",
    excerpt:
      "A deep dive into the hardware and software architecture that powers our autonomous flight systems — from the flight controller stack to the companion compute that runs onboard object detection.",
    category: "hardware",
    date: "Mar 10, 2026",
    author: "Sarah Chen",
    readTime: "8 min read",
  },
  {
    id: 2,
    title: "Autonomous waypoint mode goes hands-off",
    excerpt:
      "Our mission planner now flies a full waypoint lap unattended, including auto-takeoff and loiter. Here is how we validated the state machine on the bench before ever leaving the ground.",
    category: "software",
    date: "Mar 04, 2026",
    author: "A. Fathy",
    readTime: "6 min read",
  },
  {
    id: 3,
    title: "Carbon wing layup, start to finish",
    excerpt:
      "The main wing spar came out of the autoclave 8% under target mass while beating our spanwise stiffness goal. We walk through the mould prep, ply schedule, and cure cycle that got us there.",
    category: "mechanical",
    date: "Feb 25, 2026",
    author: "M. Khaled",
    readTime: "10 min read",
  },
  {
    id: 4,
    title: "Tuning the 915 MHz telemetry link",
    excerpt:
      "Dialing in the radio and ground-station antenna held a stable link out to 1.4 km on the test range with zero packet loss across the full mission profile. A field guide to our RF setup.",
    category: "avionics",
    date: "Feb 18, 2026",
    author: "S. Nour",
    readTime: "5 min read",
  },
  {
    id: 5,
    title: "Onboard object detection at the edge",
    excerpt:
      "Fitting a real-time detection model onto the companion computer without starving the flight loop. Quantisation, thermals, and the latency budget that keeps perception in sync with control.",
    category: "software",
    date: "Feb 09, 2026",
    author: "A. Fathy",
    readTime: "9 min read",
  },
  {
    id: 6,
    title: "Landing gear that survives a hard day",
    excerpt:
      "Iterating a 3D-printed then machined landing gear through drop tests until it shrugged off a 2.5 g touchdown. Notes on material choice, energy absorption, and where the first prototypes cracked.",
    category: "mechanical",
    date: "Jan 30, 2026",
    author: "L. Adel",
    readTime: "7 min read",
  },
];
