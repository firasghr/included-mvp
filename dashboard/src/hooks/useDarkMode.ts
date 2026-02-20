/**
 * useDarkMode — persists dark/light mode preference in localStorage.
 */
import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('included-dark-mode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('included-dark-mode', String(dark));
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}
