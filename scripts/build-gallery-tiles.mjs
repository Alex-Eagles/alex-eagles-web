/**
 * build-gallery-tiles.mjs — grid-sized copies of the gallery photos.
 *
 * WHY THIS EXISTS
 * ---------------
 * Gallery.tsx has a `sizedImage()` helper that appends a Cloudinary width
 * transform, but every `imageUrl` in src/data/gallery.ts is a local
 * `gallery/*.webp` path, so that helper matched nothing and returned the URL
 * untouched. The grid was loading the full-size file into every tile — camera
 * originals up to 5712px wide — which is what made the page slow to fill in.
 *
 * Cloudinary resizes on the fly; local files can't, so the derivative has to
 * exist on disk. This writes one per photo into `public/gallery/tiles/`, at the
 * width a tile actually renders (a little over 2x for retina). The originals
 * stay put and are what the lightbox opens.
 *
 * Idempotent: a tile is only rebuilt when it is missing or older than its
 * source, so re-running after adding photos only does the new ones.
 *
 * USAGE
 *   node scripts/build-gallery-tiles.mjs [--width 640] [--quality 74] [--force]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(argv[i + 1]);
};

const SRC_DIR = "public/gallery";
const OUT_DIR = path.join(SRC_DIR, "tiles");
const WIDTH = flag("width", 640);
const QUALITY = flag("quality", 74);
const FORCE = argv.includes("--force");

const RASTER = /\.(jpe?g|png|webp)$/i;

fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs
  .readdirSync(SRC_DIR, { withFileTypes: true })
  .filter((e) => e.isFile() && RASTER.test(e.name))
  .map((e) => e.name)
  .sort();

let built = 0;
let fresh = 0;
let before = 0;
let after = 0;

for (const name of files) {
  const src = path.join(SRC_DIR, name);
  // Always .webp out, whatever went in — Gallery.tsx swaps the directory in the
  // URL and keeps the filename, so the extension has to survive the round trip.
  const out = path.join(OUT_DIR, name.replace(RASTER, ".webp"));

  if (!FORCE && fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) {
    fresh++;
    continue;
  }

  const input = fs.readFileSync(src);
  const buf = await sharp(input)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6, alphaQuality: 90 })
    .toBuffer();

  fs.writeFileSync(out, buf);
  before += input.length;
  after += buf.length;
  built++;

  console.log(
    `${name.padEnd(38)} ${(input.length / 1024).toFixed(0).padStart(6)}KB → ${(buf.length / 1024).toFixed(0).padStart(4)}KB`,
  );
}

console.log(
  `\n${built} built, ${fresh} already current` +
    (built
      ? `   ${(before / 1024 / 1024).toFixed(1)}MB → ${(after / 1024 / 1024).toFixed(2)}MB`
      : ""),
);
