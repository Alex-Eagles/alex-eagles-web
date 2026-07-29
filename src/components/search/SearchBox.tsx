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
  variant?: "pill" | "floating";
  wrapperClassName?: string;
}

export default function SearchBox({ variant = "pill", wrapperClassName = "" }: Props) {
  const [open, setOpen] = useState(false);
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

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

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
    setOpen(false);
    setQuery("");
    setHits([]);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open, close]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (hit: SearchHit) => {
    const q = query.trim();
    navigate(`${hit.route}?q=${encodeURIComponent(q)}`);
    close();
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
    <div ref={boxRef} className={`relative flex items-center ${wrapperClassName}`}>
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

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(22rem,85vw)] z-50">
          <div className="relative">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search the site…"
              aria-label="Search the site"
              className="w-full pl-3 pr-9 py-2 text-sm rounded-lg outline-none"
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
              className="mt-1 rounded-lg overflow-y-auto max-h-[min(24rem,60vh)]"
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
