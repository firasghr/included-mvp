/**
 * Badge — small coloured pill for statuses.
 */
import clsx from 'clsx';
import React from 'react';

type Variant = 'green' | 'yellow' | 'red' | 'gray' | 'blue';

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  green:  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  yellow: 'bg-amber-100   text-amber-800   dark:bg-amber-900/40   dark:text-amber-300',
  red:    'bg-rose-100    text-rose-800    dark:bg-rose-900/40    dark:text-rose-300',
  gray:   'bg-slate-100   text-slate-700   dark:bg-slate-800      dark:text-slate-300',
  blue:   'bg-sky-100     text-sky-800     dark:bg-sky-900/40     dark:text-sky-300',
};

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
