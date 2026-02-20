/**
 * Header — top bar with page title, dark mode toggle, and menu button (mobile).
 */
import React from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/clients': 'Clients',
  '/notifications': 'Notifications',
  '/logs': 'Logs',
  '/settings': 'Settings',
};

interface HeaderProps {
  dark: boolean;
  onToggleDark: () => void;
  onMenuClick: () => void;
}

export function Header({ dark, onToggleDark, onMenuClick }: HeaderProps) {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'Dashboard';

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
        aria-label="Open menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h1>

      {/* Dark mode toggle */}
      <button
        onClick={onToggleDark}
        className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Toggle dark mode"
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </header>
  );
}
