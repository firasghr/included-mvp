/**
 * Card — standard container with optional title.
 */
import React from 'react';
import clsx from 'clsx';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-5',
        className
      )}
    >
      {title && (
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

/** Stat card for quick metrics */
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  highlight?: 'red' | 'yellow' | 'green';
}

export function StatCard({ label, value, icon, highlight }: StatCardProps) {
  const highlightClasses = {
    red:    'border-rose-500 dark:border-rose-500',
    yellow: 'border-amber-400 dark:border-amber-400',
    green:  'border-emerald-500 dark:border-emerald-500',
  };

  return (
    <div
      className={clsx(
        'rounded-xl border bg-white dark:bg-slate-900 shadow-sm p-5',
        highlight ? highlightClasses[highlight] : 'border-slate-200 dark:border-slate-700'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
