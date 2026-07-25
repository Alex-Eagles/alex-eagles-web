import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const mediaPlacements = [
  {
    component: "src/pages/Home.tsx",
    video: "public/media/homepage-background.mp4",
    poster: "public/media/homepage-background-poster.jpg",
    maxVideoBytes: 10 * 1024 * 1024,
  },
  {
    component: "src/pages/Home.tsx",
    video: "public/media/homepage-mobile.mp4",
    poster: "public/media/homepage-mobile-poster.jpg",
    maxVideoBytes: 8 * 1024 * 1024,
  },
  {
    component: "src/pages/Blog.tsx",
    video: "public/media/blog-hero.mp4",
    poster: "public/media/blog-hero-poster.jpg",
    maxVideoBytes: 25 * 1024 * 1024,
  },
];

for (const placement of mediaPlacements) {
  test(`${placement.video} is published and used`, async () => {
    const [videoStats, posterStats, component] = await Promise.all([
      stat(placement.video),
      stat(placement.poster),
      readFile(placement.component, "utf8"),
    ]);

    assert.ok(videoStats.size > 0, `${placement.video} should not be empty`);
    assert.ok(
      videoStats.size <= placement.maxVideoBytes,
      `${placement.video} exceeds its web-delivery size budget`,
    );
    assert.ok(posterStats.size > 0, `${placement.poster} should not be empty`);
    assert.ok(
      posterStats.size <= 250 * 1024,
      `${placement.poster} exceeds its web-delivery size budget`,
    );
    assert.ok(component.includes(`/${placement.video.replace("public/", "")}`));
    assert.ok(component.includes(`/${placement.poster.replace("public/", "")}`));
  });
}
