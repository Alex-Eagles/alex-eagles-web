import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { SEARCH_INDEX } from "@/data/searchIndex";
import { searchItems } from "@/lib/search";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`(\\b(?:${terms.map(escapeRegExp).join("|")}))`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm px-0.5" style={{ background: "#fde047", color: "#1a1a1a" }}>
            {part}
          </mark>
        ) : (
          part
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
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const results = useMemo(() => searchItems(SEARCH_INDEX, query), [query]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  };

  const buttonClass =
    variant === "pill"
      ? "flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 cursor-pointer"
      : "ui-blur flex items-center justify-center w-11 h-11 rounded-full cursor-pointer";
  const buttonStyle: CSSProperties =
    variant === "pill"
      ? { color: "var(--text-secondary)" }
      : { background: "var(--bg-glass)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" };

  return (
    <div ref={boxRef} className={`relative flex items-center ${wrapperClassName}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Search"
        aria-expanded={open}
        className={buttonClass}
        style={buttonStyle}
      >
        {open ? <X size={18} /> : <Search size={18} />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 max-w-[85vw] z-50">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) go(results[0].path);
            }}
            placeholder="Search the site..."
            className="w-full px-3 py-2 text-sm rounded-lg outline-none"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              boxShadow: "var(--elevation-2)",
            }}
          />

          {query.trim() && (
            <div
              className="mt-1 rounded-lg overflow-hidden max-h-80 overflow-y-auto"
              style={{ background: "var(--card)", border: "1px solid var(--border-subtle)", boxShadow: "var(--elevation-3)" }}
            >
              {results.length === 0 ? (
                <p className="px-3 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                  No results
                </p>
              ) : (
                results.map((item, i) => (
                  <button
                    key={`${item.path}-${item.title}-${i}`}
                    type="button"
                    onClick={() => go(item.path)}
                    className="w-full text-left px-3 py-2 text-sm flex flex-col gap-0.5 transition-colors cursor-pointer"
                    style={{ color: "var(--text-primary)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-glass)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>
                      <Highlighted text={item.title} terms={terms} />
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {item.section}
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
