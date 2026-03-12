import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 gap-4">
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
        {description && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20"
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  );
}
