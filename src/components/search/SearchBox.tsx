import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { loadEngine, runSearch, type SearchHit } from "@/lib/searchEngine";

const SNIPPET_PAD = 46;

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Trims long copy down to a window around the first match. */
function snippet(text: string, terms: string[]) {
  if (text.length <= 110 || !terms.length) return text;
  const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])(${terms.map(escapeRe).join("|")})`, "iu");
  const found = re.exec(text);
  if (!found) return text.slice(0, 110) + "…";
  const at = found.index;
  const start = Math.max(0, at - SNIPPET_PAD);
  const end = Math.min(text.length, at + SNIPPET_PAD * 2);
  return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
}

function Marked({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`(${terms.map(escapeRe).join("|")})`, "giu");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} style={{ background: "#fde047", color: "#1a1a1a", borderRadius: 2, padding: "0 1px" }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

interface Props {
  /**
   * `pill`     — icon button in the desktop nav pill; the field drops below it.
   * `floating` — standalone round glass button.
   * `inline`   — no toggle button: the field is always open and the results list
   *              flows underneath in normal layout. Used inside the mobile menu,
   *              where an absolutely-positioned panel would escape the overlay.
   */
  variant?: "pill" | "floating" | "inline";
  wrapperClassName?: string;
  /** Called after a result is picked — lets the mobile menu close itself. */
  onNavigate?: () => void;
}

export default function SearchBox({ variant = "pill", wrapperClassName = "", onNavigate }: Props) {
  const inline = variant === "inline";
  // The inline field has no button to toggle, so it starts (and stays) open.
  const [open, setOpen] = useState(inline);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const runId = useRef(0);
  const navigate = useNavigate();

  const terms = query.trim().toLowerCase().split(/\s+/).filter((t) => t.length > 1);

  // Don't steal focus for the inline field: it mounts together with the mobile
  // menu, and autofocusing there throws the on-screen keyboard over the links
  // the user opened the menu to tap. They can tap the field when they want it.
  useEffect(() => {
    if (open && !inline) inputRef.current?.focus();
  }, [open, inline]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    const id = ++runId.current;
    const timer = window.setTimeout(() => {
      runSearch(trimmed).then((results) => {
        if (runId.current !== id) return; // a newer keystroke already won
        setHits(results);
        setActive(0);
        setBusy(false);
      });
    }, 120);
    return () => clearTimeout(timer);
  }, [query]);

  const close = useCallback(() => {
    // The inline field is the menu's permanent search row — collapsing it would
    // leave an empty gap, so "close" there only means "clear what was typed".
    if (!inline) setOpen(false);
    setQuery("");
    setHits([]);
  }, [inline]);

  useEffect(() => {
    if (!open || inline) return;
    const onPointer = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open, inline, close]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (hit: SearchHit) => {
    const parts = [`q=${encodeURIComponent(query.trim())}`, `t=${encodeURIComponent(hit.text.slice(0, 140))}`];
    if (hit.params) parts.push(hit.params);
    if (hit.anchor) parts.push(`a=${encodeURIComponent(hit.anchor)}`);
    navigate(`${hit.route}?${parts.join('&')}`);
    close();
    onNavigate?.();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return close();
    if (!hits.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(hits[active]);
    }
  };

  const pill = variant === "pill";
  const buttonClass = pill
    ? "flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 cursor-pointer"
    : "ui-blur flex items-center justify-center w-11 h-11 rounded-full cursor-pointer";
  const buttonStyle: CSSProperties = pill
    ? { color: "var(--text-secondary)" }
    : {
        background: "var(--bg-glass)",
        border: "1px solid var(--border-subtle)",
        color: "var(--text-primary)",
      };

  const showPanel = query.trim().length >= 2;

  return (
    <div
      ref={boxRef}
      data-search-ui
      className={
        inline
          ? `flex flex-col w-full ${wrapperClassName}`
          : `relative flex items-center ${wrapperClassName}`
      }
    >
      {!inline && (
        <button
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          onMouseEnter={() => loadEngine()}
          aria-label="Search"
          aria-expanded={open}
          className={buttonClass}
          style={buttonStyle}
        >
          {open ? <X size={18} /> : <Search size={18} />}
        </button>
      )}

      {open && (
        <div
          className={
            inline
              ? "w-full"
              : "absolute right-0 top-full mt-2 w-[min(22rem,85vw)] z-50"
          }
        >
          <div className="relative">
            {/* The inline field has no toggle button to carry the icon, so it
                wears one inside the input as its affordance. */}
            {inline && (
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => loadEngine()}
              placeholder="Search the site…"
              aria-label="Search the site"
              className={`w-full pr-9 outline-none ${
                inline ? "pl-10 py-3 text-base rounded-xl" : "pl-3 py-2 text-sm rounded-lg"
              }`}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                boxShadow: "var(--elevation-2)",
              }}
            />
            {busy && (
              <Loader2
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin"
                style={{ color: "var(--text-muted)" }}
              />
            )}
          </div>

          {showPanel && (
            <div
              ref={listRef}
              // Shorter cap inline: the on-screen keyboard eats the bottom half
              // of the viewport, so a 60vh list would scroll off behind it.
              className={`mt-1 rounded-lg overflow-y-auto ${
                inline ? "max-h-[min(18rem,38vh)]" : "max-h-[min(24rem,60vh)]"
              }`}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--elevation-3)",
              }}
            >
              {hits.length === 0 ? (
                <p className="px-3 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                  {busy ? "Searching…" : `No matches for "${query.trim()}"`}
                </p>
              ) : (
                hits.map((hit, i) => (
                  <button
                    key={hit.id}
                    data-idx={i}
                    type="button"
                    onClick={() => go(hit)}
                    onMouseMove={() => setActive(i)}
                    className="w-full text-left px-3 py-2 text-sm flex flex-col gap-0.5 cursor-pointer"
                    style={{
                      color: "var(--text-primary)",
                      background: i === active ? "var(--bg-glass)" : "transparent",
                    }}
                  >
                    <span className="line-clamp-2">
                      <Marked text={snippet(hit.text, terms)} terms={terms} />
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {hit.page}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
