import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/data/site";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import AeLogo from "@/components/ui/AeLogo";

/**
 * Navbar — a thin, centered pill of page links (translated from Home.dc.html).
 *
 * Behaviour:
 *   - Transparent while at the top of the page; fades to a glass pill with a
 *     border + shadow once scrolled past 80px (matches the design spec).
 *   - The active route link is filled with the brand color.
 *   - Below `md`, the link pill is replaced by a hamburger that opens a
 *     full-screen overlay menu (mobile requirement from the spec).
 *
 * The theme toggle is a separate fixed control (see <ThemeToggle/> in App).
 */
export default function Navbar() {
  const scrollY = useScrollPosition();
  const scrolled = scrollY > 80;
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Shared "is this link the current page?" test.
  const isActive = (path: string) => pathname === path;

  // When the mobile overlay is open: lock body scroll, close on Escape, and
  // move focus into the overlay (basic modal accessibility).
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <>
      {/* ---------- Desktop: centered glass pill ---------- */}
      <nav
        className="fixed top-[35px] left-0 right-0 z-40 hidden md:flex justify-center pointer-events-none"
        aria-label="Primary"
      >
        <div
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-[7px] rounded-full transition-[background,border-color,box-shadow] duration-300"
          style={{
            background: scrolled ? "var(--bg-glass)" : "transparent",
            border: `1px solid ${scrolled ? "var(--border-subtle)" : "transparent"}`,
            boxShadow: scrolled ? "var(--elevation-2)" : "none",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {NAV_LINKS.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                aria-current={active ? "page" : undefined}
                className="font-sans text-sm font-medium tracking-[0.01em] px-4 py-2 rounded-full transition-colors duration-200"
                style={{
                  background: active ? "var(--brand)" : "transparent",
                  color: active ? "#ffffff" : "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ---------- Mobile: hamburger button (top-left) ---------- */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="Open menu"
        aria-expanded={menuOpen}
        className="fixed top-5 left-5 z-40 md:hidden flex items-center justify-center w-11 h-11 rounded-full cursor-pointer"
        style={{
          background: "var(--bg-glass)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <Menu size={22} />
      </button>

      {/* ---------- Mobile: full-screen overlay menu ---------- */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex flex-col items-center justify-center gap-2"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          style={{
            background: "var(--bg-glass)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
          }}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="absolute top-5 right-5 flex items-center justify-center w-11 h-11 rounded-full cursor-pointer"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            <X size={22} />
          </button>

          <AeLogo size={56} className="text-fg mb-4" title="" />

          {NAV_LINKS.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className="font-display font-semibold text-3xl px-6 py-2 rounded-lg transition-colors"
                style={{ color: active ? "var(--brand-light)" : "var(--text-primary)" }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
