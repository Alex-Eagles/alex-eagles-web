/**
 * optimize-images.mjs — downscale and re-encode oversized source images.
 *
 * WHY THIS EXISTS
 * ---------------
 * Portraits come off a camera or a phone at full resolution — the 2026 intake
 * landed as 4284x5712 WebPs, ~2.2 MB each. The team grid renders a card 205 px
 * wide, so those files ship roughly twenty times more pixel data than any screen
 * can show, and Vite bundles every one of them eagerly (see the glob in
 * src/data/team.ts). Downscaling to a sane ceiling is the single biggest win
 * available on the Team page.
 *
 * Only files *above* the threshold are touched, so already-optimised images are
 * never re-encoded — repeated runs are idempotent and lossless-by-omission.
 *
 * The output keeps each image's aspect ratio and its slug. Cards resolve photos
 * by bare filename (`bySlug` in team.ts), so a `.jpeg` re-encoded to `.webp`
 * still matches its roster entry — but the original is deleted so a slug never
 * resolves to two files.
 *
 * USAGE
 *   node scripts/optimize-images.mjs <dir> [--max-width 1000] [--quality 82]
 *                                    [--min-width 1400] [--dry]
 *
 *   --max-width  longest edge of the output, in px
 *   --min-width  only process images at least this wide (skip already-small)
 *   --dry        report what would change, write nothing
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const argv = process.argv.slice(2);
const dir = argv.find((a) => !a.startsWith("--"));
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(argv[i + 1]);
};
const MAX_WIDTH = flag("max-width", 1000);
const MIN_WIDTH = flag("min-width", 1400);
const QUALITY = flag("quality", 82);
const DRY = argv.includes("--dry");

if (!dir) {
  console.error("usage: node scripts/optimize-images.mjs <dir> [--max-width N] [--min-width N] [--quality N] [--dry]");
  process.exit(1);
}

const RASTER = /\.(jpe?g|png|webp)$/i;
const files = fs.readdirSync(dir).filter((f) => RASTER.test(f)).sort();

let before = 0;
let after = 0;
let touched = 0;
let skipped = 0;

for (const f of files) {
  const src = path.join(dir, f);
  const size = fs.statSync(src).size;
  // Read into memory first: a WebP source re-encodes to its own path, and on
  // Windows sharp's lazy file handle blocks the overwrite.
  const input = fs.readFileSync(src);
  const meta = await sharp(input).metadata();

  if (meta.width < MIN_WIDTH) {
    skipped++;
    continue;
  }

  const width = Math.min(MAX_WIDTH, meta.width);
  const height = Math.round((meta.height / meta.width) * width);

  const buf = await sharp(input)
    .resize(width, height, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6, alphaQuality: 90 })
    .toBuffer();

  before += size;
  after += buf.length;
  touched++;

  const dest = path.join(dir, f.replace(RASTER, ".webp"));
  if (!DRY) {
    fs.writeFileSync(dest, buf);
    if (path.resolve(dest) !== path.resolve(src)) fs.unlinkSync(src);
  }

  console.log(
    `${f.padEnd(30)} ${(size / 1024).toFixed(0).padStart(6)}KB ${meta.width}x${meta.height}` +
      ` → ${(buf.length / 1024).toFixed(0).padStart(5)}KB ${width}x${height}`,
  );
}

console.log(
  `\n${touched} optimised, ${skipped} already small enough` +
    (touched
      ? `   ${(before / 1024 / 1024).toFixed(1)}MB → ${(after / 1024 / 1024).toFixed(2)}MB` +
        `  (${(100 - (after / before) * 100).toFixed(1)}% smaller)`
      : "") +
    (DRY ? "   [dry run — nothing written]" : ""),
);
