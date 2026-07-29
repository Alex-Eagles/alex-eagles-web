import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const HIGHLIGHT_NAME = "ae-search";
const TINT_CLASS = "ae-search-fallback";
const TARGET_CLASS = "ae-search-target";
const STYLE_ATTR = "data-ae-search-style";
/** Kept small on purpose: every painted range is re-measured on animated pages. */
const MAX_MATCHES = 40;
const RETRY_DELAYS = [100, 300, 700, 1200, 1800, 2600, 3600, 5000];
/** How long we keep re-scrolling to correct for late layout shifts. */
const SETTLE_MS = 2200;

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
const isLaidOut = (el: Element) => el.getClientRects().length > 0;
const isIndexable = (el: Element) => !el.closest("nav, script, style, noscript, [data-search-ui]");

/** Roots we have painted into, so cleanup doesn't have to re-walk the document. */
let touched: Root[] = [document];

function clearHighlights() {
  highlightApi()?.registry.delete(HIGHLIGHT_NAME);
  for (const root of touched) {
    root
      .querySelectorAll("." + TINT_CLASS + ", ." + TARGET_CLASS)
      .forEach((el) => el.classList.remove(TINT_CLASS, TARGET_CLASS));
  }
  touched = [document];
}

/**
 * The document plus every open shadow root — the Vehicles page mounts its build
 * experience into custom elements, whose text is otherwise invisible to both
 * querySelectorAll and the tree walker.
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

/**
 * Bring a hidden target on screen by driving whatever control owns it. The
 * Vehicles gallery keeps every component page in the DOM but display:none until
 * its dot is clicked, so a match on page 3 exists yet can never be seen.
 * Returns true when something was activated and the caller should retry.
 */
function reveal(el: Element): boolean {
  // The component explorer keeps every panel mounted but display:none, and
  // switches them from a rail of buttons keyed by the same name.
  const panel = el.closest<HTMLElement>("[data-exp-panel]");
  if (panel && getComputedStyle(panel).display === "none") {
    const key = panel.getAttribute("data-exp-panel");
    const tab = document.querySelector<HTMLElement>(`[data-exp="${key}"]`);
    if (tab) {
      tab.click();
      return true;
    }
  }

  // The matching component photo is a sibling image toggled the same way.
  const photo = el.closest<HTMLElement>('[id^="vp-exp-"]');
  if (photo && getComputedStyle(photo).display === "none") {
    const tab = document.querySelector<HTMLElement>(
      `[data-exp="${photo.id.replace("vp-exp-", "")}"]`,
    );
    if (tab) {
      tab.click();
      return true;
    }
  }

  // The photo gallery pages every tile set behind a dot.
  const page = el.closest<HTMLElement>(".vpg-page");
  if (page && getComputedStyle(page).display === "none") {
    const index = /vpg-page-(\d+)/.exec(page.id)?.[1];
    const dots = document.querySelectorAll<HTMLElement>(".vpg-dot");
    if (index !== undefined && dots[Number(index)]) {
      dots[Number(index)].click();
      return true;
    }
  }

  // A collapsed tile whose detail card is the thing we matched.
  const tile = el.closest<HTMLElement>(".vpg-tile");
  if (tile && tile !== el && !isLaidOut(el) && isLaidOut(tile)) {
    tile.click();
    return true;
  }
  return false;
}

function findRanges(root: Node, pattern: RegExp, limit: number): Range[] {
  const ranges: Range[] = [];
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

  let node: Node | null;
  while ((node = walker.nextNode()) && ranges.length < limit) {
    const value = node.nodeValue ?? "";
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(value)) && ranges.length < limit) {
      if (!m[1]) break;
      const start = m.index + (m[0].length - m[1].length);
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + m[1].length);
      ranges.push(range);
    }
  }
  return ranges;
}

/** The exact phrase that was clicked, tolerant of reflowed whitespace. */
function phrasePattern(target: string): RegExp | null {
  const words = norm(target).split(" ").filter(Boolean);
  if (!words.length) return null;
  return new RegExp("(" + words.map(escapeRe).join("\\s+") + ")", "giu");
}

function termsPattern(terms: string[]): RegExp {
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])(${terms.map(escapeRe).join("|")})`, "giu");
}

/** Elements labelled by attribute rather than text — sponsor logos, icon buttons. */
function attributeMatches(roots: Root[], target: string): Element[] {
  const wanted = norm(target);
  const out: Element[] = [];
  for (const root of roots) {
    root.querySelectorAll("[alt],[title],[aria-label]").forEach((el) => {
      if (!isIndexable(el)) return;
      const hit = ["alt", "title", "aria-label"].some((a) =>
        norm(el.getAttribute(a) ?? "").includes(wanted),
      );
      if (hit) out.push(el);
    });
  }
  return out;
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
 * A modal has taken the viewport: the body is pinned and the reader is looking
 * at a card, not the page behind it. Scrolling now would move the ground under
 * them and land somewhere else when the card closes.
 */
function modalOpen(): boolean {
  return document.body.style.position === "fixed";
}

/**
 * Scroll-reveal blocks start translated down and transparent. Landing on one
 * mid-animation shows a section with its heading offset and its spacing wrong,
 * so settle every reveal in the section we are about to scroll to.
 */
function settleReveals(focus: Element) {
  const section = focus.closest("section") ?? focus.parentElement;
  const blocks = section ? [...section.querySelectorAll("[data-reveal]")] : [];
  for (const el of [...blocks, ...ancestorReveals(focus)]) {
    const style = (el as HTMLElement).style;
    style.opacity = "1";
    style.transform = "none";
  }
}

function ancestorReveals(el: Element): Element[] {
  const out: Element[] = [];
  let node: Element | null = el;
  while (node) {
    if (node.hasAttribute?.("data-reveal")) out.push(node);
    node = node.parentElement;
  }
  return out;
}

function attempt(terms: string[], target: string | null, anchor: string | null): boolean {
  if (modalOpen()) return true;
  const roots = collectRoots();
  ensureShadowStyles(roots);
  touched = roots;

  // An anchored result (a history milestone) names its element outright, and
  // everything is then searched inside it — cheaper and unambiguous.
  let scope: Element | null = null;
  if (anchor) {
    for (const root of roots) {
      const found = root.querySelector("#" + CSS.escape(anchor));
      if (found) {
        scope = found;
        break;
      }
    }
    if (!scope) return false; // not rendered yet — a later retry will find it
  }

  const phrase = target ? phrasePattern(target) : null;
  const searchIn: Node[] = scope ? [scope] : roots;

  // Highlight what was actually clicked ("Sara Gharib"), not merely the query.
  let ranges: Range[] = [];
  for (const root of searchIn) {
    if (phrase) ranges.push(...findRanges(root, phrase, MAX_MATCHES - ranges.length));
    if (ranges.length >= MAX_MATCHES) break;
  }
  if (!ranges.length && terms.length) {
    const pattern = termsPattern(terms);
    for (const root of searchIn) {
      ranges.push(...findRanges(root, pattern, MAX_MATCHES - ranges.length));
      if (ranges.length >= MAX_MATCHES) break;
    }
  }

  const labelled = target && !scope ? attributeMatches(roots, target) : [];
  if (!ranges.length && !labelled.length && !scope) return false;

  // A hidden match is worth nothing until whatever owns it is opened.
  const firstEl = ranges[0]?.startContainer.parentElement ?? labelled[0] ?? scope;
  if (firstEl && !isLaidOut(firstEl) && reveal(firstEl)) return false;

  paint(ranges);
  // Marquees duplicate their contents, so outline every copy — whichever one is
  // on screen carries the highlight, without stopping the animation.
  for (const el of labelled) el.classList.add(TARGET_CLASS);

  const visibleRange = ranges.find((r) => {
    const el = r.startContainer.parentElement;
    return el && isLaidOut(el);
  });
  const focus =
    visibleRange?.startContainer.parentElement ??
    labelled.find(isLaidOut) ??
    (scope && isLaidOut(scope) ? scope : null) ??
    ranges[0]?.startContainer.parentElement ??
    labelled[0] ??
    scope;
  if (!focus) return false;

  settleReveals(focus);
  // Instant, not smooth: a long scroll animation on a pinned section lands
  // somewhere else by the time it finishes.
  focus.scrollIntoView({ behavior: "auto", block: "center" });
  return true;
}

/**
 * Highlights the clicked search result and scrolls to it, retrying while the
 * route finishes rendering — several pages mount content asynchronously, and
 * a few only reveal it once a control is driven.
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
    const anchor = params.get("a");
    if (!terms.length && !target) return;

    const startedAt = Date.now();
    let settled = false;
    const timers = RETRY_DELAYS.map((delay) =>
      window.setTimeout(() => {
        if (settled) return;
        // Keep correcting while the page is still moving under us, then stop.
        if (attempt(terms, target, anchor) && Date.now() - startedAt > SETTLE_MS) {
          settled = true;
        }
      }, delay),
    );

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearHighlights();
    };
    document.addEventListener("keydown", onKey);

    // Any click ends the search state: the reader has moved on, and leaving the
    // retries armed means a later one yanks the page back after they have opened
    // a card or scrolled away. Click rather than pointerdown so that a touch
    // drag scrolls the page without cancelling, and the guard covers the click
    // that navigated here in the first place.
    let dismiss = () => {};
    const armed = window.setTimeout(() => {
      dismiss = () => {
        settled = true;
        timers.forEach(clearTimeout);
        clearHighlights();
        document.removeEventListener("click", dismiss, true);
      };
      document.addEventListener("click", dismiss, true);
    }, 250);

    return () => {
      settled = true;
      timers.forEach(clearTimeout);
      window.clearTimeout(armed);
      document.removeEventListener("click", dismiss, true);
      document.removeEventListener("keydown", onKey);
      clearHighlights();
    };
  }, [pathname, search]);
}
