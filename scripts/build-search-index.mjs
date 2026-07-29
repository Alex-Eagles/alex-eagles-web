/**
 * Generates src/data/search-index.json — every piece of visible text on the
 * site, keyed by the route it appears on.
 *
 * For each route we walk the import graph from its page component, transform
 * each source file with esbuild (which turns JSX text nodes into `children:`
 * string literals), then pull out string literals that sit under `children` or
 * under a content-bearing key. That means new copy is indexed automatically —
 * nobody has to remember to update a hand-written list.
 */
import { transformSync } from "esbuild";
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, resolve, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(ROOT, "src");

const ROUTES = [
  { path: "/", page: "Home", entry: "src/pages/Homepage.jsx" },
  { path: "/team", page: "Team", entry: "src/pages/Team.tsx" },
  { path: "/blog", page: "Blog", entry: "src/pages/Blog.tsx" },
  { path: "/vehicles", page: "Vehicles", entry: "src/pages/Vehicles.tsx" },
  { path: "/gallery", page: "Gallery", entry: "src/pages/Gallery.tsx" },
  { path: "/history", page: "History", entry: "src/pages/History.tsx" },
];

/** Shared chrome — indexed once and reachable from every page. */
const SHARED = [
  { path: "/", page: "Navigation", entry: "src/components/layout/Footer.tsx" },
];

/** Object keys whose string values are real content rather than config. */
const CONTENT_KEYS = new Set([
  "children", "name", "title", "label", "text", "heading", "headline", "blurb",
  "excerpt", "caption", "description", "role", "roleLabel", "author", "category",
  "venue", "venueDetail", "quote", "outlet", "abstract", "mission", "unit",
  "place", "competition", "language", "department", "major", "alt", "tag",
  "subteam", "year", "num", "date", "readTime", "eyebrow", "subtitle", "body",
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

/** Callees whose string arguments are machinery, not copy. */
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
  else return null; // bare package import — not our source

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

/** Every source file reachable from an entry point. */
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
  const keyStack = [];
  let lastKey = null;
  let lastIdent = null;
  let i = 0;

  while (i < code.length) {
    const ch = code[i];

    // Skip comments.
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

    // String literal.
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      let value = "";
      while (j < code.length && code[j] !== ch) {
        if (code[j] === "\\") {
          const next = code[j + 1];
          if (next === "u" && code[j + 2] === "{") {
            const end = code.indexOf("}", j + 3);
            value += String.fromCodePoint(parseInt(code.slice(j + 3, end), 16));
            j = end + 1;
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
      const top = keyStack[keyStack.length - 1];
      let key = lastKey;
      if (top && top.type === "[") key = top.key;
      else if (top && top.type === "(" && !lastKey) {
        key = DENY_CALLEES.has(top.callee) ? null : "__call";
      }
      if (key) out.push({ key, value, pos: i });
      lastKey = null;
      i = j + 1;
      continue;
    }

    // `identifier:` sets the current key.
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
      keyStack.push({ type: "[", key: lastKey });
      i++;
      continue;
    }
    if (ch === "{") {
      keyStack.push({ type: "{" });
      lastKey = null;
      i++;
      continue;
    }
    if (ch === "]" || ch === "}") {
      keyStack.pop();
      i++;
      continue;
    }
    // A call frame blocks array-key inheritance — jsx("p", ...) must not read
    // "p" as the surrounding array's `children`.
    if (ch === "(") {
      keyStack.push({ type: "(", callee: lastIdent });
      lastKey = null;
      lastIdent = null;
      i++;
      continue;
    }
    if (ch === ")") {
      keyStack.pop();
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
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length < 2 || text.length > 400) return null;
  if (STOP_VALUES.has(text.toLowerCase())) return null;
  if (/^[#/.]/.test(text) || /^https?:|^mailto:|^tel:/i.test(text)) return null;
  if (/\.(jpe?g|png|webp|svg|mp4|css|js|json|glb|gltf|woff2?)$/i.test(text)) return null;
  if (/^#?[0-9a-f]{3,8}$/i.test(text) && !/[g-z]/i.test(text)) return null;
  if (/^\d{4}$/.test(text)) return text; // a year is meaningful copy
  if (!/[A-Za-z]/.test(text)) return null;
  // kebab/snake slugs and CSS class names
  if (/^[a-z0-9]+([-_][a-z0-9]+)+$/.test(text)) return null;
  if (/^\d+(\.\d+)?(px|rem|em|%|vh|vw|s|ms)$/.test(text)) return null;
  if (text.startsWith("-")) return null;
  if (/<[a-z/]/i.test(text)) return null; // dev warnings quoting markup
  // Utility class lists: every token is lowercase css-ish and at least one is hyphenated.
  const tokens = text.split(" ");
  if (
    tokens.length > 1 &&
    tokens.every((t) => /^[a-z0-9:_[\]().,%/!-]+$/.test(t)) &&
    tokens.some((t) => /[-:[]/.test(t))
  ) {
    return null;
  }
  return text;
}

function textFromHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .split(/<[^>]+>/)
    .map((s) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim())
    .filter(Boolean);
}

const records = [];
const seenPerRoute = new Map();

function add(route, page, text, params) {
  const cleaned = cleanText(text);
  if (!cleaned) return;
  const scope = route + (params ? "?" + params : "");
  if (!seenPerRoute.has(scope)) seenPerRoute.set(scope, new Set());
  const seen = seenPerRoute.get(scope);
  if (seen.has(cleaned.toLowerCase())) return;
  seen.add(cleaned.toLowerCase());
  const record = { id: scope + " " + cleaned.toLowerCase(), text: cleaned, route, page };
  if (params) record.params = params;
  records.push(record);
}


/**
 * Byte ranges of the per-year roster declarations (`const ROSTER_2025 = …`),
 * so a name links to the year tab that actually renders it.
 */
function yearRanges(code) {
  const found = [];
  const re = /const\s+ROSTER_(\d{4})\b/g;
  let m;
  while ((m = re.exec(code))) found.push({ year: m[1], start: m.index });
  found.sort((a, b) => a.start - b.start);
  return found.map((entry, i) => ({
    ...entry,
    end: i + 1 < found.length ? found[i + 1].start : Infinity,
  }));
}

for (const { path, page, entry } of [...ROUTES, ...SHARED]) {
  const entryPath = resolve(ROOT, entry);
  if (!existsSync(entryPath)) {
    console.warn(`  ! missing entry ${entry}`);
    continue;
  }
  for (const file of reachableFiles(entry)) {
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
    const ranges = yearRanges(code);
    for (const { key, value, pos } of extractStrings(code)) {
      if (key !== "__call" && !CONTENT_KEYS.has(key)) continue;
      const range = ranges.find((r) => pos >= r.start && pos < r.end);
      const params = range ? "year=" + range.year : undefined;
      const label = range ? page + " · " + range.year : page;
      add(path, label, value, params);
    }
  }
}

// The Vehicles page injects a prebuilt static bundle, so its copy lives in HTML.
const vehicleHtml = resolve(ROOT, "public/vehicle/index.html");
if (existsSync(vehicleHtml)) {
  for (const text of textFromHtml(readFileSync(vehicleHtml, "utf8"))) {
    add("/vehicles", "Vehicles", text);
  }
}

// Blog posts get deep links to their own route.
try {
  const blogSource = transformSync(readFileSync(resolve(SRC, "data/blog.ts"), "utf8"), {
    loader: "ts",
    format: "esm",
  }).code;
  const postRe = /id:\s*(\d+)[\s\S]*?title:\s*"((?:[^"\\]|\\.)*)"[\s\S]*?excerpt:\s*\n?\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = postRe.exec(blogSource))) {
    const [, id, title, excerpt] = m;
    add(`/blog/${id}`, "Blog post", title);
    add(`/blog/${id}`, "Blog post", excerpt.replace(/\\"/g, '"'));
  }
} catch (err) {
  console.warn("  ! could not deep-link blog posts:", err.message);
}

const outFile = resolve(SRC, "data/search-index.json");
writeFileSync(outFile, JSON.stringify(records));

const byRoute = records.reduce((acc, r) => {
  acc[r.route] = (acc[r.route] || 0) + 1;
  return acc;
}, {});
console.log(`search index → ${relative(ROOT, outFile)}`);
console.log(`  ${records.length} entries across ${Object.keys(byRoute).length} routes`);
for (const [route, count] of Object.entries(byRoute).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(5)}  ${route}`);
}
