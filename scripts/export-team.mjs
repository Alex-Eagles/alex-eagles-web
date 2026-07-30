/**
 * export-team.mjs — renders the Team page (both roster years) to standalone
 * HTML files that open directly in a browser, no dev server required.
 *
 * Pipeline:
 *   1. `vite build`            → dist/assets/index-*.css + dist/assets/* (images)
 *   2. `vite build --ssr ...`  → dist-ssr/ssr-team-entry.js (Node-renderable Team)
 *   3. this script             → exports/team-2026.html, exports/team-2025.html
 *
 * Run via `node scripts/export-team.mjs` after both builds above.
 * CSS Module class hashes are deterministic from file content + vite.config,
 * so the client CSS bundle's class names line up with the SSR-rendered markup.
 */
import { existsSync, cpSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderTeamPage } from "../dist-ssr/ssr-team-entry.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distAssets = join(root, "dist", "assets");
const outDir = join(root, "exports");

if (!existsSync(distAssets)) {
  throw new Error("dist/assets not found — run `npx vite build` first.");
}

// Fresh output dir.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(distAssets, join(outDir, "assets"), { recursive: true });

// The client bundle's CSS — same hashed class names the SSR markup uses.
const cssFile = readdirSync(distAssets).find((f) => f.endsWith(".css"));
const css = readFileSync(join(distAssets, cssFile), "utf8").replaceAll("/assets/", "assets/");

// Small hand-written glue script: theme toggle, jump-nav open/close, and
// year-tab navigation between the two exported files. None of this needs
// React — it's the same three interactions Team.tsx handles, reimplemented
// as plain DOM code since the export ships no JS bundle.
const glueScript = `
(function () {
  var STORAGE_KEY = "ae-theme";
  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  var theme = saved === "light" || saved === "dark" ? saved : "dark";
  document.documentElement.setAttribute("data-theme", theme);

  var toggleBtn = document.getElementById("export-theme-toggle");
  function applyTheme(next) {
    theme = next;
    document.documentElement.setAttribute("data-theme", theme);
    toggleBtn.textContent = theme === "dark" ? "\\u2600\\uFE0F Light mode" : "\\u{1F319} Dark mode";
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
  }
  applyTheme(theme);
  toggleBtn.addEventListener("click", function () {
    applyTheme(theme === "dark" ? "light" : "dark");
  });

  // Year tabs: navigate between the two exported files instead of setting
  // React state (there's no React runtime in this export).
  document.querySelectorAll("[aria-pressed]").forEach(function (btn) {
    var y = btn.textContent.trim();
    if (y === "__YEAR__") return;
    btn.addEventListener("click", function () {
      window.location.href = "team-" + y + ".html";
    });
  });

  // Jump nav: same open/close behaviour as JumpNav.tsx, in plain JS.
  var tab = document.querySelector('[aria-controls="jump-nav-panel"]');
  var panel = document.getElementById("jump-nav-panel");
  var closeBtn = panel.querySelector('button[aria-label="Close"]');
  var label = tab.querySelector("span:last-child");
  function setOpen(open) {
    tab.setAttribute("data-open", String(open));
    tab.setAttribute("aria-expanded", String(open));
    tab.setAttribute("aria-label", open ? "Close section nav" : "Jump to section");
    panel.setAttribute("data-open", String(open));
    if (open) { panel.removeAttribute("inert"); } else { panel.setAttribute("inert", ""); }
    label.textContent = open ? "Close" : "Pull";
    if (open) { var link = panel.querySelector("a"); if (link) link.focus(); }
  }
  tab.addEventListener("click", function () { setOpen(tab.getAttribute("data-open") !== "true"); });
  closeBtn.addEventListener("click", function () { setOpen(false); });
  panel.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
})();
`;

for (const year of ["2026", "2025"]) {
  const body = renderTeamPage(year).replaceAll("/assets/", "assets/");
  const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Alex Eagles — Team (${year} snapshot)</title>
<style>${css}
body { margin: 0; }
#export-theme-toggle {
  position: fixed; top: 16px; left: 16px; z-index: 999;
  font: 600 13px "Archivo", system-ui, sans-serif;
  padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(139,143,196,0.4);
  background: rgba(22,26,80,0.85); color: #eef0ff; cursor: pointer;
  backdrop-filter: blur(6px);
}
</style>
</head>
<body>
<button id="export-theme-toggle" type="button">Toggle theme</button>
<div id="root">${body}</div>
<script>${glueScript.replace("__YEAR__", year)}</script>
</body>
</html>
`;
  writeFileSync(join(outDir, `team-${year}.html`), html, "utf8");
}

console.log("Wrote exports/team-2026.html and exports/team-2025.html");
