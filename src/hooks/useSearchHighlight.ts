import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const HIGHLIGHT_NAME = "ae-search";
const FALLBACK_CLASS = "ae-search-fallback";
const MAX_MATCHES = 60;

type HighlightRegistry = Map<string, unknown> & { delete(k: string): boolean };
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
    .querySelectorAll("." + FALLBACK_CLASS)
    .forEach((el) => el.classList.remove(FALLBACK_CLASS));
}

/** Ranges covering every word that starts with one of `terms`. */
function findRanges(root: Node, terms: string[]): Range[] {
  const pattern = new RegExp(
    `(?:^|[^\\p{L}\\p{N}])(${terms.map(escape).join("|")})`,
    "giu",
  );
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest("script, style, noscript, svg, canvas")) {
        return NodeFilter.FILTER_REJECT;
      }
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

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function apply(terms: string[]): boolean {
  const root = document.querySelector("main") ?? document.body;
  const ranges = findRanges(root, terms);
  if (!ranges.length) return false;

  const api = highlightApi();
  if (api) {
    api.registry.set(HIGHLIGHT_NAME, new api.Ctor(...ranges));
  } else {
    // No Highlight API — tint the containing elements instead of splitting text
    // nodes, which would fight React's reconciler.
    for (const range of ranges) {
      range.startContainer.parentElement?.classList.add(FALLBACK_CLASS);
    }
  }

  ranges[0].startContainer.parentElement?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
  return true;
}

/**
 * Highlights and scrolls to the ?q= term after a search result is opened.
 * Retries while the page finishes rendering, since several routes mount their
 * content asynchronously.
 */
export function useSearchHighlight() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    clearHighlights();
    const query = new URLSearchParams(search).get("q");
    if (!query) return;

    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    if (!terms.length) return;

    let done = false;
    const timers: number[] = [];
    const attempt = () => {
      if (done) return;
      if (apply(terms)) done = true;
    };
    for (const delay of [80, 300, 700, 1400, 2500]) {
      timers.push(window.setTimeout(attempt, delay));
    }

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
