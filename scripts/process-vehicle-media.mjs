/**
 * Builds the web-ready media for the vehicle page's "Clover development process"
 * timeline and the "Clover in action" gallery from the raw camera/CAD sources.
 *
 *   node scripts/process-vehicle-media.mjs [sourceDir]
 *
 * Video is the expensive part of this page on Vercel's bandwidth, so every clip
 * is re-encoded rather than copied: capped at 960px wide, CRF 30, audio dropped
 * entirely (the page force-mutes every <video>, so shipping audio is pure waste),
 * and `faststart` so the moov atom is at the front and playback can begin before
 * the file finishes downloading. Each clip also gets a still poster, which is
 * what actually loads on first paint since the tiles use preload="none".
 *
 * Requires ffmpeg-static and sharp (both dev-only).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import ffmpeg from "ffmpeg-static";

const SRC = process.argv[2] ?? "D:/Mazen/alexeagles/website-26-repo/images";
const OUT_PROCESS = "public/vehicle/assets/process";
const OUT_GALLERY = "public/vehicle/assets/gallery";

/** Longest edge we ever display these at is ~720px (modal) / ~560px (tile). */
const IMG_WIDTH = 1400;
const VIDEO_WIDTH = 960;

const kb = (p) => (statSync(p).size / 1024).toFixed(0) + " KB";

function image(src, out, width = IMG_WIDTH) {
  const from = path.join(SRC, src);
  if (!existsSync(from)) throw new Error(`missing source: ${from}`);
  return sharp(from)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(out)
    .then(() => console.log(`  img  ${path.basename(out)}  ${kb(out)}`));
}

function video(src, out) {
  const from = path.join(SRC, src);
  if (!existsSync(from)) throw new Error(`missing source: ${from}`);
  execFileSync(ffmpeg, [
    "-y", "-loglevel", "error", "-i", from,
    "-an", "-sn", "-map_metadata", "-1",
    "-vf", `scale='min(${VIDEO_WIDTH},iw)':-2`,
    "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-crf", "30", "-preset", "slow", "-movflags", "+faststart",
    out,
  ]);
  console.log(`  vid  ${path.basename(out)}  ${kb(out)}`);
}

/** Poster frame, pulled a third of the way in so it is never a black fade-in. */
async function poster(src, out) {
  const from = path.join(SRC, src);
  // `ffmpeg -i` with no output always exits non-zero; the duration we want is
  // on stderr regardless, so read it off the thrown result.
  let probe = "";
  try {
    probe = execFileSync(ffmpeg, ["-hide_banner", "-i", from], { encoding: "utf8" });
  } catch (e) {
    probe = String(e.stderr ?? "");
  }
  const raw = path.join(path.dirname(out), "__frame.png");
  const dur = /Duration: (\d+):(\d+):([\d.]+)/.exec(probe);
  const seconds = dur ? (+dur[1] * 3600 + +dur[2] * 60 + +dur[3]) / 3 : 0.5;
  execFileSync(ffmpeg, [
    "-y", "-loglevel", "error", "-ss", seconds.toFixed(2), "-i", from,
    "-frames:v", "1", raw,
  ]);
  await sharp(raw).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 74 }).toFile(out);
  execFileSync(process.platform === "win32" ? "cmd" : "rm",
    process.platform === "win32" ? ["/c", "del", path.resolve(raw)] : [raw]);
  console.log(`  post ${path.basename(out)}  ${kb(out)}`);
}

mkdirSync(OUT_PROCESS, { recursive: true });
mkdirSync(OUT_GALLERY, { recursive: true });

const P = (f) => path.join(OUT_PROCESS, f);
const G = (f) => path.join(OUT_GALLERY, f);

console.log("timeline stills");
await image("firstimage .jpeg", P("01-concept-cad.webp"));
await image("second image .jpeg", P("02-prototype-top.webp"));
await image("secondimage 2.jpeg", P("02-prototype-stand.webp"));
await image("third image.jpeg", P("03-carbon-plate.webp"));
await image("fourth image .jpeg", P("04-integration-top.webp"));
await image("fourth image 2.jpeg", P("04-integration-wiring.webp"));
await image("fourth image 3.jpeg", P("04-integration-bay.webp"));

console.log("timeline clips");
video("download.mp4", P("03-cnc-cut.mp4"));
await poster("download.mp4", P("03-cnc-cut.webp"));
video("video3.mp4", P("03-cnc-pass.mp4"));
await poster("video3.mp4", P("03-cnc-pass.webp"));
video("autotuning.mp4", P("05-autotune.mp4"));
await poster("autotuning.mp4", P("05-autotune.webp"));
video("flighttest.mp4", P("06-flight-test.mp4"));
await poster("flighttest.mp4", P("06-flight-test.webp"));

console.log("gallery");
video("show_off.mp4", G("show-off.mp4"));
await poster("show_off.mp4", G("show-off.webp"));
await image("cool_night_drone.jpeg", G("night-lights.webp"));
await image("flying at night .jpeg", G("night-hover.webp"));
await image("show2.png", G("field-ready.webp"));

console.log("done");
