/**
 * mediaCoverage.ts — THE CONTENT SOURCE for the History page's "Media
 * Coverage" section.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  HOW TO ADD A PIECE OF COVERAGE                                          ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                          ║
 * ║  1. Drop a 16:9 still from the segment (or a screenshot of the article)  ║
 * ║     into:   public/press/                                                ║
 * ║                                                                          ║
 * ║  2. If the outlet is NEW, drop its logo into:                            ║
 * ║               public/press/outlets/                                      ║
 * ║     If we've been on it before, reuse the logo that's already there.     ║
 * ║                                                                          ║
 * ║  3. Add an entry to the array below:                                     ║
 * ║                                                                          ║
 * ║         {                                                                ║
 * ║           id: "dmc-2022-interview-3",                                    ║
 * ║           outlet: "DMC",                                                 ║
 * ║           outletLogo: "/press/outlets/dmc.webp",                         ║
 * ║           kind: "interview",        // "interview" | "article"           ║
 * ║           thumbnail: "/press/dmc-interview-3.webp",                      ║
 * ║           href: "https://…",                                             ║
 * ║           date: "May 2022",         // optional                          ║
 * ║           language: "Arabic",       // optional; omit when English       ║
 * ║         }                                                                ║
 * ║                                                                          ║
 * ║  FORMAT: 16:9 landscape WebP, ~800px wide (that covers a retina screen   ║
 * ║  at the size these are drawn). Tiles crop to fill, so anything far from  ║
 * ║  16:9 loses its top and bottom.                                          ║
 * ║                                                                          ║
 * ║  LOGOS: a NEW outlet's logo has to be prepared before it can go in —     ║
 * ║  see "the logos keep their brand colour" below. Drop the original in     ║
 * ║  public/press/outlets/ and ask for the same treatment; don't hand-place  ║
 * ║  a raw brand logo here or it will be unreadable on at least one still.   ║
 * ║                                                                          ║
 * ║  ORDER: the array order is the display order. Nothing sorts these.       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ─── ONE ENTRY = ONE PIECE, NOT ONE OUTLET ──────────────────────────────────
 * DMC ran two separate interviews, so DMC appears twice. Grouping by outlet
 * was the old site's shape and it made the two DMC segments share one card
 * while every other outlet had a card to itself — the grid never lined up, and
 * a visitor couldn't tell that the two DMC stills were different appearances
 * rather than two crops of one. One entry per piece gives a uniform grid and
 * makes the count honest: six tiles, six times the team was on air or in print.
 *
 * ─── THE LOGOS KEEP THEIR BRAND COLOUR ──────────────────────────────────────
 * The files in public/press/outlets/ are NOT the brand originals. Each one has
 * been processed twice, and both passes matter if you ever add an outlet.
 *
 * 1. LIGHTNESS FLOOR. As supplied these marks cannot share a background: CBC is
 *    navy, DMC is black type in a coloured ring, Youm7 ships as dark type
 *    inside a solid white box. They sit on a dark scrim over a photograph, so
 *    three of the five were unreadable and one was a white rectangle.
 *
 *    Only LIGHTNESS is touched, and only where a pixel was too dark to survive
 *    the scrim. Hue and saturation are left exactly alone, so MBC stays MBC
 *    red and DMC keeps its orange-to-purple ring — the marks are lifted, not
 *    recoloured. Youm7's white box is keyed out separately, since that white is
 *    baked into the file rather than being part of the mark.
 *
 *    The one place colour genuinely can't be preserved is BLACK type (DMC's
 *    wordmark, half of Youm7's): black has no hue to keep, and it cannot be
 *    made visible on black while staying black, so it goes to near-white.
 *    Pixels that were already light — the knockout inside MBC's square, the
 *    white "ON" — are passed through untouched.
 *
 * 2. OPTICAL BALANCE. CBC is a wide wordmark, MBC a tall stacked mark. Sized to
 *    a common height they read as one enormous brand and one tiny one, so each
 *    is scaled until its INK AREA matches the others and centred on a shared
 *    canvas. That's what lets the component draw all five at one CSS height
 *    with no per-outlet special-casing.
 *
 * A new outlet's logo needs both passes before it will sit correctly. The
 * component adds a pair of drop-shadows on top, which is what keeps coloured
 * ink separated from a busy still.
 */

/** What the link actually opens — this picks the tile's icon and caption. */
export type CoverageKind = "interview" | "article";

/** One appearance: one segment, or one article. */
export interface CoverageItem {
  /** Stable unique key. Never shown. */
  id: string;
  /** The channel or paper, as it should read on the tile. */
  outlet: string;
  /**
   * The outlet’s name in its own language, when that differs from the Latin
   * form on the tile. Not rendered as a caption — it goes on the tile’s
   * accessible name so the site search can find the outlet the way an Arabic
   * reader would actually type it.
   */
  outletNative?: string;
  /** Its logo, in `public/press/outlets/`. Dark-on-transparent — see above. */
  outletLogo: string;
  kind: CoverageKind;
  /** 16:9 still, in `public/press/`. */
  thumbnail: string;
  /** Where the piece lives. Every one of these opens off-site. */
  href: string;
  /**
   * When it ran. Optional, and genuinely absent for most of these: a Facebook
   * watch URL carries no date, and inventing one to make the tiles look
   * uniform would be putting a made-up fact on the page. Tiles without a date
   * simply don't show one.
   */
  date?: string;
  /** Noted only when it ISN'T English. */
  language?: string;
}

/* ---- responsive stills ---------------------------------------------------- */

/**
 * The widths each still is ALSO published at, beside its 800px master.
 *
 * MUST match WIDTHS in `art-source/press/responsive.py`, which is what actually
 * writes the files. Add a width in one place only and the srcset below will
 * advertise a file that 404s.
 *
 * ─── WHY THESE TWO ──────────────────────────────────────────────────────────
 * A tile is drawn at roughly 300px wide on a phone and 355px at the widest
 * desktop layout. So the useful sizes are about 355 (a DPR 1 screen), 610-710
 * (DPR 2, the overwhelming majority of phones) and 800+ (DPR 3). 400 and 640
 * cover the first two; the master covers the third.
 *
 * Every device was being sent the 800px master — around 1.3x more pixels than a
 * DPR 2 phone can display and more than double what a DPR 1 screen can, six
 * times over.
 */
const RESPONSIVE_WIDTHS = [400, 640] as const;

/**
 * Build a `srcset` for a still from its master's path, by convention:
 * `/press/cbc-interview.webp` also exists as `-400` and `-640`.
 *
 * Derived rather than listed per item on purpose. Written out in the data, the
 * three paths for six stills would be eighteen strings to keep in step with a
 * script's output by hand, and the failure mode of getting one wrong is a
 * broken image that only appears at one screen width on one device.
 *
 * The master is included at its true width, so a DPR 3 phone still gets it.
 */
export function thumbnailSrcSet(thumbnail: string): string {
  const base = thumbnail.replace(/\.webp$/, "");
  const smaller = RESPONSIVE_WIDTHS.map(
    (width) => `${base}-${width}.webp ${width}w`,
  );
  return [...smaller, `${thumbnail} 800w`].join(", ");
}

/**
 * How wide a tile actually is, so the browser can pick a width instead of
 * assuming the image fills the viewport.
 *
 * Without this the default is `100vw` and every phone takes the 800px master —
 * i.e. the srcset above would buy nothing at all. The values track the grid in
 * MediaCoverage: three columns inside a 1180px shell at lg, two from sm, one
 * below that, minus the section's padding and the panel's.
 */
export const THUMBNAIL_SIZES =
  "(min-width: 1024px) 355px, (min-width: 640px) 46vw, calc(100vw - 88px)";

/**
 * Every appearance, in the order shown.
 *
 * All six came across from the old site's `mediaCoverageData.js` — same links,
 * same stills, re-encoded to WebP (6MB of PNG became ~205KB).
 */
export const mediaCoverage: CoverageItem[] = [
  {
    id: "youm7-2022-article",
    outlet: "Youm7",
    outletNative: "اليوم السابع",
    outletLogo: "/press/outlets/youm7.webp",
    kind: "article",
    thumbnail: "/press/youm7-article.webp",
    href: "https://www.youm7.com/story/2022/5/11/%D9%81%D9%88%D8%B2-%D9%81%D8%B1%D9%8A%D9%82-%D8%A3%D9%84%D9%8A%D9%83%D8%B3-%D8%A5%D9%8A%D8%AC%D9%84%D8%B2-%D8%A8%D9%87%D9%86%D8%AF%D8%B3%D8%A9-%D8%A7%D9%84%D8%A5%D8%B3%D9%83%D9%86%D8%AF%D8%B1%D9%8A%D8%A9-%D8%A8%D8%B0%D9%87%D8%A8%D9%8A%D8%A9-%D8%A7%D9%84%D8%B9%D8%A7%D9%84%D9%85-%D9%81%D9%89-%D8%A7%D9%84%D9%85%D8%B3%D8%A7%D8%A8%D9%82%D8%A9/5757993",
    // Corroborated by the URL path, which is /2022/5/11/.
    date: "11 May 2022",
    language: "Arabic",
  },
  {
    id: "mbc-interview",
    outlet: "MBC",
    outletLogo: "/press/outlets/mbc.webp",
    kind: "interview",
    thumbnail: "/press/mbc-interview.webp",
    href: "https://www.facebook.com/watch/?extid=CL-UNK-UNK-UNK-AN_GK0T-GK1C&mibextid=f7Mr7V&v=1437983910432053",
    date: "15 May 2022",
    language: "Arabic",
  },
  {
    id: "cbc-interview",
    outlet: "CBC",
    outletLogo: "/press/outlets/cbc.webp",
    kind: "interview",
    thumbnail: "/press/cbc-interview.webp",
    href: "https://www.facebook.com/watch/?extid=CL-UNK-UNK-UNK-AN_GK0T-GK1C&mibextid=f7Mr7V&v=346746660408271",
    date: "26 January 2022",
    language: "Arabic",
  },
  {
    id: "ontv-article",
    outlet: "ON",
    outletLogo: "/press/outlets/ontv.webp",
    // A post on ON's page rather than a video, so it gets the link icon and
    // not the play triangle. The distinction is the whole reason `kind`
    // exists: a play button that opens a wall of text is a broken promise.
    kind: "article",
    thumbnail: "/press/ontv-article.webp",
    href: "https://www.facebook.com/211569335569650/posts/5304667176259815/?sfnsn=scwspwa",
    date: "14 May 2022",
    language: "Arabic",
  },
  {
    id: "dmc-interview-1",
    outlet: "DMC",
    outletLogo: "/press/outlets/dmc.webp",
    kind: "interview",
    thumbnail: "/press/dmc-interview-1.webp",
    href: "https://www.facebook.com/watch/?v=721490192512679&extid=NS-UNK-UNK-UNK-IOS_GK0T-GK1C",
    date: "30 May 2022",
    language: "Arabic",
  },
  {
    id: "dmc-interview-2",
    outlet: "DMC",
    outletLogo: "/press/outlets/dmc.webp",
    kind: "interview",
    thumbnail: "/press/dmc-interview-2.webp",
    href: "https://www.facebook.com/watch/?extid=CL-UNK-UNK-UNK-AN_GK0T-GK1C&mibextid=f7Mr7V&v=724662708727320",
    date: "15 May 2022",
    language: "Arabic",
  },
];
