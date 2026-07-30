/**
 * build-srcset.mjs — emit width variants of a full-bleed image for `srcset`.
 *
 * WHY THIS EXISTS
 * ---------------
 * Member cards are pinned to fixed CSS widths, so one export at a sensible
 * ceiling covers every display. The Team hero is the opposite: it is
 * `width:100%; height:100%; object-fit:cover` over a `100svh` header, so the
 * pixels it needs scale with the viewport *and* the device pixel ratio. A
 * 2560-wide monitor at 2x needs ~5120px of image. Shipping one file that big to
 * everyone would be absurd, hence `srcset` — the browser picks the smallest
 * variant that still covers its screen.
 *
 * HEIC INPUT
 * ----------
 * sharp's bundled libheif refuses iPhone HDR/gain-map HEICs ("Number of
 * references in iref box exceeds the security limits"). Decode with Windows'
 * own HEIF codec first, then feed the PNG to this script:
 *
 *   Add-Type -AssemblyName PresentationCore
 *   $s = [IO.File]::OpenRead("in.HEIC")
 *   $d = [Windows.Media.Imaging.BitmapDecoder]::Create($s,'PreservePixelFormat','OnLoad')
 *   $e = New-Object Windows.Media.Imaging.PngBitmapEncoder
 *   $e.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($d.Frames[0]))
 *   $f = [IO.File]::Create("out.png"); $e.Save($f); $f.Close()
 *
 * USAGE
 *   node scripts/build-srcset.mjs <src> <outDir> <basename>
 *        [--widths 1280,1920,2560,3840] [--crop left,top,width,height]
 *        [--quality 80]
 *
 * Never upscales: a requested width above the source width is skipped, so the
 * generated set honestly reflects the detail actually available.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
// positional = not a --flag, and not the value belonging to one
const [src, outDir, base] = argv.filter(
  (a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--")),
);

if (!src || !outDir || !base) {
  console.error("usage: node scripts/build-srcset.mjs <src> <outDir> <basename> [--widths a,b,c] [--crop l,t,w,h] [--quality N]");
  process.exit(1);
}

const widths = String(opt("widths", "1280,1920,2560,3840")).split(",").map(Number);
const quality = Number(opt("quality", 80));
const crop = opt("crop", null)?.split(",").map(Number);

fs.mkdirSync(outDir, { recursive: true });

let pipeline = () => (crop ? sharp(src).extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[3] }) : sharp(src));

// .metadata() describes the *input*, not the result of .extract() — so when a
// crop is given, the effective source size is the crop box, not the file.
const raw = await sharp(src).metadata();
const meta = crop ? { width: crop[2], height: crop[3] } : raw;
console.log(
  `source: ${meta.width}x${meta.height}` +
    (crop ? ` (cropped out of ${raw.width}x${raw.height} at ${crop[0]},${crop[1]})` : ""),
);

let total = 0;
const emitted = [];
for (const w of widths.sort((a, b) => a - b)) {
  if (w > meta.width) {
    console.log(`  ${String(w).padStart(5)}w  skipped — source is only ${meta.width}px wide, refusing to upscale`);
    continue;
  }
  const h = Math.round((meta.height / meta.width) * w);
  const buf = await pipeline().resize(w, h).webp({ quality, effort: 6 }).toBuffer();
  const file = `${base}-${w}.webp`;
  fs.writeFileSync(path.join(outDir, file), buf);
  total += buf.length;
  emitted.push({ file, w });
  console.log(`  ${String(w).padStart(5)}w  ${file.padEnd(22)} ${(buf.length / 1024).toFixed(0).padStart(5)} KB  ${w}x${h}`);
}

console.log(`\n${emitted.length} variants, ${(total / 1024 / 1024).toFixed(2)} MB total (only one is ever downloaded per visitor)`);
