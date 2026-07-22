import { chromium } from "playwright";
const browser = await chromium.launch();
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto("http://localhost:5173/blog", { waitUntil: "load", timeout: 60000 });
await page.waitForSelector("text=Blogs");
await page.getByRole("button", { name: "software", exact: true }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: ".scratch-images2-software.png", fullPage: true });

console.log("ERRORS:", JSON.stringify(errors));
await browser.close();
