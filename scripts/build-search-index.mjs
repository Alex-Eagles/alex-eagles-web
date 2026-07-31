/**
 * Generates src/data/search-index.json — every piece of visible text on the
 * site, keyed by the route it appears on.
 *
 * Two passes feed the index:
 *
 *   1. STRUCTURED — the data modules (team, blog, achievements) are evaluated
 *      for real and walked field by field. That yields exact figures ("32
 *      members"), the roster year a name belongs to, and a DOM anchor for each
 *      achievement — none of which can be read off the source text.
 *   2. GENERIC — every other file reachable from a route's page component is
 *      transformed with esbuild (which turns JSX text into `children:` string
 *      literals) and mined for content strings, so new page copy is indexed
 *      without anyone maintaining a list.
 */
import { transformSync } from "esbuild";
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { dirname, resolve, relative, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(ROOT, "src");
const TMP = resolve(ROOT, "node_modules/.cache/ae-search");

const ROUTES = [
  { path: "/", page: "Home", entry: "src/pages/Homepage.jsx" },
  { path: "/team", page: "Team", entry: "src/pages/Team.tsx" },
  { path: "/blog", page: "Blog", entry: "src/pages/Blog.tsx" },
  { path: "/vehicles", page: "Vehicles", entry: "src/pages/Vehicles.tsx" },
  { path: "/gallery", page: "Gallery", entry: "src/pages/Gallery.tsx" },
  { path: "/history", page: "History", entry: "src/pages/History.tsx" },
];

/** Shared chrome — indexed once, reachable from every page. */
const SHARED = [
  { path: "/", page: "Navigation", entry: "src/components/layout/Footer.tsx" },
];

/** Handled by the structured pass; skipped by the generic crawl to avoid dupes. */
const STRUCTURED_FILES = new Set(
  ["data/team.ts", "data/blog.ts", "data/achievements.ts"].map((p) => resolve(SRC, p)),
);

const CONTENT_KEYS = new Set([
  "children", "name", "title", "label", "text", "heading", "headline", "blurb",
  "excerpt", "caption", "description", "role", "roleLabel", "author", "category",
  "venue", "venueDetail", "quote", "outlet", "outletNative", "abstract", "mission", "unit",
  "place", "competition", "language", "department", "major", "alt", "tag",
  "subteam", "year", "num", "date", "readTime", "eyebrow", "subtitle", "body",
  "email", "location", "address", "phone", "fullName", "shortName",
  "organisation", "organization", "summary", "detail", "note",
]);

const STOP_VALUES = new Set([
  "true", "false", "null", "undefined", "cover", "contain", "none", "button",
  "dialog", "page", "polite", "assertive", "primary", "secondary", "ghost",
  "left", "right", "center", "top", "bottom", "div", "span", "img", "section",
  "use-credentials", "anonymous", "_blank", "noopener noreferrer", "presentation",
  "escape", "enter", "tab", "shift", "control", "alt", "meta", "backspace",
  "delete", "arrowup", "arrowdown", "arrowleft", "arrowright", "pageup",
  "pagedown", "end", "home", "space", "keydown", "keyup", "click", "resize",
  "scroll", "load", "change", "submit", "focus", "blur", "mousedown", "touchstart",
]);

const DENY_CALLEES = new Set([
  "jsx", "jsxs", "jsxDEV", "createElement", "Fragment", "require", "import",
  "map", "filter", "forEach", "reduce", "find", "some", "every", "sort",
  "split", "replace", "replaceAll", "join", "test", "match", "includes",
  "startsWith", "endsWith", "indexOf", "slice", "concat", "padStart", "padEnd",
  "querySelector", "querySelectorAll", "getElementById", "createRef",
  "addEventListener", "removeEventListener", "setAttribute", "getAttribute",
  "setProperty", "getPropertyValue", "classList", "add", "remove", "toggle",
  "log", "warn", "error", "String", "Number", "Boolean", "parseInt",
  "parseFloat", "RegExp", "Date", "Set", "Map", "slugify", "cn", "clsx",
  "twMerge", "useState", "useRef", "matchMedia", "setItem", "getItem",
]);

const EXTS = [".tsx", ".ts", ".jsx", ".js"];

function resolveImport(spec, fromFile) {
  let base;
  if (spec.startsWith("@/")) base = resolve(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec);
  else return null;

  for (const ext of ["", ...EXTS]) {
    const candidate = base + ext;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  for (const ext of EXTS) {
    const candidate = resolve(base, "index" + ext);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function collectImports(file) {
  const source = readFileSync(file, "utf8");
  const specs = [];
  const re = /(?:import|export)\s+(?:[\s\S]*?\s+from\s*)?["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(source))) specs.push(m[1]);
  return specs
    .filter((s) => !/\.(css|scss|svg|png|jpe?g|webp|mp4|json)$/i.test(s))
    .map((s) => resolveImport(s, file))
    .filter(Boolean);
}

function reachableFiles(entry) {
  const seen = new Set();
  const queue = [resolve(ROOT, entry)];
  while (queue.length) {
    const file = queue.pop();
    if (!file || seen.has(file) || !file.startsWith(SRC)) continue;
    if (!EXTS.includes(extname(file))) continue;
    seen.add(file);
    for (const dep of collectImports(file)) queue.push(dep);
  }
  return [...seen];
}

/**
 * Pull string literals out of transformed JS, tagged with the object key they
 * belong to. Strings inside an array inherit the key the array was assigned to,
 * so `children: ["Engineers ", accent, " First."]` yields three `children` hits.
 */
function extractStrings(code) {
  const out = [];
  const stack = [];
  let lastKey = null;
  let lastIdent = null;
  let i = 0;

  while (i < code.length) {
    const ch = code[i];

    if (ch === "/" && code[i + 1] === "/") {
      i = code.indexOf("\n", i);
      if (i === -1) break;
      continue;
    }
    if (ch === "/" && code[i + 1] === "*") {
      i = code.indexOf("*/", i) + 2;
      if (i === 1) break;
      continue;
    }

    if (ch === '"' || ch === "'") {
      let j = i + 1;
      let value = "";
      while (j < code.length && code[j] !== ch) {
        if (code[j] === "\\") {
          const next = code[j + 1];
          if (next === "u" && code[j + 2] === "{") {
            const close = code.indexOf("}", j + 3);
            value += String.fromCodePoint(parseInt(code.slice(j + 3, close), 16));
            j = close + 1;
          } else if (next === "u") {
            value += String.fromCharCode(parseInt(code.slice(j + 2, j + 6), 16));
            j += 6;
          } else if (next === "x") {
            value += String.fromCharCode(parseInt(code.slice(j + 2, j + 4), 16));
            j += 4;
          } else {
            value += next === "n" ? "\n" : next === "t" ? " " : next;
            j += 2;
          }
        } else {
          value += code[j];
          j++;
        }
      }
      const top = stack[stack.length - 1];
      let key = lastKey;
      if (top && top.type === "[") key = top.key;
      else if (top && top.type === "(" && !lastKey) {
        key = DENY_CALLEES.has(top.callee) ? null : "__call";
      }
      if (key) out.push({ key, value });
      lastKey = null;
      i = j + 1;
      continue;
    }

    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < code.length && /[A-Za-z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      let k = j;
      while (k < code.length && /\s/.test(code[k])) k++;
      if (code[k] === ":") lastKey = word;
      lastIdent = word;
      i = j;
      continue;
    }

    if (ch === "[") {
      stack.push({ type: "[", key: lastKey });
      i++;
      continue;
    }
    if (ch === "{") {
      stack.push({ type: "{" });
      lastKey = null;
      i++;
      continue;
    }
    if (ch === "]" || ch === "}") {
      stack.pop();
      i++;
      continue;
    }
    // A call frame blocks array-key inheritance — jsx("p", …) must not read
    // "p" as the surrounding array's `children`.
    if (ch === "(") {
      stack.push({ type: "(", callee: lastIdent });
      lastKey = null;
      lastIdent = null;
      i++;
      continue;
    }
    if (ch === ")") {
      stack.pop();
      lastKey = null;
      i++;
      continue;
    }
    if (ch === ",") {
      lastKey = null;
      i++;
      continue;
    }
    i++;
  }
  return out;
}

function cleanText(raw) {
  const text = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (text.length < 2 || text.length > 400) return null;
  if (STOP_VALUES.has(text.toLowerCase())) return null;
  if (/^[#/.]/.test(text) || /^https?:|^mailto:|^tel:/i.test(text)) return null;
  if (/\.(jpe?g|png|webp|svg|mp4|css|js|json|glb|gltf|woff2?)$/i.test(text)) return null;
  if (/^\d{4}$/.test(text)) return text; // a year is meaningful copy
  if (/^#[0-9a-f]{3,8}$/i.test(text)) return null;
  // Any script, not just Latin: outlet names like اليوم السابع carry no Latin letter.
  if (!/\p{L}/u.test(text)) return null;
  if (/^[a-z0-9]+([-_][a-z0-9]+)+$/.test(text)) return null;
  if (/^\d+(\.\d+)?(px|rem|em|%|vh|vw|s|ms)$/.test(text)) return null;
  if (text.startsWith("-")) return null;
  if (/<[a-z/]/i.test(text)) return null;
  // Unresolved template placeholders — "${post.title}", "My address: {email}".
  if (/\$\{|\{[a-zA-Z_$][\w$]*\}/.test(text)) return null;
  if (!/\s/.test(text)) {
    // Single tokens that are plainly code: css utilities and constants.
    if (text.includes(":")) return null;
    if (text.includes("_") && !text.includes("@")) return null;
  }
  // Utility class lists: several css-ish tokens, most of them hyphenated.
  // Deliberately not "two tokens" — that ate real copy like "6 sub-teams".
  const tokens = text.split(" ");
  const cssish = tokens.filter((t) => /[-:[]/.test(t)).length;
  if (
    tokens.length >= 3 &&
    tokens.every((t) => /^[a-z0-9:_[\]().,%/!-]+$/.test(t)) &&
    cssish * 2 >= tokens.length
  ) {
    return null;
  }
  return text;
}

const ENTITIES = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", middot: "·",
  mdash: "—", ndash: "–", hellip: "…", times: "×", deg: "°", rsquo: "'",
  lsquo: "'", ldquo: '"', rdquo: '"', trade: "™", reg: "®", copy: "©",
};

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (whole, name) => ENTITIES[name.toLowerCase()] ?? whole);
}

function textFromHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .split(/<[^>]+>/)
    .map((s) => decodeEntities(s).trim())
    .filter(Boolean);
}

const records = [];
const seenScopes = new Map();

function add(route, page, text, params, anchor) {
  const cleaned = cleanText(text);
  if (!cleaned) return;
  const scope = route + "|" + (params ?? "") + "|" + (anchor ?? "");
  if (!seenScopes.has(scope)) seenScopes.set(scope, new Set());
  const seen = seenScopes.get(scope);
  const dedupe = cleaned.toLowerCase();
  if (seen.has(dedupe)) return;
  seen.add(dedupe);
  const record = { id: scope + " " + dedupe, text: cleaned, route, page };
  if (params) record.params = params;
  if (anchor) record.anchor = anchor;
  records.push(record);
}

/**
 * Evaluates a data module for real. These are plain data with no imports, so
 * the only Vite-ism to stub out is `import.meta.glob` (asset maps we don't need).
 */
async function loadData(relPath) {
  mkdirSync(TMP, { recursive: true });
  const source = readFileSync(resolve(SRC, relPath), "utf8").replace(
    /import\.meta\.glob/g,
    "__glob",
  );
  const { code } = transformSync("const __glob = () => ({});\n" + source, {
    loader: "ts",
    format: "esm",
  });
  const outFile = resolve(TMP, relPath.replace(/[\\/]/g, "_") + ".mjs");
  writeFileSync(outFile, code);
  return import(pathToFileURL(outFile).href + "?v=" + Date.now());
}

/* --------------------------------------------------------------- structured */

try {
  const team = await loadData("data/team.ts");
  for (const year of team.ROSTER_YEARS) {
    const roster = team.ROSTERS[year];
    const params = "year=" + year;
    const page = "Team · " + year;
    const stats = team.rosterStats(roster);

    add("/team", page, `${stats.members} members`, params);
    add("/team", page, `${stats.divisions} divisions`, params);
    add("/team", page, `${stats.subTeams} sub-teams`, params);
    add("/team", page, `Class of ${year}`, params);
    add("/team", page, year, params);

    const addMember = (member) => {
      if (!member || member.hidden || !team.hasName(member)) return;
      add("/team", page, member.name, params);
      add("/team", page, team.memberRoleLabel(member), params);
      if (member.major) add("/team", page, member.major, params);
      if (member.gradYear) add("/team", page, `Class of ${member.gradYear}`, params);
    };

    roster.leadership.forEach(addMember);
    for (const division of roster.divisions) {
      add("/team", page, division.name, params);
      (division.heads ?? []).forEach(addMember);
      for (const section of division.sections) {
        add("/team", page, section.name, params);
        if (section.blurb) add("/team", page, section.blurb, params);
        section.members.forEach(addMember);
      }
    }
  }
} catch (err) {
  console.warn("  ! team pass failed:", err.message);
}

try {
  const blog = await loadData("data/blog.ts");
  for (const post of blog.BLOG_POSTS) {
    // The list page opens posts in a modal, so results deep-link to that card.
    const params = "post=" + post.id;
    const page = "Blog · " + (blog.CATEGORY_LABEL?.[post.category] ?? post.category);
    add("/blog", page, post.title, params);
    add("/blog", page, post.excerpt, params);
    add("/blog", page, post.author, params);
    add("/blog", page, post.date, params);
  }
} catch (err) {
  console.warn("  ! blog pass failed:", err.message);
}

try {
  const history = await loadData("data/achievements.ts");
  for (const achievement of history.achievements) {
    const anchor = "achievement-" + achievement.id;
    const page = "History · " + achievement.year;
    add("/history", page, achievement.title, undefined, anchor);
    if (achievement.blurb) add("/history", page, achievement.blurb, undefined, anchor);
    for (const award of achievement.awards) {
      if (award.place) {
        add("/history", page, `${award.place} · ${award.title}`, undefined, anchor);
      }
      add("/history", page, award.title, undefined, anchor);
      add("/history", page, award.competition, undefined, anchor);
    }
  }
} catch (err) {
  console.warn("  ! history pass failed:", err.message);
}

/* ------------------------------------------------------------------ generic */

for (const { path, page, entry } of [...ROUTES, ...SHARED]) {
  if (!existsSync(resolve(ROOT, entry))) {
    console.warn(`  ! missing entry ${entry}`);
    continue;
  }
  for (const file of reachableFiles(entry)) {
    if (STRUCTURED_FILES.has(file)) continue;
    let code;
    try {
      code = transformSync(readFileSync(file, "utf8"), {
        loader: extname(file).slice(1),
        jsx: "automatic",
        format: "esm",
      }).code;
    } catch {
      continue; // unparseable file — skip rather than fail the build
    }
    for (const { key, value } of extractStrings(code)) {
      if (key === "__call" || CONTENT_KEYS.has(key)) add(path, page, value);
    }
  }
}

// The Vehicles page injects a prebuilt static bundle, so its copy lives in HTML.
const vehicleHtml = resolve(ROOT, "public/vehicle/index.html");
if (existsSync(vehicleHtml)) {
  const html = readFileSync(vehicleHtml, "utf8");

  // The development-process timeline opens each stop as a modal, so its results
  // deep-link to the stop exactly as blog results deep-link to a post. Indexed
  // before the generic sweep so the copy that also appears on the card carries
  // the parameter rather than landing twice.
  for (const text of textFromHtml(html)) {
    add("/vehicles", "Vehicles", text);
  }
}

const outFile = resolve(SRC, "data/search-index.json");
writeFileSync(outFile, JSON.stringify(records));

const byRoute = records.reduce((acc, r) => {
  acc[r.route] = (acc[r.route] || 0) + 1;
  return acc;
}, {});
console.log(`search index → ${relative(ROOT, outFile)}`);
console.log(`  ${records.length} entries`);
for (const [route, count] of Object.entries(byRoute).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(5)}  ${route}`);
}
