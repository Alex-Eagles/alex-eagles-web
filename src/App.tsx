import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useSearchHighlight } from "@/hooks/useSearchHighlight";

/*
 * Every route used to be a static import, so visiting any single page —
 * even the homepage — downloaded and parsed the code for all seven of them
 * plus their dependencies (Team's photo roster, Gallery's lightbox, History's
 * three.js journey, the Vehicles inline-mount machinery) in one ~535KB/167KB
 * gzip bundle before React could render anything. A route-level lazy()
 * boundary means each page's code is fetched only when its route is actually
 * visited, which is what the page-load complaint that prompted this was
 * actually about — the JS, not any one asset.
 *
 * Homepage stays a static import: it's what a first-time visitor lands on
 * most often, so there's nothing to gain by making it wait on its own chunk
 * the way the others benefit from not blocking it.
 */
import Homepage from "@/pages/Homepage";
const Team = lazy(() => import("@/pages/Team"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const Vehicles = lazy(() => import("@/pages/Vehicles"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const History = lazy(() => import("@/pages/History"));
const NotFound = lazy(() => import("@/pages/NotFound"));

/**
 * Reset scroll to the top whenever the route changes — otherwise SPA navigation
 * keeps the previous page's scroll offset.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // A hash means the destination wants a specific anchor (e.g. /team#software
    // from the homepage org chart) — let the target page scroll itself there
    // rather than yanking to the top and fighting it.
    if (hash) return;
    // Block body (no implicit return) — an effect may only return a cleanup
    // function, never the value of window.scrollTo().
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

/**
 * Suspense fallback for a lazy route chunk. Only ever visible on a cold
 * cache — react-router already has the Routes tree mounted, so this covers
 * just the moment a chunk is in flight, not a blank page. `min-h-screen`
 * keeps the footer from riding up underneath it while that chunk loads.
 */
function RouteFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <span className="font-mono text-xs uppercase tracking-[0.3em] text-fg-muted">
        Loading…
      </span>
    </div>
  );
}

/**
 * App — the layout shell shared by every page: skip link, fixed theme toggle,
 * navbar, the routed page in <main>, and the footer.
 */
export default function App() {
  useSearchHighlight();

  // The /vehicles Neith experience is a fixed dark-only design, so the global
  // light/dark toggle doesn't apply there — hide it on that route only.
  const { pathname } = useLocation();
  const showThemeToggle = pathname !== "/vehicles";

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {showThemeToggle && <ThemeToggle />}
      <Navbar />
      <ScrollToTop />

      <main id="main-content">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/team" element={<Team />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/history" element={<History />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </>
  );
}
