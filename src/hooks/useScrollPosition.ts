import { useEffect, useState } from "react";

/**
 * useScrollPosition — returns the current vertical scroll offset (px).
 *
 * Used by the Navbar (transparent → glass after 80px) and by the Hero for
 * parallax. The listener is passive for scroll performance.
 */
export function useScrollPosition(): number {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY || document.documentElement.scrollTop || 0);
    };

    handleScroll(); // initialise on mount (e.g. reload mid-page)
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return scrollY;
}
