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

/**
 * Posts are kept newest-first, oldest at the bottom.
 *
 * `date` is always a plain "Mon YYYY" — one month, one year, no day numbers
 * and no ranges. Work that spanned several months is filed under the month it
 * mostly belongs to, so the footer of every card reads the same way.
 */
export const BLOG_POSTS: BlogPostFull[] = [
  {
    id: 16,
    title: "Flight Controller v3: Revising the Design",
    excerpt:
      "Back into the flight controller design, working through a new iteration based on lessons from the PCBWay contest board. Testing is planned in the coming weeks.",
    image: "/images/blog/flight-controller-v3.png",
    imageFit: "contain",
    category: "hardware",
    date: "Jul 2026",
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
    date: "Jul 2026",
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
    date: "Jul 2026",
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
    date: "Jul 2026",
    author: "Structure Team",
    readTime: "2 min read",
  },
  {
    id: 51,
    title: "How Far Can We Push the Link Before It Breaks?",
    excerpt:
      "An autonomous aircraft still needs a working link to the ground, for telemetry, for control authority if a human has to step in, and for the video and image data our whole detection pipeline depends on, so we test that link long before competition day. We walked it out the simplest way possible: physically increasing the distance between the aircraft and the Herelink ground unit while watching link quality, and it held telemetry, control, and video out to roughly 1.5 km, comfortably past anything the mission requires, exactly the margin you want between \"should work\" and \"does work.\" Range isn't the only way a link degrades, so we also deliberately obstructed the antennas mid-flight; control authority and video held with no loss, a good sign it degrades gracefully rather than dropping the moment line-of-sight isn't perfect. RF is exactly where subtle problems hide until the one day they don't: a link that's never been pushed past its comfortable range is one you're trusting on faith. Ours has already been pushed, on purpose, before it ever had to matter.",
    image: "/images/blog/fw-herelink-range.jpeg",
    category: "firmware",
    date: "Jun 2026",
    author: "Firmware Team",
    readTime: "2 min read",
  },
  {
    id: 17,
    title: "Manufacturing a UGV for ICMTC",
    excerpt:
      "Applied our hardware design expertise to a new platform, manufacturing a ground vehicle for the ICMTC competition.",
    image: "/images/blog/ugv-icmtc.jpg",
    category: "hardware",
    date: "Jun 2026",
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
    date: "Jun 2026",
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
    date: "Jun 2026",
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
    date: "Jun 2026",
    author: "Structure Team",
    readTime: "2 min read",
  },
  {
    id: 47,
    title: "Building the Map: When 4K Was the Problem",
    excerpt:
      "One of our mission jobs is to fly a search area and hand the judges a single stitched map that's actually useful: full coverage, correct geometry, clean stitching. We fly a lawnmower pattern capturing overlapping images and reconstruct them into a georeferenced orthomosaic with OpenDroneMap, which anchors each photo by its GPS geotag rather than guessing position from overlap, so the map stays globally consistent across a large area instead of bending. Our first plan (10 m/s, a photo every 0.3 s, full 4K) looked clean on the ground but wouldn't build in the air: the camera couldn't finish writing one 4K image before the next trigger, so we'd command 50 photos and get about 10, far too few for enough overlap. The fix was to slow to 6 m/s and drop to 1080p; faster writes kept the camera in pace and the slower pass packed in more overlap. Same camera, same software, but now the map built cleanly.",
    image: "/images/blog/sw-mapping.jpeg",
    category: "software",
    date: "May 2026",
    author: "Software Team",
    readTime: "3 min read",
  },
  {
    id: 24,
    title: "Wooden Prototype Fabrication",
    excerpt:
      "A full-scale wooden prototype was fabricated to validate the structural layout and overall dimensions. This prototype allowed verification of the assembly process, component positioning, and payload accommodation while minimizing manufacturing costs before machining the carbon fiber parts.",
    image: "/images/blog/structure-wooden-prototype.png",
    category: "structure",
    date: "May 2026",
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
    date: "May 2026",
    author: "Structure Team",
    readTime: "2 min read",
  },
  {
    id: 49,
    title: "Static Thrust Rig Testing for Fixed-Wing Propulsion System",
    excerpt:
      "To validate the selected propulsion system before integration into the fixed-wing aircraft, a dedicated static thrust test rig was designed and manufactured. The test rig enabled controlled evaluation of the selected motor, propeller, and ESC combination by measuring the generated static thrust and current draw at different throttle settings. These experimental measurements were compared with the propulsion calculations and eCalc simulation results to verify the accuracy of the design and ensure that the selected propulsion system could satisfy the required takeoff, climb, and cruise performance while operating within the specified electrical and thermal limits. The results confirmed the suitability of the selected propulsion configuration and provided confidence before its integration into the final fixed-wing aircraft.",
    image: "/images/blog/Thrust_testing.png",
    imageFit: "cover",
    category: "propulsion",
    date: "May 2026",
    author: "Propulsion Team",
    readTime: "3 min read",
  },
  {
    id: 52,
    title: "From Five Meters to Three Centimeters",
    excerpt:
      "Standard GPS is good enough to get an aircraft to roughly the right place, but \"roughly\" isn't good enough when the mission is dropping a payload on a specific target. We measured it directly: hovering over a marked ground target and over known surveyed coordinates with no correction, positioning error came out to 3–5 meters. Fine for most navigation; for a delivery mission scored on precision, it's the difference between hitting the target and missing by enough to matter. Turning on RTK corrections brought that same error down to as low as 3 centimeters, roughly a hundred-fold improvement, measured the same way on the same aircraft. That's not incremental; it's the difference between \"approximately there\" and \"exactly there.\" Sub-meter accuracy isn't a nice-to-have for payload delivery, it's the actual requirement the mission is scored against, and standard GPS simply can't get there on its own no matter how good the rest of the system is: RTK was the one piece that made the required accuracy possible at all.",
    image: "/images/blog/fw-rtk-gps.jpeg",
    category: "firmware",
    date: "Apr 2026",
    author: "Firmware Team",
    readTime: "2 min read",
  },
  {
    id: 40,
    title: "Aerodynamic Validation (AVL & CFD)",
    excerpt:
      "The finalized geometry was run back through AVL to validate the lift, drag, and stability derivatives predicted during sizing, then cross-checked with ANSYS Fluent CFD simulations on the airfoil for a higher-fidelity look at surface pressure distribution. The two methods were compared against each other to refine drag estimates and confirm the aircraft's overall aerodynamic efficiency before the design was locked in.",
    image: "/images/blog/aerodesign-cfd-validation.jpg",
    category: "aerodesign",
    date: "Apr 2026",
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
    date: "Apr 2026",
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
    date: "Apr 2026",
    author: "Aerodesign Team",
    readTime: "2 min read",
  },
  {
    id: 46,
    title: "The Camera System: One Camera, Three Jobs",
    excerpt:
      "Our SIYI A8 Mini isn't just \"the camera\": it feeds live video to the pilots, captures geotagged stills for object detection, and collects the imagery we later turn into a map, and making one camera serve all three reliably shaped a surprising amount of our design. For a detection to be useful, the image has to know exactly where it was taken, so rather than add a companion computer just to tag photos, we connected the camera over UART directly to the flight controller, which holds the GPS solution and stamps each image with its position at the instant of capture, keeping it lighter, simpler, and tightly timed. Every image is also saved to the camera's SD card, so we keep a full mission record even if the radio link drops. The camera bridges to our Herelink air unit over Ethernet, which puts its video on the same downlink the ground station already uses, giving the pilots a low-latency feed without a second video system to wire, power, and fail. Before it ever went on the aircraft, we built a dedicated test interface to exercise it in isolation: gimbal control, the video stream, and the capture-and-geotag pipeline. We also tested how images move to the ground: batching beat pulling them one-by-one, and it's what the mission pipeline uses.",
    image: "/images/blog/sw-mapping-camera.png",
    category: "software",
    date: "Mar 2026",
    author: "Software Team",
    readTime: "3 min read",
  },
  {
    id: 38,
    title: "Empennage & Stability Design",
    excerpt:
      "The horizontal and vertical stabilizers were sized and positioned to give the aircraft the tail volume it needed for pitch and yaw stability. Static margin was checked by comparing the neutral point against the center of gravity, and the mass balance was tuned until the trimmed configuration met the stability and control targets.",
    image: "/images/blog/aerodesign-empennage-wireframe.png",
    category: "aerodesign",
    date: "Mar 2026",
    author: "Aerodesign Team",
    readTime: "2 min read",
  },
  {
    id: 37,
    title: "Primary Structural Design & CAD",
    excerpt:
      "The wing's internal structure was laid out spar by spar and rib by rib, with lightening holes cut into each rib to save weight without giving up bending or torsional stiffness. Preliminary CAD models tied the layout together, checking that the structure could actually be built and assembled the way it was designed.",
    image: "/images/blog/aerodesign-structural-cad.jpg",
    category: "aerodesign",
    date: "Mar 2026",
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
    date: "Mar 2026",
    author: "Hardware Team",
    readTime: "1 min read",
  },
  {
    id: 44,
    title: "Aircraft Stability & Propulsion Design",
    excerpt:
      "Completed the aircraft stability and control analysis alongside propulsion system optimization. Sized the empennage, selected the AT4130-450KV motor with an 18×8 APC-E propeller through trade-off analysis, and verified performance using eCalc, thrust, climb, take-off, and cruise analyses.",
    image: "/images/blog/aerodesign-stability-propulsion.png",
    category: "propulsion",
    date: "Mar 2026",
    author: "Propulsion Team",
    readTime: "3 min read",
  },
  {
    id: 34,
    title: "SUAS/UAVC: Mapping & GPS Synchronization",
    excerpt:
      "To figure out exactly where a detected target sits in the real world, we configured the onboard camera to tag every captured image with precise GPS coordinates and flight data. This synchronized data lets us stitch the images into an accurate map and pinpoint the exact real-world coordinates of each target.",
    image: "/images/blog/mapping-gps-sync.jpg",
    category: "computerVision",
    date: "Mar 2026",
    author: "AI Team",
    readTime: "3 min read",
  },
  {
    id: 33,
    title: "SUAS/UAVC: Aerial AI Model Selection (RF-DETR)",
    excerpt:
      "We evaluated several AI systems to act as the visual processor for our drone and selected RF-DETR. We chose it for its stability and its ability to more accurately spot small, irregularly shaped targets from high altitudes compared to other standard detection models.",
    image: "/images/blog/rf-detr-aerial.png",
    category: "computerVision",
    date: "Mar 2026",
    author: "AI Team",
    readTime: "2 min read",
  },
  {
    id: 50,
    title: "Tuning Day: Getting From \"It Flies\" to \"It Flies Well\"",
    excerpt:
      "A drone that hovers isn't the same as one ready to fly a mission, and our tuning process earns its way there one stage at a time. We don't touch autonomous modes until manual flight looks right: first flights are flown in Stabilize with light inputs, backing off the PID gains and retrying if the response is wrong, then Altitude Hold, then a notch filter tuned from the early vibration signature to cut motor-frequency noise before it reaches the controller. After every stage we pull the logs: vibration, magnetometer interference, GPS quality. Every sensor reading gets checked before we advance, so a small problem is caught while it's still small instead of surfacing three stages later. Loiter is where AutoTune comes in, with a log review after each pass to decide if it's good enough, and only then do we verify Takeoff, Return-to-Launch, and Guided before any full mission is attempted. The proof is in a post-tune log: commanded 4.18° roll, got 4.14°; commanded −5.04° pitch, got −4.96°, under 0.1° of tracking error on both axes, which is the whole point of everything above.",
    image: "/images/blog/fw-tuning-pitch.png",
    category: "firmware",
    date: "Feb 2026",
    author: "Firmware Team",
    readTime: "3 min read",
  },
  {
    id: 36,
    title: "Airfoil Selection & Wing Optimization",
    excerpt:
      "Candidate airfoils, including the FX 76-MP-120, LNV109A, and MH 113, were compared against a refined NACA 6313 profile across lift, drag, and moment polars to find the best balance of stall behavior and efficiency. The winning section was then carried into the aspect ratio and taper ratio study, locking in the wing geometry used for the rest of the aerodynamic analysis.",
    image: "/images/blog/aerodesign-stability-empennage.jpg",
    category: "aerodesign",
    date: "Feb 2026",
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
    date: "Feb 2026",
    author: "Aerodesign Team",
    readTime: "2 min read",
  },
  {
    id: 32,
    title: "SUAS/UAVC: Synthetic Data Generation Pipeline",
    excerpt:
      "To train our AI without needing thousands of real photos, we built an automated pipeline that generates synthetic training images. Using Blender, we placed target objects into virtual environments to generate roughly 30,000 realistic images, teaching our detection model what to look for before it ever saw a real flight.",
    image: "/images/blog/suas-synthetic-data-pipeline.webp",
    category: "computerVision",
    date: "Feb 2026",
    author: "AI Team",
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
    date: "Feb 2026",
    author: "Propulsion Team",
    readTime: "3 min read",
  },
  {
    id: 31,
    title: "AIC: Fine-Tuning & Knowledge Retention",
    excerpt:
      "When we tried training our chosen baseline model on new drone footage, it started forgetting how to track general objects, a common AI issue known as catastrophic forgetting. To fix this, we used a training strategy that mixed our new aerial data with old general data, teaching the model new skills without erasing its foundational knowledge.",
    image: "/images/blog/aic-fine-tuning.jpg",
    category: "computerVision",
    date: "Feb 2026",
    author: "AI Team",
    readTime: "3 min read",
  },
  {
    id: 45,
    title: "Building Our Custom Ground Control Station",
    excerpt:
      "Off-the-shelf stations like Mission Planner and QGroundControl aren't built around the SUAS flow: fly laps, map an area, detect and verify two objects, and drop the right payload on each inside a 45-minute clock, so we built our own. Ours is a web app: a React front end over a Python backend split into separate services (MAVLink, camera, detection, payload) behind an API gateway, so a bug in one can't take down telemetry. We optimized for what actually moves the score: fast setup, with search boundaries pre-loaded and the lawnmower survey path auto-generated in under three seconds; operator verification, where each detection is queued for a one-click accept/reject instead of auto-dropping; and a judge-safe, always-on panel showing boundaries, position, speed, and altitude. We test the whole mission against an ArduPilot SITL simulated vehicle on the ground before it ever touches the real aircraft.",
    image: "/images/blog/sw-gcs.jpeg",
    category: "software",
    date: "Jan 2026",
    author: "Software Team",
    readTime: "3 min read",
  },
  {
    id: 48,
    title: "Test Drone Propulsion System Design & Validation",
    excerpt:
      "The propulsion system was designed based on the required thrust for takeoff, cruise, and landing, together with the target flight endurance and overall aircraft weight. Propulsion calculations were performed to determine the appropriate motor, propeller, ESC, and battery configuration capable of meeting the performance requirements of the 4 kg prototype platform. Following the preliminary calculations, the selected configuration was analysed and validated using eCalc simulations to verify thrust output, power consumption, efficiency, and expected flight time. Based on this analysis, MN5008-400KV brushless motors paired with 15×5 propellers and Air 40A ESCs were selected to provide the required thrust while maintaining efficient operation. A Quad-X configuration was adopted due to its structural simplicity, balanced load distribution, stable flight characteristics, and ease of control. This propulsion system was integrated into a 4 kg wooden test drone, which served as a development platform for validating the autonomous navigation system, flight controller integration, and other onboard subsystems before manufacturing the final carbon-fiber competition UAV with its upgraded propulsion configuration.",
    image: "/images/blog/test_drone.png",
    imageFit: "cover",
    category: "propulsion",
    date: "Jan 2026",
    author: "Propulsion Team",
    readTime: "3 min read",
  },
  {
    id: 20,
    title: "Entering the PCBWay Design Contest",
    excerpt:
      "Entered the PCBWay Design Contest with an original flight controller module, engineered entirely in-house from schematic to layout.",
    image: "/images/blog/pcbway-contest-board.webp",
    category: "hardware",
    date: "Jan 2026",
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
    date: "Jan 2026",
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
    date: "Jan 2026",
    author: "AI Team",
    readTime: "2 min read",
  },
  {
    id: 43,
    title: "Project Planning & Aircraft Requirements",
    excerpt:
      "Before any technical design began, the team laid out its project objectives, worked through the competition's requirements and design constraints, and turned all of it into an overall development roadmap. That roadmap became the backbone for every design decision that followed.",
    image: "/images/blog/aerodesign-wing-concept-render.png",
    category: "aerodesign",
    date: "Dec 2025",
    author: "Aerodesign Team",
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
    date: "Nov 2025",
    author: "Hardware Team",
    readTime: "1 min read",
  },
  {
    id: 14,
    title: "Sprint 2: Diffusion Models, Gimbal Control & Camera Streaming",
    excerpt:
      "Sprint 2 explored diffusion models for 3D texturing, implemented gimbal control via Herelink, and got camera stream acquisition working through Herelink.",
    image: "/images/blog/gimbal-camera-streaming.png",
    category: "computerVision",
    date: "Nov 2025",
    author: "AI Team",
    readTime: "1 min read",
  },
  {
    id: 15,
    title: "Sprint 1: Dataset Generation with Blender",
    excerpt:
      "Kicked off with a synthetic dataset generation pipeline built in Blender, the foundation we'd use to train our computer vision models.",
    image: "/images/blog/dataset-generation-blender.png",
    category: "computerVision",
    date: "Oct 2025",
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
