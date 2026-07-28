import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".ogv", ".m4v", ".avi"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"];

/**
 * The favicons are the site's icon, not page content — they are the only
 * bitmaps allowed to ship from `public/`. The brand emblem in `src/assets/`
 * is likewise identity, not media, and is rendered only by `AeLogo`.
 */
const ALLOWED_PUBLIC_FILES = new Set([
  "favicon-logo.ico",
  "favicon-logo.png",
  "favicon.svg",
]);
const ALLOWED_IMG_SOURCES = new Set([
  path.join("src", "components", "ui", "AeLogo.tsx"),
]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    }),
  );
  return files.flat();
}

const hasExtension = (file, extensions) =>
  extensions.some((extension) => file.toLowerCase().endsWith(extension));

test("no video assets ship with the site", async () => {
  const videos = (await walk("public")).filter((file) =>
    hasExtension(file, VIDEO_EXTENSIONS),
  );

  assert.deepEqual(videos, [], "public/ should contain no video files");
});

test("no photo or footage assets ship with the site", async () => {
  const unexpected = (await walk("public")).filter(
    (file) =>
      hasExtension(file, IMAGE_EXTENSIONS) &&
      !ALLOWED_PUBLIC_FILES.has(path.basename(file)),
  );

  assert.deepEqual(
    unexpected,
    [],
    "public/ should hold no imagery beyond the favicons",
  );
});

/**
 * Drop comments before scanning, so a `{/* swap this for an <img> *​/}` note
 * left for a future author doesn't read as a rendered element.
 */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

test("no page renders a <video> or a content <img>", async () => {
  const sources = (await walk("src")).filter((file) => file.endsWith(".tsx"));
  const offenders = [];

  for (const source of sources) {
    const contents = stripComments(await readFile(source, "utf8"));
    if (contents.includes("<video")) {
      offenders.push(`${source} renders a <video>`);
    }
    if (contents.includes("<img") && !ALLOWED_IMG_SOURCES.has(source)) {
      offenders.push(`${source} renders an <img>`);
    }
  }

  assert.deepEqual(offenders, []);
});

test("every route shows the under-construction notice", async () => {
  const app = await readFile("src/App.tsx", "utf8");

  assert.ok(
    app.includes("<ConstructionBanner />"),
    "App.tsx must render ConstructionBanner so every route inherits it",
  );

  const banner = await readFile(
    "src/components/layout/ConstructionBanner.tsx",
    "utf8",
  );
  assert.match(banner, /under construction/i);
});
