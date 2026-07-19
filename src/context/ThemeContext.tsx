import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
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
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Reflect the theme onto <html> and persist it whenever it changes.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore write failures (private mode, quota) */
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggle = useCallback(
    () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  return (
    <ThemeContext.Provider
      value={{ theme, isDark: theme === "dark", toggle, setTheme }}
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
