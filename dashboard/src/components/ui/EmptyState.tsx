/**
 * EmptyState — shown when a list or table has no data.
 */
import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 dark:text-slate-400">
      {icon && <div className="mb-3 text-4xl">{icon}</div>}
      <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      {description && <p className="mt-1 text-sm">{description}</p>}
    </div>
  );
}
