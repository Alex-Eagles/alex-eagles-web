import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * ThemeContext — the single owner of dark/light state for the whole app.
 *
 * How it works:
 *  - It sets `data-theme="dark|light"` on <html>. theme.css swaps the entire
 *    color palette based on that attribute, so no component needs theme logic.
 *  - The choice is persisted to localStorage under "ae-theme" and restored on
 *    the next visit (dark is the brand default for first-time visitors).
 *
 * Usage:
 *   const { theme, toggle } = useTheme();
 */

type Theme = "dark" | "light";

const STORAGE_KEY = "ae-theme";

/**
 * What the browser chrome is tinted to per theme — must track --bg-primary in
 * theme.css. The dark value is duplicated in index.html's static meta tag so
 * the first paint is right before any JS runs.
 */
const THEME_COLORS: Record<Theme, string> = {
  dark: "#07091c",
  light: "#f7f8ff",
};

interface ThemeContextValue {
  /** What the site should render as right now — a pin, if one is set, else the preference. */
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
  /**
   * Pin the whole site to one theme for as long as a route needs it, or pass
   * `null` to release. /vehicles is a fixed dark design, so it pins dark.
   *
   * A pin changes what everything renders as but never touches the saved
   * preference, so leaving the route restores whatever the visitor had chosen —
   * and closing the tab while pinned doesn't quietly rewrite it either.
   */
  pinTheme: (theme: Theme | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Read the saved preference (falling back to the dark brand default). */
function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* localStorage can throw in private mode — ignore and use the default. */
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  /* The visitor's own choice. This is the only thing that is ever persisted. */
  const [preference, setThemeState] = useState<Theme>(getInitialTheme);
  /* A route-level override (see pinTheme). Null when nothing is pinning. */
  const [pinned, setPinned] = useState<Theme | null>(null);
  const theme = pinned ?? preference;
  const isFirstRun = useRef(true);

  // Reflect the theme onto <html> and persist it whenever it changes.
  useEffect(() => {
    const root = document.documentElement;

    /*
     * Wrap the flip in `.theme-transitioning` (see global.css) so every
     * themed surface crossfades together instead of snapping while only the
     * body's own transition eases. Skipped under prefers-reduced-motion —
     * and on the very first run, so the initial theme doesn't visibly fade
     * in on load — and removed after the crossfade finishes so hover/press
     * transitions elsewhere don't inherit its duration in between toggles.
     */
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let clearTransitionClass: (() => void) | undefined;
    if (!reduceMotion && !isFirstRun.current) {
      root.classList.add("theme-transitioning");
      const timer = setTimeout(
        () => root.classList.remove("theme-transitioning"),
        450,
      );
      clearTransitionClass = () => {
        clearTimeout(timer);
        root.classList.remove("theme-transitioning");
      };
    }
    isFirstRun.current = false;

    root.setAttribute("data-theme", theme);

    /*
     * Keep the browser chrome in step with the theme. index.html ships a
     * theme-color for the dark default so the first paint is already right;
     * this is what updates it when the user toggles. Without it the toolbar
     * keeps the dark tint on a light page.
     *
     * `color-scheme` itself is declared in theme.css per data-theme, so the
     * browser's own surfaces follow along without any JS.
     */
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = THEME_COLORS[theme];

    return clearTransitionClass;
  }, [theme]);

  /*
   * Persist the preference, not the effective theme. Keeping this separate from
   * the effect above is the whole point of the split: a route that pins dark
   * (see pinTheme) must not overwrite what the visitor actually chose, or
   * closing the tab on /vehicles would silently make dark their new default.
   */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      /* ignore write failures (private mode, quota) */
    }
  }, [preference]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggle = useCallback(
    () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    [],
  );
  const pinTheme = useCallback((next: Theme | null) => setPinned(next), []);

  return (
    <ThemeContext.Provider
      value={{ theme, isDark: theme === "dark", toggle, setTheme, pinTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/** Access the current theme + controls. Throws if used outside the provider. */
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a <ThemeProvider>.");
  return ctx;
}
