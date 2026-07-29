import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const HIGHLIGHT_NAME = "ae-search";
const TINT_CLASS = "ae-search-fallback";
const TARGET_CLASS = "ae-search-target";
const MAX_MATCHES = 80;
const RETRY_DELAYS = [120, 350, 750, 1400, 2400, 3600];

type HighlightRegistry = { set(k: string, v: unknown): void; delete(k: string): boolean };
interface HighlightCtor {
  new (...ranges: Range[]): unknown;
}

function highlightApi(): { registry: HighlightRegistry; Ctor: HighlightCtor } | null {
  const css = (window as unknown as { CSS?: { highlights?: HighlightRegistry } }).CSS;
  const Ctor = (window as unknown as { Highlight?: HighlightCtor }).Highlight;
  if (!css?.highlights || typeof Ctor !== "function") return null;
  return { registry: css.highlights, Ctor };
}

function clearHighlights() {
  highlightApi()?.registry.delete(HIGHLIGHT_NAME);
  document
    .querySelectorAll("." + TINT_CLASS + ", ." + TARGET_CLASS)
    .forEach((el) => el.classList.remove(TINT_CLASS, TARGET_CLASS));
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Laid out on the page — not necessarily opaque, since reveal animations start at zero. */
function isLaidOut(el: Element) {
  return el.getClientRects().length > 0;
}

function isIndexable(el: Element) {
  return !el.closest("nav, script, style, noscript, [data-search-ui]");
}

/**
 * The element the clicked result refers to. Long copy gets split across
 * elements, so we try the whole string first and then progressively shorter
 * prefixes, always preferring the tightest element that still contains it.
 */
function findTarget(target: string): Element | null {
  const wanted = norm(target);
  if (!wanted) return null;

  const words = wanted.split(" ");
  const phrases: string[] = [];
  for (const n of [words.length, 8, 5, 3, 2, 1]) {
    const phrase = words.slice(0, Math.min(n, words.length)).join(" ");
    if (phrase && !phrases.includes(phrase)) phrases.push(phrase);
  }

  const all = Array.from(document.body.querySelectorAll("*")).filter(isIndexable);

  for (const phrase of phrases) {
    // Tightest match = the smallest element still containing the phrase, with
    // laid-out elements always winning over ones that never rendered.
    let best: Element | null = null;
    let bestLen = Infinity;
    let bestVisible = false;
    for (const el of all) {
      const text = norm(el.textContent ?? "");
      if (!text.includes(phrase)) continue;
      const visible = isLaidOut(el);
      if ((visible && !bestVisible) || (visible === bestVisible && text.length < bestLen)) {
        best = el;
        bestLen = text.length;
        bestVisible = visible;
      }
    }
    if (best) return best;

    // Images and icon buttons carry their label in an attribute instead.
    const attrMatch = all.find((el) =>
      ["alt", "title", "aria-label"].some((a) => norm(el.getAttribute(a) ?? "").includes(phrase)),
    );
    if (attrMatch) return attrMatch;
  }
  return null;
}

/** Ranges covering every word starting with one of `terms`. */
function findRanges(root: Node, terms: string[]): Range[] {
  const pattern = new RegExp(
    `(?:^|[^\\p{L}\\p{N}])(${terms.map(escapeRe).join("|")})`,
    "giu",
  );
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !isIndexable(parent)) return NodeFilter.FILTER_REJECT;
      if (parent.closest("svg, canvas")) return NodeFilter.FILTER_REJECT;
      return node.nodeValue && node.nodeValue.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const ranges: Range[] = [];
  let node: Node | null;
  while ((node = walker.nextNode()) && ranges.length < MAX_MATCHES) {
    const value = node.nodeValue ?? "";
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(value)) && ranges.length < MAX_MATCHES) {
      const start = m.index + (m[0].length - m[1].length);
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + m[1].length);
      ranges.push(range);
    }
  }
  return ranges;
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

function attempt(terms: string[], target: string | null): boolean {
  const targetEl = target ? findTarget(target) : null;
  const ranges = findRanges(document.body, terms);
  if (!targetEl && !ranges.length) return false;

  paint(ranges);

  // Scroll to the clicked result, not merely the first match on the page.
  const inTarget = targetEl
    ? ranges.find((r) => targetEl.contains(r.startContainer))
    : undefined;
  const scrollTo =
    inTarget?.startContainer.parentElement ??
    targetEl ??
    ranges[0]?.startContainer.parentElement;
  if (!scrollTo) return false;

  // An attribute-only match (a sponsor logo) has no text to paint, so outline it.
  if (targetEl && !inTarget) targetEl.classList.add(TARGET_CLASS);

  scrollTo.scrollIntoView({ behavior: "smooth", block: "center" });
  return true;
}

/**
 * Highlights the searched term after a result is opened and scrolls to the
 * specific match that was clicked (`?t=`), retrying while the route finishes
 * rendering — several pages mount their content asynchronously.
 */
export function useSearchHighlight() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    clearHighlights();
    const params = new URLSearchParams(search);
    const query = params.get("q");
    if (!query) return;

    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    if (!terms.length) return;
    const target = params.get("t");

    let done = false;
    const timers = RETRY_DELAYS.map((delay) =>
      window.setTimeout(() => {
        if (!done && attempt(terms, target)) done = true;
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
