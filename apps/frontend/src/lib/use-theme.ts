import { useEffect, useState } from 'react';

/** UI color scheme. */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'contexthub-theme';

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * index.html's <head> already applies the 'dark' class before React
 * mounts (avoids the wrong-theme flash); this hook only syncs React
 * state with what is already applied, and persists changes.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (typeof window === 'undefined' ? 'light' : getInitialTheme()));

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return { theme, setTheme, toggleTheme };
}
