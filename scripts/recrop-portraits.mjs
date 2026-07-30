/**
 * recrop-portraits.mjs — re-frame a member portrait without redoing any art work.
 *
 * WHY THIS EXISTS
 * ---------------
 * Card framing is baked into the image file: the card is `aspect-ratio: 0.74` with
 * `object-fit: cover`, and the photos are 0.75, so the card shows essentially the
 * whole file. There is no CSS knob for "more space above the head" — the crop has
 * to change. Re-cropping by hand means re-decoding the phone's HEIC, re-running
 * background removal, and re-guessing the numbers every time.
 *
 * So the expensive steps are done once and parked in `art-source/members/`:
 *
 *   <slug>.webp         full-res photo, straight off the phone (3024x4032)
 *   <slug>-cutout.png   the same 3024x4032 grid with the background removed
 *
 * Both plates share one coordinate system, so a single crop window drives both
 * layers. Tuning is then just editing a number below and re-running — no network,
 * no ML model, a couple of seconds.
 *
 * TUNING
 * ------
 * Edit the MEMBERS table, run the script, reload the Team page. The knobs:
 *
 *   headroom    fraction of the card height left empty above the top of the head.
 *               THIS IS THE ONE YOU WANT. Bigger = subject sits lower, more sky
 *               above them, more cropped off their legs. 0.18 is the house look;
 *               0.10 is tight, 0.28 is airy.
 *   headY       y of the top of the head in the source plate, in pixels. Measured,
 *               not chosen — only change it if the script mis-frames someone.
 *   centerX     horizontal centre of the crop, in source pixels. Pan left/right.
 *   cropWidth   width of the crop window, in source pixels. Zoom: smaller = closer.
 *
 * Run one member instead of all three by naming them:
 *
 *   node scripts/recrop-portraits.mjs                 # everyone
 *   node scripts/recrop-portraits.mjs nour-walid      # just her
 *   node scripts/recrop-portraits.mjs --dry           # print the maths, write nothing
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import sharp from "sharp";

// ─── TUNE HERE ──────────────────────────────────────────────────────────────
const MEMBERS = {
  "mira-barsoum-2026": { headroom: 0.30, headY: 2600, centerX: 1548, cropWidth: 1149 },
  "nour-walid": { headroom: 0.18, headY: 2591, centerX: 1572, cropWidth: 1149 },
  "jana-hani": { headroom: 0.3, headY: 2354, centerX: 1440, cropWidth: 1284 },
};
// ────────────────────────────────────────────────────────────────────────────

/** Card geometry and output sizes, matched to the rest of the 2026 intake. */
const RATIO = 0.75; // width / height of the crop window
const PHOTO_W = 1400;
const CUTOUT_H = 1400;
/** The cut-out layer is drawn `object-fit: contain; object-position: bottom`, so it
 *  is trimmed to the silhouette and re-padded — the existing 2026 cut-outs all sit
 *  on a 1050x1400 canvas with ~4% of the height clear above the head. */
const CUTOUT_HEADROOM = 0.042;

/*
 * Encode quality. These are not "as high as we can afford" — they are matched to
 * what the rest of the roster weighs, and that matters for motion, not just for
 * bandwidth. The card reveal fades the flat portrait out and the cut-out in; both
 * have to be decoded to composite that first frame, and a file twice the weight of
 * its neighbours makes its own card visibly stutter while every other card is
 * smooth. The 2026 intake sits around 146 KB per portrait and 84 KB per cut-out,
 * so aim there. Raise these and you will feel it on the first hover.
 */
const PHOTO_Q = 62;
const CUTOUT_Q = 70;
const CUTOUT_ALPHA_Q = 68;

const here = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const ART = path.join(root, "art-source", "members");
const PHOTOS = path.join(root, "src", "assets", "members", "photos");
const CUTOUTS = path.join(root, "src", "assets", "members", "cutouts");

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const only = argv.filter((a) => !a.startsWith("--"));
const slugs = only.length ? only : Object.keys(MEMBERS);

for (const slug of slugs) {
  const cfg = MEMBERS[slug];
  if (!cfg) {
    console.error(`unknown member "${slug}" — known: ${Object.keys(MEMBERS).join(", ")}`);
    process.exitCode = 1;
    continue;
  }

  // Catch a headroom that can't be honoured before it silently clamps to the top
  // of the frame and looks like "the script did nothing".
  if (!(cfg.headroom >= 0 && cfg.headroom <= 0.45)) {
    console.error(
      `${slug}: headroom ${cfg.headroom} is out of range. It is a fraction of the` +
        ` card height, so 0.30 means 30% of the card is left clear above the head.` +
        ` Useful values run 0.10 (tight) to 0.35 (airy) — at 1.0 the entire card` +
        ` would be the space above them, with their head at the bottom edge.`,
    );
    process.exitCode = 1;
    continue;
  }

  const photoPlate = path.join(ART, `${slug}.webp`);
  const cutoutPlate = path.join(ART, `${slug}-cutout.png`);
  for (const p of [photoPlate, cutoutPlate]) {
    if (!fs.existsSync(p)) throw new Error(`missing plate: ${p}`);
  }

  const { width: W, height: H } = await sharp(photoPlate).metadata();

  // The crop window: fixed aspect, positioned so the head lands `headroom` down.
  const w = Math.min(W, Math.round(cfg.cropWidth));
  const h = Math.round(w / RATIO);
  const left = Math.max(0, Math.min(W - w, Math.round(cfg.centerX - w / 2)));
  const top = Math.max(0, Math.min(H - h, Math.round(cfg.headY - cfg.headroom * h)));

  // Clamping above can quietly change the framing — report what actually landed.
  const actual = ((cfg.headY - top) / h) * 100;
  console.log(
    `${slug.padEnd(20)} crop ${w}x${h} @ ${left},${top}` +
      `   headroom ${actual.toFixed(1)}%` +
      (Math.abs(actual - cfg.headroom * 100) > 0.6 ? "  ← clamped by the frame edge" : ""),
  );
  if (DRY) continue;

  const window = { left, top, width: w, height: h };

  // Photo layer — the card's `object-fit: cover` shows this almost whole.
  await sharp(photoPlate)
    .extract(window)
    .resize(PHOTO_W, Math.round(PHOTO_W / RATIO), { fit: "fill" })
    .webp({ quality: PHOTO_Q, effort: 6 })
    .toFile(path.join(PHOTOS, `${slug}.webp`));

  // Cut-out layer — same window, then trimmed to the silhouette and re-padded.
  // Two passes on purpose: chained after `extract`, sharp's `trim` measures the
  // *pre-extract* image and throws "bad extract area".
  const windowed = await sharp(cutoutPlate).extract(window).png().toBuffer();

  // Drop everything above the head before trimming. The matting model sometimes
  // keeps a scrap of background fused to someone's hair (a palm frond, a lamp
  // post); it floats over the card, and because the trim box grows to contain it
  // the subject gets scaled down and sits lower than everyone else's.
  const headLine = Math.max(0, Math.min(h - 1, Math.round(cfg.headY - top - 6)));
  const body = await sharp(windowed)
    .extract({ left: 0, top: headLine, width: w, height: h - headLine })
    .png()
    .toBuffer();
  const cut = await sharp(body).trim({ threshold: 1 }).toBuffer();
  const cm = await sharp(cut).metadata();
  const bodyH = Math.round(CUTOUT_H * (1 - CUTOUT_HEADROOM));
  const bodyW = Math.round((cm.width / cm.height) * bodyH);
  const canvasW = Math.round(CUTOUT_H * RATIO);

  await sharp({
    create: { width: Math.max(canvasW, bodyW), height: CUTOUT_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      {
        input: await sharp(cut).resize(bodyW, bodyH, { fit: "fill" }).png().toBuffer(),
        top: CUTOUT_H - bodyH,
        left: Math.round((Math.max(canvasW, bodyW) - bodyW) / 2),
      },
    ])
    .webp({ quality: CUTOUT_Q, effort: 6, alphaQuality: CUTOUT_ALPHA_Q })
    .toFile(path.join(CUTOUTS, `${slug}.webp`));
}

if (DRY) console.log("\n[dry run — nothing written]");
