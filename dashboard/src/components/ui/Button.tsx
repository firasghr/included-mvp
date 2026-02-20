/**
 * Button — reusable button component with variants.
 * Accepts a `locked` prop to show the component as disabled with a tooltip.
 */
import React from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  locked?: boolean;
  lockMessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:   'bg-sky-600 hover:bg-sky-700 text-white',
  secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100',
  danger:    'bg-rose-600 hover:bg-rose-700 text-white',
  ghost:     'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
};

const SIZE_CLASSES = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  locked = false,
  lockMessage = 'Coming soon',
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading || locked;

  return (
    <div className="relative inline-block group">
      <button
        {...props}
        disabled={isDisabled}
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-md font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
          SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
          isDisabled && 'opacity-50 cursor-not-allowed',
          locked && 'cursor-not-allowed',
          className
        )}
      >
        {locked && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
        {loading ? (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : null}
        {children}
      </button>
      {locked && (
        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
          <span className="bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow">
            {lockMessage}
          </span>
        </div>
      )}
    </div>
  );
}
