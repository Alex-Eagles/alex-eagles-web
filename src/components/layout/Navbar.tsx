import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/data/site";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { useTheme } from "@/context/ThemeContext";
import AeLogo from "@/components/ui/AeLogo";
import AeLockup from "@/components/ui/AeLockup";
import SearchBox from "@/components/search/SearchBox";

/**
 * Navbar — a thin, centered pill of page links (translated from Home.dc.html).
 *
 * Behaviour:
 *   - Transparent while at the top of the page; fades to a glass pill with a
 *     border + shadow once scrolled past 80px (matches the design spec).
 *   - The active route link is filled with the brand color.
 *   - Below `md`, the link pill is replaced by a hamburger that opens a
 *     full-screen overlay menu (mobile requirement from the spec). Search lives
 *     inside that overlay rather than as a second fixed button — the hamburger
 *     is the only chrome on the left, the ThemeToggle the only chrome on the
 *     right.
 *
 * The theme toggle is a separate fixed control (see <ThemeToggle/> in App).
 */
// Fired on hover over the "Vehicles" link, well before the click: warms the
// browser cache for the inline vehicle bundle (see Vehicles.tsx) and its
// hero video so the page doesn't stall on those fetches after navigation.
let vehiclePrefetched = false;
function prefetchVehiclePage() {
  if (vehiclePrefetched) return;
  vehiclePrefetched = true;
  fetch("/vehicle/index.html", { credentials: "same-origin" }).catch(() => {});
  fetch("/vehicle/support.js", { credentials: "same-origin" }).catch(() => {});
  // Prefetch hint (not a forced full download) for the large hero video.
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "video";
  link.href = "/vehicle/assets/landing.mp4";
  document.head.appendChild(link);
}

export default function Navbar() {
  const scrollY = useScrollPosition();
  const scrolled = scrollY > 80;
  const { pathname } = useLocation();
  const { isDark } = useTheme();
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
      {/*
       * ---------- Brand mark (top-left) ----------
       *
       * Desktop only. Below `md` the hamburger already owns the top-left corner
       * and the toggle the top-right, which is the whole of the mobile chrome —
       * a logo squeezed between them would be an addition to a bar that's
       * deliberately spare, so `hidden md:flex` leaves phones untouched.
       *
       * Mirrors <ThemeToggle/> opposite it (md:top-[35px] md:right-8) so the
       * two pieces of fixed chrome sit at the same height. Both share the nav
       * pill's own `top-[35px]` rather than a separate guessed offset — the
       * toggle (51px) and the logo's `md:h-12` (48px) box are both close
       * enough to the pill's own rendered height that starting all three from
       * the same top edge lines up their centres too, instead of the ~11px
       * mismatch a shorter top produced.
       *
       * AeLockup handles the theme swap itself — white emblem and white type on
       * dark, blue emblem and matching blue type on light.
       */}
      <Link
        to="/"
        aria-label="Alex Eagles — home"
        className="fixed z-40 md:top-[35px] md:left-8 hidden md:flex items-center h-12 transition-opacity duration-200 hover:opacity-80"
      >
        {/* Keyed on the route so the wordmark replays its entrance on every
            navigation. The navbar itself never unmounts between pages, so
            without this the animation would run once on first load and never
            again. */}
        <AeLockup key={pathname} size={44} />
      </Link>

      {/* ---------- Desktop: centered glass pill ---------- */}
      <nav
        className="fixed top-[35px] left-0 right-0 z-40 hidden md:flex justify-center pointer-events-none"
        aria-label="Primary"
      >
        <div
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-[7px] rounded-full transition-[background,border-color,box-shadow] duration-300"
          style={{
            // Fully transparent-at-top only works in dark mode, where hero
            // photos/video are dark enough for light link text to read on
            // their own. In light mode the pill still blurs whatever photo
            // sits behind it (e.g. the Blog hero), so it keeps a light glass
            // tint even before the scrolled state kicks in.
            background: scrolled ? "var(--bg-glass)" : isDark ? "transparent" : "rgba(255,255,255,0.55)",
            border: `1px solid ${scrolled || !isDark ? "var(--border-subtle)" : "transparent"}`,
            boxShadow: scrolled ? "var(--elevation-2)" : isDark ? "none" : "0 4px 20px rgba(13,16,48,0.08)",
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
                  if (link.path === "/vehicles") prefetchVehiclePage();
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                {link.label}
              </Link>
            );
          })}
          <SearchBox variant="pill" />
        </div>
      </nav>

      {/* ---------- Mobile: hamburger button (top-left) ---------- */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="Open menu"
        aria-expanded={menuOpen}
        className="ui-blur fixed top-5 left-5 z-40 md:hidden flex items-center justify-center w-11 h-11 rounded-full cursor-pointer"
        style={{
          background: "var(--bg-glass)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
          transition: "background-color var(--transition-slow), border-color var(--transition-slow)",
          /* Blur comes from `.ui-blur` — pointer devices only. */
        }}
      >
        <Menu size={22} />
      </button>

      {/* ---------- Mobile: full-screen overlay menu ----------
           Search lives in here rather than as its own top-right button: that
           button sat at the same fixed corner as the ThemeToggle and overlapped
           it. One hamburger now reveals both the search field and the links. */}
      {menuOpen && (
        <div
          // Scrollable, because the search results list can grow taller than the
          // viewport once the keyboard is up. `m-auto` on the inner column keeps
          // everything vertically centred while it still fits (plain
          // `justify-center` would clip the top once it overflows).
          className="fixed inset-0 z-50 md:hidden flex flex-col overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          style={{
            background: "var(--bg-glass)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            transition: "background-color var(--transition-slow)",
          }}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="fixed top-5 right-5 z-10 flex items-center justify-center w-11 h-11 rounded-full cursor-pointer"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              transition: "background-color var(--transition-slow), border-color var(--transition-slow)",
            }}
          >
            <X size={22} />
          </button>

          <div className="m-auto w-full max-w-sm flex flex-col items-center gap-2 px-6 py-20">
            <AeLogo size={56} className="text-fg mb-4" title="" />

            <SearchBox
              variant="inline"
              wrapperClassName="mb-4"
              onNavigate={() => setMenuOpen(false)}
            />

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
        </div>
      )}
    </>
  );
}
