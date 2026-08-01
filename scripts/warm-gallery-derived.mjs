/**
 * warm-gallery-derived.mjs — force Cloudinary to build the gallery's derived
 * video URLs before a visitor asks for one.
 *
 * WHY THIS EXISTS
 * ---------------
 * Cloudinary generates a derived asset lazily, on the first request for it. For
 * video that generation is slow enough that the first request doesn't wait — it
 * answers 423 Locked and builds in the background, then serves 200 from then on.
 *
 * A <video> element treats that 423 as a load failure and does not retry, so the
 * first person to see a newly-added transformation gets a tile that never loads.
 * That is exactly what happened when the grid started asking for `w_640` clips:
 * every derivative was brand new, so every one answered 423 once.
 *
 * Running this after changing a video transform (or adding a clip) does that
 * first request from here instead, so the derivative already exists by the time
 * the site asks. Safe to re-run — an existing derivative just returns 200.
 *
 * USAGE
 *   node scripts/warm-gallery-derived.mjs [--retries 4]
 */
import { readFileSync } from "node:fs";

const argv = process.argv.slice(2);
const flagIdx = argv.indexOf("--retries");
const RETRIES = flagIdx === -1 ? 4 : Number(argv[flagIdx + 1]);

/* Kept in step with Gallery.tsx — sizedVideo() and videoPoster(). */
const TILE_VIDEO_WIDTH = 640;
const sizedVideo = (url) =>
  url.replace("/upload/", `/upload/w_${TILE_VIDEO_WIDTH},c_limit/`);
const videoPoster = (url) =>
  url
    .replace("/video/upload/", `/video/upload/so_0,w_${TILE_VIDEO_WIDTH},c_limit,q_auto/`)
    .replace(/\.(mp4|webm|mov)$/i, ".jpg");

const src = readFileSync("src/data/gallery.ts", "utf8");
const videos = [...src.matchAll(/videoUrl:\s*'([^']+)'/g)]
  .map((m) => m[1])
  .filter((u) => u.includes("res.cloudinary.com") && u.includes("/upload/"));

const targets = [];
for (const url of videos) {
  targets.push(sizedVideo(url));
  if (url.includes("/video/upload/")) targets.push(videoPoster(url));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function warm(url) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    let status = 0;
    try {
      // Range-limited: we only need to trigger generation, not download it all.
      const res = await fetch(url, { headers: { Range: "bytes=0-1" } });
      status = res.status;
      await res.arrayBuffer().catch(() => {});
    } catch {
      status = 0;
    }
    if (status === 200 || status === 206) return { url, status, attempt };
    // 423 = still building. Back off and ask again.
    await sleep(attempt * 2500);
  }
  return { url, status: "FAILED", attempt: RETRIES };
}

let ok = 0;
let bad = 0;
for (const url of targets) {
  const r = await warm(url);
  const short = url.replace("https://res.cloudinary.com/", "");
  if (r.status === "FAILED") {
    bad++;
    console.log(`FAILED   ${short}`);
  } else {
    ok++;
    console.log(`${String(r.status).padEnd(4)} x${r.attempt}  ${short}`);
  }
}

console.log(`\n${ok} ready, ${bad} failed, ${targets.length} derived URLs`);
if (bad) process.exitCode = 1;
