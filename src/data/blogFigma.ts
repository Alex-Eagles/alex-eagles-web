/**
 * blog.ts — content for the full /blog page (build-log posts + category
 * filters), ported from the Figma "Aviation website" blog design.
 * Swap for a CMS/API later; the components don't care where it comes from.
 */

export type BlogCategory = "hardware" | "software" | "mechanical";

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
    category: "mechanical",
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
    category: "software",
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
    category: "hardware",
    date: "Feb 25, 2026",
    author: "Emma Watson",
    readTime: "5 min read",
  },
];

export interface BlogFilter {
  id: "all" | BlogCategory;
  label: string;
}

export const BLOG_FILTERS: BlogFilter[] = [
  { id: "all", label: "all" },
  { id: "hardware", label: "hardware" },
  { id: "software", label: "software" },
  { id: "mechanical", label: "mechanical" },
];
