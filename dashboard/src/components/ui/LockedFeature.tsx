/**
 * LockedFeature — wraps any component with a visual "locked" overlay.
 * Use this for features that are not yet implemented.
 */
import React from 'react';

interface LockedFeatureProps {
  message?: string;
  children: React.ReactNode;
}

export function LockedFeature({ message = 'Not implemented yet', children }: LockedFeatureProps) {
  return (
    <div className="relative group">
      <div className="pointer-events-none select-none opacity-40 blur-[0.5px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-900/10 dark:bg-slate-950/40 backdrop-blur-[1px] z-10">
        <div className="flex items-center gap-2 bg-slate-900 dark:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {message}
        </div>
      </div>
    </div>
  );
}
