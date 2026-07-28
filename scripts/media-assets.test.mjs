import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import test from "node:test";

const mediaPlacements = [
  {
    component: "src/pages/Home.tsx",
    image: "public/media/homepage-background-poster.jpg",
  },
  {
    component: "src/pages/Home.tsx",
    image: "public/media/homepage-mobile-poster.jpg",
  },
  {
    component: "src/pages/Blog.tsx",
    image: "public/media/blog-hero-poster.jpg",
  },
];

for (const placement of mediaPlacements) {
  test(`${placement.image} is published and used`, async () => {
    const [imageStats, component] = await Promise.all([
      stat(placement.image),
      readFile(placement.component, "utf8"),
    ]);

    assert.ok(imageStats.size > 0, `${placement.image} should not be empty`);
    assert.ok(
      imageStats.size <= 250 * 1024,
      `${placement.image} exceeds its web-delivery size budget`,
    );
    assert.ok(component.includes(`/${placement.image.replace("public/", "")}`));
  });
}

test("no video assets ship with the site", async () => {
  const videoExtensions = [".mp4", ".webm", ".mov", ".ogv", ".m4v"];
  const files = await readdir("public/media");
  const videos = files.filter((file) =>
    videoExtensions.some((extension) => file.toLowerCase().endsWith(extension)),
  );

  assert.deepEqual(videos, [], "public/media should contain no video files");
});

test("Vercel caches published media for repeat visits", async () => {
  const config = JSON.parse(await readFile("vercel.json", "utf8"));
  const mediaRule = config.headers.find(
    (rule) => rule.source === "/media/(.*)",
  );
  const cacheHeader = mediaRule?.headers.find(
    (header) => header.key.toLowerCase() === "cache-control",
  );

  assert.equal(
    cacheHeader?.value,
    "public, max-age=86400, stale-while-revalidate=604800",
  );
});
