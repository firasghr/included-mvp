/**
 * LoginPage — simple auth gate for the dashboard.
 *
 * If VITE_DASHBOARD_ACCESS_CODE is set in the environment, the user must enter it
 * to access the dashboard. The result is persisted in sessionStorage so the user
 * stays logged in for the session. If the env var is not set, auth is bypassed.
 */
import React, { useState } from 'react';

interface LoginPageProps {
  onAuthenticated: () => void;
}

const ACCESS_CODE = import.meta.env.VITE_DASHBOARD_ACCESS_CODE as string | undefined;

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ACCESS_CODE || code === ACCESS_CODE) {
      sessionStorage.setItem('dashboard-auth', '1');
      onAuthenticated();
    } else {
      setError(true);
      setCode('');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">🤖</span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-50">Included AI</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Dashboard — restricted access</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300">
                ⚠️ Incorrect access code. Please try again.
              </div>
            )}
            <div>
              <label htmlFor="access-code" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Access Code
              </label>
              <input
                id="access-code"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(false); }}
                placeholder="Enter your access code"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm py-2.5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              Sign In
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          Internal tool — authorized personnel only
        </p>
      </div>
    </div>
  );
}
