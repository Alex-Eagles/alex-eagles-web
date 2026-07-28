/**
 * publications.ts — THE CONTENT SOURCE for the History page's "Publications"
 * section.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  HOW TO ADD A PAPER                                                      ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                          ║
 * ║  1. Screenshot the paper's FIRST PAGE and drop it into:                  ║
 * ║               public/publications/                                        ║
 * ║     Portrait, roughly 3:4, ~400px wide as WebP. It's drawn small — it     ║
 * ║     reads as "this is a real paper", not as something to be read.        ║
 * ║                                                                          ║
 * ║  2. Add an entry below:                                                  ║
 * ║                                                                          ║
 * ║         {                                                                ║
 * ║           id: "some-stable-slug",                                        ║
 * ║           title: "The paper's title, exactly as printed",                ║
 * ║           authors: ["First Author", "Second Author"],                    ║
 * ║           venue: "Journal or conference",                                 ║
 * ║           venueDetail: "Vol. 15, No. 4, pp. 264-273",  // optional       ║
 * ║           year: "2024",                                                  ║
 * ║           field: "aerospace",       // "aerospace" | "computer-vision"   ║
 * ║           abstract: "The published abstract, verbatim.",                 ║
 * ║           href: "https://…",                                             ║
 * ║           preview: "/publications/some-stable-slug.webp",                ║
 * ║         }                                                                ║
 * ║                                                                          ║
 * ║  ORDER: newest first. Nothing sorts these — the array order is the       ║
 * ║  display order, so a paper can be pinned deliberately.                   ║
 * ║                                                                          ║
 * ║  ABSTRACTS: paste the real one, at whatever length it is. The section    ║
 * ║  clamps it to four lines and gives the reader a control to expand it, so ║
 * ║  a 2,000-character survey abstract and a 700-character one look the same ║
 * ║  until someone asks for more. Do NOT pre-truncate with an ellipsis — the ║
 * ║  old site did that at 750 characters and the cut text was simply gone.   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ─── EVERY CITATION HERE WAS READ OFF THE PAPER ─────────────────────────────
 * The old site's `publicationData.js` carried only a title, an abstract and a
 * link — no venue, no authors, no year. That is most of what makes a
 * publication list credible: "Toward Flare-Free Images: A Survey" with a link
 * is a claim, and the same title with "arXiv:2310.14354, October 2023, Kotp &
 * Torki" is a citation someone can check.
 *
 * So the venues, authors and years below were taken from the first pages of
 * the papers themselves (the same screenshots used as previews), with the
 * American Journal of Engineering and Applied Sciences entry additionally
 * confirmed against the publisher's own record. Nothing here was inferred from
 * a URL — the fixed-wing paper in particular is in the AIN SHAMS Engineering
 * Journal, not the Alexandria one its DOI prefix would suggest.
 */

/**
 * Research strand. The team publishes in two genuinely different areas, and
 * the tag is what lets a single chronological list show that without being
 * split into two short, awkward sub-lists.
 */
export type PublicationField = "aerospace" | "computer-vision";

/** Human-readable names for the tags. */
export const FIELD_LABELS: Record<PublicationField, string> = {
  aerospace: "Aerospace",
  "computer-vision": "Computer vision",
};

/** One paper. */
export interface Publication {
  /** Stable unique key. Never shown. */
  id: string;
  /** The title, exactly as printed on the paper. */
  title: string;
  /** Full author list, in the printed order. */
  authors: string[];
  /** The journal, conference or preprint server. */
  venue: string;
  /** Volume / issue / pages / identifier. Optional. */
  venueDetail?: string;
  year: string;
  field: PublicationField;
  /** The published abstract, verbatim and untruncated. */
  abstract: string;
  /** Where to read it. */
  href: string;
  /** First-page screenshot, in `public/publications/`. */
  preview: string;
}

/**
 * The papers, newest first.
 *
 * Chronological order happens to group them by field here — the two computer
 * vision papers are the recent ones — so the list reads as two clean runs
 * without anything being forced.
 */
export const publications: Publication[] = [
  {
    id: "flare-free-vision",
    title: "Flare-Free Vision: Empowering Uformer with Depth Insights",
    authors: ["Yousef Kotp", "Marwan Torki"],
    venue: "ICASSP 2024",
    venueDetail:
      "IEEE International Conference on Acoustics, Speech and Signal Processing",
    year: "2024",
    field: "computer-vision",
    abstract:
      "Image flare is a common problem that occurs when a camera lens is pointed at a strong light source. It can manifest as ghosting, blooming, or other artifacts that can degrade the image quality. We propose a novel deep learning approach for flare removal that uses a combination of depth estimation and image restoration. We use a Dense Vision Transformer to estimate the depth of the scene. This depth map is then concatenated to the input image, which is then fed into a Uformer, a general U-shaped transformer for image restoration. Our proposed method demonstrates state-of-the-art performance on the Flare7K++ test dataset, demonstrating its effectiveness in removing flare artifacts from images. Our approach also demonstrates robustness and generalization to real-world images with various types of flare. We believe that our work opens up new possibilities for using depth information for image restoration. The code is available on GitHub.",
    href: "https://www.researchgate.net/publication/376586936_FLARE-FREE_VISION_EMPOWERING_UFORMER_WITH_DEPTH_INSIGHTS_ICASSP2024",
    preview: "/publications/flare-free-vision.webp",
  },
  {
    id: "flare-survey",
    title: "Toward Flare-Free Images: A Survey",
    authors: ["Yousef Kotp", "Marwan Torki"],
    venue: "arXiv preprint",
    venueDetail: "arXiv:2310.14354 [eess.IV], 22 October 2023",
    year: "2023",
    field: "computer-vision",
    abstract:
      "Lens flare is a common image artifact that can significantly degrade image quality and affect the performance of computer vision systems due to a strong light source pointing at the camera. This survey provides a comprehensive overview of the multifaceted domain of lens flare, encompassing its underlying physics, influencing factors, types, and characteristics. It delves into the complex optics of flare formation, arising from factors like internal reflection, scattering, diffraction, and dispersion within the camera lens system. The diverse categories of flare are explored, including scattering, reflective, glare, orb, and starburst types. Key properties such as shape, color, and localization are analyzed. The numerous factors impacting flare appearance are discussed, spanning light source attributes, lens features, camera settings, and scene content. The survey extensively covers the wide range of methods proposed for flare removal, including hardware optimization strategies, classical image processing techniques, and learning-based methods using deep learning. It not only describes pioneering flare datasets created for training and evaluation purposes but also how they were created. Commonly employed performance metrics such as PSNR, SSIM, and LPIPS are explored. Challenges posed by flare's complex and data-dependent characteristics are highlighted. The survey provides insights into best practices, limitations, and promising future directions for flare removal research. Reviewing the state-of-the-art enables an in-depth understanding of the inherent complexities of the flare phenomenon and the capabilities of existing solutions. This can inform and inspire new innovations for handling lens flare artifacts and improving visual quality across various applications.",
    href: "https://www.researchgate.net/publication/374924443_Pre-Print_Toward_Flare-Free_Images_A_Survey",
    preview: "/publications/flare-survey.webp",
  },
  {
    id: "uav-fixed-wing",
    title:
      "Design and fabrication of a fixed-wing Unmanned Aerial Vehicle (UAV)",
    authors: [
      "Mohammed El Adawy",
      "Elhassan H. Abdelhalim",
      "Mohannad Mahmoud",
      "Mohamed Ahmed Abo zeid",
      "Ibrahim H. Mohamed",
      "Mostafa M. Othman",
      "Gehad S. ElGamal",
      "Yahia H. ElShabasy",
    ],
    venue: "Ain Shams Engineering Journal",
    venueDetail: "Vol. 14, article 102094",
    year: "2023",
    field: "aerospace",
    abstract:
      "Unmanned Aerial Vehicles (UAVs) have been widely used both in military and civil across the world in recent years. Nevertheless, their design always involves complex design optimization variables and decisions. Therefore, this paper aims to guide through the designing, manufacturing, and testing of an electrically powered radio-controlled aircraft for achieving a take-off, cruise, safe landing and carrying the highest payload possible. The whole process involves several phases, design phase, structural analysis, performance analysis, materials used, manufacturing, and finally aircraft testing. The final aircraft was designed with an empty weight and maximum take-off weight of 15.43 lbs and 33.07 lbs respectively while the wingspan, cruising speed and maximum speed were 70.1 in., 46 ft/s and 78 ft/sec respectively with a total take-off distance of 100 ft.",
    href: "https://www.sciencedirect.com/science/article/pii/S2090447922004051",
    preview: "/publications/uav-fixed-wing.webp",
  },
  {
    id: "low-reynolds-wing",
    title:
      "Low Reynolds Number Wing Design for Unmanned Aerial Vehicle: A Case Study",
    authors: [
      "Mohammed El-Adawy",
      "Alhassan H. Farid",
      "Mohamed Ahmed Hassan",
      "Mahmoud Abady",
      "Donia Medhat",
      "Habiba Abdullatif",
      "Omar Hassan",
      "Salaheldin Mohamed Thabet",
    ],
    venue: "American Journal of Engineering and Applied Sciences",
    venueDetail: "Vol. 15, No. 4, pp. 264-273",
    year: "2022",
    field: "aerospace",
    abstract:
      "With the widespread utilization of Unmanned Aerial Vehicles (UAVs) in many fields, it is essential to identify the parameters governing their design process. By taking the wing as a showcase, this study intends to guide through the design process of the wing, elaborate on some important definitions, and show how different parts of an aircraft affect each other. The current case study is limited to low Reynolds number (200,000: 500,000) wing design for unmanned aerial vehicle. The final wing was designed to be rectangular, a high wing with a span of 2 m, a chord of 0.4 m, and a corresponding aspect ratio of 5 with a total take-off weight of 10 kg. While the cruising speed and stall speeds were 14 and 11 m/s respectively.",
    href: "https://thescipub.com/abstract/10.3844/ajeassp.2022.264.273",
    preview: "/publications/low-reynolds-wing.webp",
  },
];
