import { createContext, useContext, useLayoutEffect, useState } from 'react';
import AppIcon from './AppIcon';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'rescue-app-theme';

function initialTheme() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Private browsing can disable storage; the switch still works for this visit.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // A disabled storage API should not prevent changing the current view.
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark') }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const context = useContext(ThemeContext);
  if (!context) return null;
  const { theme, toggleTheme } = context;
  const isDark = theme === 'dark';

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AppIcon name={isDark ? 'sun' : 'moon'} size={17} />
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
