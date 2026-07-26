/**
 * cutout-svg-to-webp.mjs — flatten a background-removal SVG into a WebP cut-out.
 *
 * WHY THIS EXISTS
 * ---------------
 * The background-removal tool the team uses exports each cut-out as an SVG that
 * wraps *two copies* of the same full-resolution PNG:
 *
 *   <mask>  <image href="data:image/png;base64,…"/>   ← luminance = the alpha
 *   <g mask><image href="data:image/png;base64,…"/>   ← the colour pixels
 *
 * That costs ~2.5 MB per person, and it renders badly: browsers rasterise an
 * SVG's <filter>/<mask> region at the SVG's *declared* size (~605x806) and then
 * scale that bitmap up to the card, so the portrait looks pixelated until you
 * zoom. Flattening to a real WebP with an alpha channel fixes both — same
 * pixels, ~1% of the bytes, no filter rasterisation.
 *
 * WHAT IT DOES
 * ------------
 * Reproduces the SVG's compositing exactly rather than re-rendering it:
 *   1. alpha  = Rec.709 luma of the mask PNG (what the two feColorMatrix
 *               filters compute: RGB→white, alpha→luma, then mask→luminance)
 *   2. colour = the second PNG, unchanged
 *   3. crop   = the viewBox mapped back through the <image> transform matrix,
 *               intersected with the clipPath rect when one is present
 *
 * The output keeps the SVG's own aspect ratio on purpose. TeamMemberCard styles
 * cut-outs with `object-fit: contain; object-position: bottom`, so the intrinsic
 * ratio decides how big the person renders on the card — normalising to a fixed
 * ratio would resize and reseat every portrait.
 *
 * USAGE
 *   node scripts/cutout-svg-to-webp.mjs <dir> [--height 1000] [--quality 82]
 *                                       [--dry] [--keep]
 *
 * Converts every *.svg in <dir> to <slug>.webp beside it and deletes the SVG
 * (pass --keep to leave it). team.ts globs the folder for {png,webp,svg}, so the
 * roster picks the WebP up with no code change.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/* --- args ---------------------------------------------------------------- */

const argv = process.argv.slice(2);
const dir = argv.find((a) => !a.startsWith("--"));
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(argv[i + 1]);
};
const TARGET_HEIGHT = flag("height", 1000);
const QUALITY = flag("quality", 82);
const DRY = argv.includes("--dry");
const KEEP = argv.includes("--keep");

if (!dir) {
  console.error("usage: node scripts/cutout-svg-to-webp.mjs <dir> [--height N] [--quality N] [--dry] [--keep]");
  process.exit(1);
}

/* --- svg parsing --------------------------------------------------------- */

const num = "-?[\\d.]+";

/** Pull the two base64 PNGs apart: the one inside <defs> is the mask. */
function extractImages(svg) {
  const defsEnd = svg.indexOf("</defs>");
  if (defsEnd === -1) throw new Error("no <defs> — unexpected export shape");
  const b64 = /data:image\/(?:png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)/g;

  const inDefs = [];
  const after = [];
  for (const m of svg.matchAll(b64)) {
    (m.index < defsEnd ? inDefs : after).push(m[1]);
  }
  if (inDefs.length !== 1 || after.length !== 1) {
    throw new Error(`expected 1 mask + 1 colour image, got ${inDefs.length}+${after.length}`);
  }
  return {
    mask: Buffer.from(inDefs[0], "base64"),
    colour: Buffer.from(after[0], "base64"),
  };
}

function parseGeometry(svg) {
  const vb = new RegExp(`viewBox="(${num})\\s+(${num})\\s+(${num})\\s+(${num})"`).exec(svg);
  if (!vb) throw new Error("no viewBox");
  const [vx, vy, vw, vh] = vb.slice(1, 5).map(Number);

  const mx = new RegExp(
    `transform="matrix\\(\\s*(${num})\\s*,\\s*(${num})\\s*,\\s*(${num})\\s*,\\s*(${num})\\s*,\\s*(${num})\\s*,\\s*(${num})\\s*\\)"`,
  ).exec(svg);
  if (!mx) throw new Error("no transform matrix");
  const [a, b, c, d, e, f] = mx.slice(1, 7).map(Number);
  if (b !== 0 || c !== 0) throw new Error("rotated/skewed matrix not supported");

  // clipPath, when present, is always an axis-aligned rect in these exports.
  let clip = null;
  const cp = new RegExp(
    `<clipPath[^>]*><path d="M\\s*(${num})\\s+(${num})\\s+L\\s*(${num})\\s+(${num})\\s+L\\s*(${num})\\s+(${num})\\s+L\\s*(${num})\\s+(${num})`,
  ).exec(svg);
  if (cp) {
    const p = cp.slice(1, 9).map(Number);
    const xs = [p[0], p[2], p[4], p[6]];
    const ys = [p[1], p[3], p[5], p[7]];
    clip = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }

  return { vx, vy, vw, vh, a, d, e, f, clip };
}

/** Map a user-space rect back into source-image pixel space. */
const toImagePx = (g, r) => ({
  x0: (r.x0 - g.e) / g.a,
  x1: (r.x1 - g.e) / g.a,
  y0: (r.y0 - g.f) / g.d,
  y1: (r.y1 - g.f) / g.d,
});

/* --- conversion ---------------------------------------------------------- */

async function convert(svgPath) {
  const svg = fs.readFileSync(svgPath, "utf8");
  const { mask, colour } = extractImages(svg);
  const g = parseGeometry(svg);

  const { width: iw, height: ih } = await sharp(colour).metadata();

  // alpha = Rec.709 luma of the mask, matching the feColorMatrix the SVG uses.
  const maskRaw = await sharp(mask)
    .resize(iw, ih, { fit: "fill" }) // guard: masks are same-size in practice
    .removeAlpha()
    .raw()
    .toBuffer();

  const px = iw * ih;
  const alpha = Buffer.allocUnsafe(px);
  for (let i = 0, j = 0; i < px; i++, j += 3) {
    alpha[i] = (maskRaw[j] * 0.2126 + maskRaw[j + 1] * 0.7152 + maskRaw[j + 2] * 0.0722 + 0.5) | 0;
  }

  // viewBox ∩ clipPath, in image pixels, clamped to the bitmap.
  let r = toImagePx(g, { x0: g.vx, y0: g.vy, x1: g.vx + g.vw, y1: g.vy + g.vh });
  if (g.clip) {
    const c = toImagePx(g, g.clip);
    r = {
      x0: Math.max(r.x0, c.x0), x1: Math.min(r.x1, c.x1),
      y0: Math.max(r.y0, c.y0), y1: Math.min(r.y1, c.y1),
    };
  }
  const left = Math.max(0, Math.round(r.x0));
  const top = Math.max(0, Math.round(r.y0));
  const right = Math.min(iw, Math.round(r.x1));
  const bottom = Math.min(ih, Math.round(r.y1));
  const cw = right - left;
  const ch = bottom - top;
  if (cw <= 0 || ch <= 0) throw new Error("empty crop region");

  const height = Math.min(TARGET_HEIGHT, ch);
  const width = Math.max(1, Math.round((cw / ch) * height));

  // Materialise the RGBA composite as a real PNG before cropping/resizing.
  // Chaining extract/resize straight onto a raw-buffer joinChannel pipeline
  // loses the image dimensions in libvips — resize() then no-ops on one axis
  // and the result comes out black. Round-tripping through PNG keeps sharp
  // authoritative about the geometry; the extra encode costs ~0.3s per file.
  const rgbaPng = await sharp(await sharp(colour).removeAlpha().raw().toBuffer(), {
    raw: { width: iw, height: ih, channels: 3 },
  })
    .joinChannel(alpha, { raw: { width: iw, height: ih, channels: 1 } })
    .png({ compressionLevel: 1 })
    .toBuffer();

  const out = await sharp(rgbaPng)
    .extract({ left, top, width: cw, height: ch })
    .resize(width, height, { fit: "fill" })
    .webp({ quality: QUALITY, effort: 6, alphaQuality: 90 })
    .toBuffer();

  return { out, width, height, srcSize: Buffer.byteLength(svg), crop: { left, top, cw, ch }, iw, ih };
}

/* --- main ---------------------------------------------------------------- */

const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".svg")).sort();
if (!files.length) {
  console.log(`no .svg files in ${dir}`);
  process.exit(0);
}

let before = 0;
let after = 0;
let failed = 0;

for (const f of files) {
  const src = path.join(dir, f);
  const dest = path.join(dir, f.replace(/\.svg$/i, ".webp"));
  try {
    const r = await convert(src);
    before += r.srcSize;
    after += r.out.length;
    if (!DRY) {
      fs.writeFileSync(dest, r.out);
      if (!KEEP) fs.unlinkSync(src);
    }
    console.log(
      `${f.padEnd(30)} ${(r.srcSize / 1024 / 1024).toFixed(2)}MB → ${(r.out.length / 1024)
        .toFixed(0)
        .padStart(4)}KB  ${r.width}x${r.height}  (crop ${r.crop.cw}x${r.crop.ch} of ${r.iw}x${r.ih})`,
    );
  } catch (err) {
    failed++;
    console.error(`${f.padEnd(30)} FAILED: ${err.message}`);
  }
}

console.log(
  `\n${files.length - failed}/${files.length} converted` +
    `  ${(before / 1024 / 1024).toFixed(1)}MB → ${(after / 1024 / 1024).toFixed(2)}MB` +
    (before ? `  (${(100 - (after / before) * 100).toFixed(1)}% smaller)` : "") +
    (DRY ? "  [dry run — nothing written]" : ""),
);
if (failed) process.exitCode = 1;
