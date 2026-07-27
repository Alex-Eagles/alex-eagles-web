import { chromium } from "playwright";
const shotDir = "C:\\Users\\Mariyam\\AppData\\Local\\Temp\\claude\\d--Alex-Eagles-website-26-alex-eagles-web\\c5bc3bd8-6e34-4115-81e8-3718159daa47\\scratchpad";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1400, height: 500 } });
const page = await context.newPage();

await page.goto("http://localhost:5173/blog", { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.setItem("ae-theme", "light"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
await page.screenshot({ path: `${shotDir}/blog-nav-light.png`, clip: { x: 0, y: 0, width: 1400, height: 130 } });

// also dark mode, unchanged behavior check
await page.evaluate(() => localStorage.setItem("ae-theme", "dark"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
await page.screenshot({ path: `${shotDir}/blog-nav-dark.png`, clip: { x: 0, y: 0, width: 1400, height: 130 } });

await browser.close();
console.log("done");
