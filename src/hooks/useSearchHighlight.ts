import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const HIGHLIGHT_NAME = "ae-search";
const TINT_CLASS = "ae-search-fallback";
const TARGET_CLASS = "ae-search-target";
const STYLE_ATTR = "data-ae-search-style";
const MAX_MATCHES = 200;
const RETRY_DELAYS = [100, 300, 700, 1400, 2400, 3600, 5000];

const SHADOW_CSS = `::highlight(${HIGHLIGHT_NAME}){background-color:#fde047;color:#1a1a1a}
.${TARGET_CLASS}{outline:3px solid #fde047;outline-offset:3px;border-radius:4px}`;

type HighlightRegistry = { set(k: string, v: unknown): void; delete(k: string): boolean };
interface HighlightCtor {
  new (...ranges: Range[]): unknown;
}

type Root = Document | ShadowRoot;

function highlightApi(): { registry: HighlightRegistry; Ctor: HighlightCtor } | null {
  const css = (window as unknown as { CSS?: { highlights?: HighlightRegistry } }).CSS;
  const Ctor = (window as unknown as { Highlight?: HighlightCtor }).Highlight;
  if (!css?.highlights || typeof Ctor !== "function") return null;
  return { registry: css.highlights, Ctor };
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Elements whose animation we paused, to be restored on cleanup. */
let frozen: HTMLElement[] = [];

function clearHighlights() {
  highlightApi()?.registry.delete(HIGHLIGHT_NAME);
  for (const root of collectRoots()) {
    root
      .querySelectorAll("." + TINT_CLASS + ", ." + TARGET_CLASS)
      .forEach((el) => el.classList.remove(TINT_CLASS, TARGET_CLASS));
  }
  for (const el of frozen) el.style.animationPlayState = "";
  frozen = [];
}

/**
 * The document plus every open shadow root — the Vehicles page mounts its
 * build experience into custom elements, and their text is otherwise invisible
 * to both the tree walker and querySelectorAll.
 */
function collectRoots(): Root[] {
  const roots: Root[] = [document];
  const visit = (root: Root) => {
    root.querySelectorAll("*").forEach((el) => {
      const shadow = (el as Element & { shadowRoot: ShadowRoot | null }).shadowRoot;
      if (shadow) {
        roots.push(shadow);
        visit(shadow);
      }
    });
  };
  visit(document);
  return roots;
}

/** Global stylesheets don't cross the shadow boundary, so mirror ours inside. */
function ensureShadowStyles(roots: Root[]) {
  for (const root of roots) {
    if (root === document || (root as ShadowRoot).querySelector(`[${STYLE_ATTR}]`)) continue;
    const style = document.createElement("style");
    style.setAttribute(STYLE_ATTR, "");
    style.textContent = SHADOW_CSS;
    (root as ShadowRoot).appendChild(style);
  }
}

function isIndexable(el: Element) {
  return !el.closest("nav, script, style, noscript, [data-search-ui]");
}

function allElements(roots: Root[]): Element[] {
  const out: Element[] = [];
  for (const root of roots) {
    root.querySelectorAll("*").forEach((el) => {
      if (isIndexable(el)) out.push(el);
    });
  }
  return out;
}

/** Ranges for every occurrence of `pattern` across all roots. */
function findRanges(roots: Root[], pattern: RegExp): Range[] {
  const ranges: Range[] = [];
  for (const root of roots) {
    const walker = document.createTreeWalker(root as unknown as Node, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || !isIndexable(parent)) return NodeFilter.FILTER_REJECT;
        if (parent.closest("svg, canvas")) return NodeFilter.FILTER_REJECT;
        return node.nodeValue && node.nodeValue.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });

    let node: Node | null;
    while ((node = walker.nextNode()) && ranges.length < MAX_MATCHES) {
      const value = node.nodeValue ?? "";
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(value)) && ranges.length < MAX_MATCHES) {
        const start = m.index + (m[0].length - m[1].length);
        if (!m[1]) break;
        const range = document.createRange();
        range.setStart(node, start);
        range.setEnd(node, start + m[1].length);
        ranges.push(range);
      }
    }
  }
  return ranges;
}

/** The exact phrase that was clicked, allowing for reflowed whitespace. */
function phrasePattern(target: string): RegExp | null {
  const words = norm(target).split(" ").filter(Boolean);
  if (!words.length) return null;
  return new RegExp("(" + words.map(escapeRe).join("\\s+") + ")", "giu");
}

function termsPattern(terms: string[]): RegExp {
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])(${terms.map(escapeRe).join("|")})`, "giu");
}

/** Elements labelled by attribute rather than text — sponsor logos, icon buttons. */
function attributeMatches(elements: Element[], target: string): Element[] {
  const wanted = norm(target);
  return elements.filter((el) =>
    ["alt", "title", "aria-label"].some((a) => {
      const value = norm(el.getAttribute(a) ?? "");
      return value === wanted || value.includes(wanted);
    }),
  );
}

function paint(ranges: Range[]) {
  if (!ranges.length) return;
  const api = highlightApi();
  if (api) {
    api.registry.set(HIGHLIGHT_NAME, new api.Ctor(...ranges));
  } else {
    // No Highlight API — tint containing elements rather than splitting text
    // nodes, which would fight React's reconciler.
    for (const range of ranges) {
      range.startContainer.parentElement?.classList.add(TINT_CLASS);
    }
  }
}

/**
 * Sponsors ride an infinite marquee, so a result would slide away before it
 * could be read. Pause any animated ancestor while the highlight is showing.
 */
function freezeAnimations(el: Element) {
  let node: Element | null = el;
  while (node && node !== document.body) {
    if (node instanceof HTMLElement) {
      const name = getComputedStyle(node).animationName;
      if (name && name !== "none") {
        node.style.animationPlayState = "paused";
        frozen.push(node);
      }
    }
    node = node.parentElement;
  }
}

function attempt(terms: string[], target: string | null, anchor: string | null): boolean {
  const roots = collectRoots();
  ensureShadowStyles(roots);

  // An anchored result (a history milestone) names its element outright.
  let scope: Element | null = null;
  if (anchor) {
    for (const root of roots) {
      const found = root.querySelector("#" + CSS.escape(anchor));
      if (found) {
        scope = found;
        break;
      }
    }
    if (!scope) return false; // not rendered yet — let a later retry find it
  }

  // Highlight what was actually clicked ("Sara Gharib"), not just the query.
  let ranges: Range[] = [];
  const phrase = target ? phrasePattern(target) : null;
  if (phrase) ranges = findRanges(roots, phrase);
  if (!ranges.length) ranges = findRanges(roots, termsPattern(terms));

  const labelled = target ? attributeMatches(allElements(roots), target) : [];
  if (!ranges.length && !labelled.length && !scope) return false;

  // Prefer matches inside the anchored element when there is one.
  const scoped = scope ? ranges.filter((r) => scope.contains(r.startContainer)) : ranges;
  const finalRanges = scoped.length ? scoped : ranges;
  paint(finalRanges);

  for (const el of labelled) el.classList.add(TARGET_CLASS);

  const focus =
    finalRanges[0]?.startContainer.parentElement ?? labelled[0] ?? scope ?? null;
  if (!focus) return false;

  freezeAnimations(focus);
  // Instant, not smooth: a long scroll animation on a marquee or a pinned
  // section lands somewhere else by the time it finishes.
  focus.scrollIntoView({ behavior: "auto", block: "center" });
  return true;
}

/**
 * Highlights the clicked search result and scrolls to it, retrying while the
 * route finishes rendering — several pages mount content asynchronously.
 */
export function useSearchHighlight() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    clearHighlights();
    const params = new URLSearchParams(search);
    const query = params.get("q");
    if (!query) return;

    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    const target = params.get("t");
    if (!terms.length && !target) return;

    let done = false;
    const timers = RETRY_DELAYS.map((delay) =>
      window.setTimeout(() => {
        if (!done && attempt(terms, target, params.get("a"))) done = true;
      }, delay),
    );

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearHighlights();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      done = true;
      timers.forEach(clearTimeout);
      document.removeEventListener("keydown", onKey);
      clearHighlights();
    };
  }, [pathname, search]);
}
