import { useEffect, useState } from 'react';

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

// El <head> de index.html ya aplica la clase 'dark' antes de que React
// monte (evita el flash del tema equivocado); este hook solo sincroniza
// el estado de React con lo que ya quedó aplicado, y persiste cambios.
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (typeof window === 'undefined' ? 'light' : getInitialTheme()));

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return { theme, setTheme, toggleTheme };
}
