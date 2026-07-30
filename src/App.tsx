import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useSearchHighlight } from "@/hooks/useSearchHighlight";

import Homepage from "@/pages/Homepage";
import Team from "@/pages/Team";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Vehicles from "@/pages/Vehicles";
import Gallery from "@/pages/Gallery";
import History from "@/pages/History";
import NotFound from "@/pages/NotFound";

/**
 * Reset scroll to the top whenever the route changes — otherwise SPA navigation
 * keeps the previous page's scroll offset.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Block body (no implicit return) — an effect may only return a cleanup
    // function, never the value of window.scrollTo().
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * App — the layout shell shared by every page: skip link, fixed theme toggle,
 * navbar, the routed page in <main>, and the footer.
 */
export default function App() {
  useSearchHighlight();

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <ThemeToggle />
      <Navbar />
      <ScrollToTop />

      <main id="main-content">
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
      </main>

      <Footer />
    </>
  );
}
