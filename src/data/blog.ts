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
    bg: { light: "#9FD1BA", dark: "#10241D" },
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

/** Posts are kept newest-first (matching each `date`'s end-of-range), oldest at the bottom. */
export const BLOG_POSTS: BlogPostFull[] = [
  {
    id: 16,
    title: "Flight Controller v3: Revising the Design",
    excerpt:
      "Back into the flight controller design, working through a new iteration based on lessons from the PCBWay contest board. Testing is planned in the coming weeks.",
    image: "/images/blog/flight-controller-v3.png",
    imageFit: "contain",
    category: "hardware",
    date: "Jul 2026 – Present",
    author: "Hardware Team",
    readTime: "2 min read",
  },
  {
    id: 42,
    title: "Flight Testing & Competition Preparation",
    excerpt:
      "With the design locked in, the team moved into flight testing, working through final adjustments as real-world results came in against the simulation-based predictions. Competition documentation is being prepared alongside testing to finalize the aircraft for UAVC 2026.",
    image: "/images/blog/aerodesign-flight-testing.jpg",
    category: "aerodesign",
    date: "May – Jul 2026",
    author: "Aerodesign Team",
    readTime: "2 min read",
  },
  {
    id: 28,
    title: "Final Structural Assembly",
    excerpt:
      "The complete airframe was assembled by integrating the carbon fiber plates, folding arms, landing gear, payload mechanism, and structural hardware. All components were aligned, secured, and inspected to verify rigidity, dimensional accuracy, and readiness for electronics integration and flight testing.",
    image: "/images/blog/structure-final-assembly.png",
    category: "structure",
    date: "Jul 5, 2026",
    author: "Structure Team",
    readTime: "2 min read",
  },
  {
    id: 27,
    title: "Payload Mechanism Construction",
    excerpt:
      "The payload delivery mechanism was designed and fabricated to accommodate the rescue car while maintaining structural integrity and balanced weight distribution. The mechanism was integrated into the airframe to ensure reliable payload deployment during mission execution.",
    image: "/images/blog/structure-payload-mechanism.png",
    imageFit: "contain",
    category: "structure",
    date: "Jul 1, 2026",
    author: "Structure Team",
    readTime: "2 min read",
  },
  {
    id: 17,
    title: "Manufacturing a UGV for ICMTC",
    excerpt:
      "Applied our hardware design expertise to a new platform, manufacturing a ground vehicle for the ICMTC competition.",
    image: "/images/blog/ugv-icmtc.jpg",
    category: "hardware",
    date: "May – Jun 2026",
    author: "Hardware Team",
    readTime: "1 min read",
  },
  {
    id: 18,
    title: "PDB Design Review: What We'd Change Next",
    excerpt:
      "Reviewed our power distribution board's first revision, identified key improvement areas, and kicked off development of a next-generation version.",
    image: "/images/blog/pdb-design-review.webp",
    imageFit: "contain",
    category: "hardware",
    date: "Apr – Jun 2026",
    author: "Hardware Team",
    readTime: "1 min read",
  },
  {
    id: 26,
    title: "Hinge Assembly and Arm Installation",
    excerpt:
      "The folding hinges, arm mounts, and structural brackets were assembled using precision fasteners. This stage established the primary structural framework and ensured proper alignment and smooth operation of the folding arm mechanism.",
    image: "/images/blog/structure-hinge-assembly.png",
    category: "structure",
    date: "Jun 3, 2026",
    author: "Structure Team",
    readTime: "2 min read",
  },
  {
    id: 25,
    title: "Carbon Fiber Plate Manufacturing",
    excerpt:
      "The structural plates were manufactured from carbon fiber sheets using CNC machining. The machining process produced accurate profiles, mounting holes, and slots directly from the CAD model, ensuring high dimensional accuracy while maintaining a lightweight and rigid structure.",
    image: "/images/blog/structure-carbon-fiber-cnc.png",
    category: "structure",
    date: "Jun 2, 2026",
    author: "Structure Team",
    readTime: "2 min read",
  },
  {
    id: 24,
    title: "Wooden Prototype Fabrication",
    excerpt:
      "A full-scale wooden prototype was fabricated to validate the structural layout and overall dimensions. This prototype allowed verification of the assembly process, component positioning, and payload accommodation while minimizing manufacturing costs before machining the carbon fiber parts.",
    image: "/images/blog/structure-wooden-prototype.png",
    category: "structure",
    date: "May 31, 2026",
    author: "Structure Team",
    readTime: "2 min read",
  },
  {
    id: 23,
    title: "CAD Design (Fusion 360)",
    excerpt:
      "The drone structure was fully designed in Fusion 360, where all structural components, including the frame, folding arms, payload compartment, landing gear, and mounting interfaces, were modeled. The CAD model ensured proper component integration, manufacturability, and dimensional accuracy before fabrication.",
    image: "/images/blog/structure-cad-design.png",
    imageFit: "contain",
    category: "structure",
    date: "May 15, 2026",
    author: "Structure Team",
    readTime: "2 min read",
  },
  {
    id: 40,
    title: "Aerodynamic Validation (AVL & CFD)",
    excerpt:
      "The finalized geometry was run back through AVL to validate the lift, drag, and stability derivatives predicted during sizing, then cross-checked with ANSYS Fluent CFD simulations on the airfoil for a higher-fidelity look at surface pressure distribution. The two methods were compared against each other to refine drag estimates and confirm the aircraft's overall aerodynamic efficiency before the design was locked in.",
    image: "/images/blog/aerodesign-cfd-validation.jpg",
    category: "aerodesign",
    date: "Mid – Late Apr 2026",
    author: "Aerodesign Team",
    readTime: "3 min read",
  },
  {
    id: 41,
    title: "Design Documentation (PDR)",
    excerpt:
      "All of the sizing calculations, airfoil trade studies, structural CAD, and validation results were compiled into the team's formal design review package. Writing the review forced a second pass over every earlier decision, from wing loading to tail volume, to make sure the documented methodology matched what was actually built.",
    image: "/images/blog/aerodesign-design-review.png",
    category: "aerodesign",
    date: "Mar – Apr 2026",
    author: "Aerodesign Team",
    readTime: "3 min read",
  },
  {
    id: 39,
    title: "Fuselage Design & Aircraft Integration",
    excerpt:
      "The fuselage structure was developed to carry the wing, tail, propulsion, and payload loads through a single airframe, tying every subsystem together into one integrated design. Component placement was iterated to keep the center of gravity, aerodynamic requirements, and structural load paths all satisfied at once.",
    image: "/images/blog/aerodesign-fuselage-integration.png",
    category: "aerodesign",
    date: "Late Mar – Mid Apr 2026",
    author: "Aerodesign Team",
    readTime: "2 min read",
  },
  {
    id: 38,
    title: "Empennage & Stability Design",
    excerpt:
      "The horizontal and vertical stabilizers were sized and positioned to give the aircraft the tail volume it needed for pitch and yaw stability. Static margin was checked by comparing the neutral point against the center of gravity, and the mass balance was tuned until the trimmed configuration met the stability and control targets.",
    image: "/images/blog/aerodesign-empennage-wireframe.png",
    category: "aerodesign",
    date: "Mid Mar – Early Apr 2026",
    author: "Aerodesign Team",
    readTime: "2 min read",
  },
  {
    id: 37,
    title: "Primary Structural Design & CAD",
    excerpt:
      "The wing's internal structure was laid out spar by spar and rib by rib, with lightening holes cut into each rib to save weight without giving up bending or torsional stiffness. Preliminary CAD models tied the layout together, checking that the structure could actually be built and assembled the way it was designed.",
    image: "/images/blog/aerodesign-stability-empennage.jpg",
    category: "aerodesign",
    date: "Mar – Early Apr 2026",
    author: "Aerodesign Team",
    readTime: "2 min read",
  },
  {
    id: 36,
    title: "Airfoil Selection & Wing Optimization",
    excerpt:
      "Candidate airfoils, including the FX 76-MP-120, LNV109A, and MH 113, were compared against a refined NACA 6313 profile across lift, drag, and moment polars to find the best balance of stall behavior and efficiency. The winning section was then carried into the aspect ratio and taper ratio study, locking in the wing geometry used for the rest of the aerodynamic analysis.",
    image: "/images/blog/aerodesign-structural-cad.jpg",
    category: "aerodesign",
    date: "Feb – Early Mar 2026",
    author: "Aerodesign Team",
    readTime: "2 min read",
  },
  {
    id: 35,
    title: "Aircraft Sizing & Wing Concept Development",
    excerpt:
      "Constraint sizing was performed to define the aircraft's design point, working through stall speed, take-off distance, climb rate, cruise speed, and turn requirements to arrive at a wing loading of 131.92 kg/m² and a thrust-to-weight ratio of 0.3149. From there, an aspect ratio between 9 and 11 was selected to balance induced drag against maneuverability, fixing the wing's span, area, and taper for the conceptual design.",
    image: "/images/blog/aerodesign-aircraft-sizing-polar.jpg",
    category: "aerodesign",
    date: "Late Jan – Mid Feb 2026",
    author: "Aerodesign Team",
    readTime: "2 min read",
  },
  {
    id: 43,
    title: "Project Planning & Aircraft Requirements",
    excerpt:
      "Before any technical design began, the team laid out its project objectives, worked through the competition's requirements and design constraints, and turned all of it into an overall development roadmap. That roadmap became the backbone for every design decision that followed.",
    image: "/images/blog/aerodesign-wing-concept-render.png",
    category: "aerodesign",
    date: "Dec 2025 – Jan 2026",
    author: "Aerodesign Team",
    readTime: "2 min read",
  },
  {
    id: 19,
    title: "Designing Our Custom Power Distribution Board",
    excerpt:
      "Designed, built, and tested a custom power distribution board to power every onboard electronic system on the team's UAV.",
    image: "/images/blog/power-distribution-board.png",
    imageFit: "contain",
    category: "hardware",
    date: "Feb – Mar 2026",
    author: "Hardware Team",
    readTime: "1 min read",
  },
  {
    id: 34,
    title: "SUAS/UAVC: Mapping & GPS Synchronization",
    excerpt:
      "To figure out exactly where a detected target sits in the real world, we configured the onboard camera to tag every captured image with precise GPS coordinates and flight data. This synchronized data lets us stitch the images into an accurate map and pinpoint the exact real-world coordinates of each target.",
    image: "/images/blog/mapping-gps-sync.jpg",
    category: "computerVision",
    date: "May – Jun 2026",
    author: "AI Team",
    readTime: "3 min read",
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
    readTime: "2 min read",
  },
  {
    id: 33,
    title: "SUAS/UAVC: Aerial AI Model Selection (RF-DETR)",
    excerpt:
      "We evaluated several AI systems to act as the visual processor for our drone and selected RF-DETR. We chose it for its stability and its ability to more accurately spot small, irregularly shaped targets from high altitudes compared to other standard detection models.",
    image: "/images/blog/rf-detr-aerial.png",
    category: "computerVision",
    date: "Apr – May 2026",
    author: "AI Team",
    readTime: "2 min read",
  },
  {
    id: 32,
    title: "SUAS/UAVC: Synthetic Data Generation Pipeline",
    excerpt:
      "To train our AI without needing thousands of real photos, we built an automated pipeline that generates synthetic training images. Using Blender, we placed target objects into virtual environments to generate roughly 30,000 realistic images, teaching our detection model what to look for before it ever saw a real flight.",
    image: "/images/blog/suas-synthetic-data-pipeline.webp",
    category: "computerVision",
    date: "Mar – Apr 2026",
    author: "AI Team",
    readTime: "3 min read",
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
    readTime: "2 min read",
  },
  {
    id: 44,
    title: "Aircraft Stability & Propulsion Design",
    excerpt:
      "Completed the aircraft stability and control analysis alongside propulsion system optimization. Sized the empennage, selected the AT4130-450KV motor with an 18×8 APC-E propeller through trade-off analysis, and verified performance using eCalc, thrust, climb, take-off, and cruise analyses.",
    image: "/images/blog/aerodesign-stability-propulsion.png",
    category: "propulsion",
    date: "Mar – Apr 2026",
    author: "Propulsion Team",
    readTime: "3 min read",
  },
  {
    id: 22,
    title: "Propulsion System Design & Configuration Selection",
    excerpt:
      "The propulsion system was designed based on the required payload capacity, target endurance, and thrust-to-weight ratio. Propulsion calculations were performed to determine the required motor thrust, propeller diameter, and battery configuration. Based on this analysis, the MN6007-II brushless motors coupled with MF2211 propellers were selected to provide sufficient thrust while maintaining high efficiency. A Quad-X configuration was adopted due to its structural simplicity, balanced load distribution, high maneuverability, and ease of control.",
    image: "/images/blog/propulsion-system-design.png",
    imageFit: "contain",
    category: "propulsion",
    date: "Feb 13, 2026",
    author: "Propulsion Team",
    readTime: "3 min read",
  },
  {
    id: 31,
    title: "AIC: Fine-Tuning & Knowledge Retention",
    excerpt:
      "When we tried training our chosen baseline model on new drone footage, it started forgetting how to track general objects — a common AI issue known as catastrophic forgetting. To fix this, we used a training strategy that mixed our new aerial data with old general data, teaching the model new skills without erasing its foundational knowledge.",
    image: "/images/blog/aic-fine-tuning.jpg",
    category: "computerVision",
    date: "May – Jun 2026",
    author: "AI Team",
    readTime: "3 min read",
  },
  {
    id: 20,
    title: "Entering the PCBWay Design Contest",
    excerpt:
      "Entered the PCBWay Design Contest with an original flight controller module, engineered entirely in-house from schematic to layout.",
    image: "/images/blog/pcbway-contest-board.webp",
    category: "hardware",
    date: "Nov 2025 – Jan 2026",
    author: "Hardware Team",
    readTime: "1 min read",
  },
  {
    id: 30,
    title: "AIC: Dataset Analysis & Scoring Strategy",
    excerpt:
      "We analyzed the competition's data and realized much of it came from public sources, with only one set being a \"secret\" custom dataset. Because the competition leaderboard didn't tell us our exact score on that secret data, we developed a reverse-engineering method to calculate our true performance on this hidden data, letting us track our real progress.",
    image: "/images/blog/aic-scoring-strategy.png",
    imageFit: "contain",
    category: "computerVision",
    date: "Apr – May 2026",
    author: "AI Team",
    readTime: "3 min read",
  },
  {
    id: 29,
    title: "AIC: Baseline Selection & Efficiency Screening",
    excerpt:
      "We tested several existing AI tracking models to see which one performed best out-of-the-box on drone footage. We ultimately chose a model that was not only highly accurate but also fast and lightweight enough to run within the competition's strict hardware limits.",
    image: "/images/blog/aic-baseline-selection.svg",
    imageFit: "contain",
    category: "computerVision",
    date: "Mar – Apr 2026",
    author: "AI Team",
    readTime: "2 min read",
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
    readTime: "2 min read",
  },
  {
    id: 21,
    title: "Onboarding the Hardware Team on Altium Designer",
    excerpt:
      "Trained new members to proficiency in Altium Designer, building the team's core PCB design capability from the ground up.",
    image: "/images/blog/altium-designer.png",
    imageFit: "contain",
    category: "hardware",
    date: "Sep – Nov 2025",
    author: "Hardware Team",
    readTime: "1 min read",
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
    readTime: "2 min read",
  },
  {
    id: 14,
    title: "Sprint 2: Diffusion Models, Gimbal Control & Camera Streaming",
    excerpt:
      "Sprint 2 explored diffusion models for 3D texturing, implemented gimbal control via Herelink, and got camera stream acquisition working through Herelink.",
    image: "/images/blog/gimbal-camera-streaming.png",
    category: "computerVision",
    date: "Nov 17, 2025",
    author: "AI Team",
    readTime: "1 min read",
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
    readTime: "1 min read",
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
    readTime: "2 min read",
  },
  {
    id: 15,
    title: "Sprint 1: Dataset Generation with Blender",
    excerpt:
      "Kicked off with a synthetic dataset generation pipeline built in Blender — the foundation we'd use to train our computer vision models.",
    image: "/images/blog/dataset-generation-blender.png",
    category: "computerVision",
    date: "Oct 21, 2025",
    author: "AI Team",
    readTime: "1 min read",
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
