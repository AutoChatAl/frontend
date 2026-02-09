'use client';

import { Plus } from 'lucide-react';
import { type ReactNode } from 'react';

interface AddChannelCardProps {
  onClick?: () => void;
  icon?: ReactNode;
  title: string;
  subtitle: string;
  colorClass: 'emerald' | 'fuchsia';
  disabled?: boolean;
}

export default function AddChannelCard({ onClick, icon, title, subtitle, colorClass, disabled }: AddChannelCardProps) {
  const colorStyles = {
    emerald: {
      border: 'hover:border-emerald-500 dark:hover:border-emerald-500',
      bg: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20',
      iconBg: 'group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50',
      iconColor: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
      textColor: 'group-hover:text-emerald-700 dark:group-hover:text-emerald-400',
    },
    fuchsia: {
      border: 'hover:border-fuchsia-500 dark:hover:border-fuchsia-500',
      bg: 'hover:bg-fuchsia-50/50 dark:hover:bg-fuchsia-900/20',
      iconBg: 'group-hover:bg-fuchsia-100 dark:group-hover:bg-fuchsia-900/50',
      iconColor: 'group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400',
      textColor: 'group-hover:text-fuchsia-700 dark:group-hover:text-fuchsia-400',
    },
  };

  const styles = colorStyles[colorClass];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl ${styles.border} ${styles.bg} transition-all group h-54 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div
        className={`w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 ${styles.iconBg} transition-colors`}
      >
        {icon || (
          <Plus size={24} className={`text-slate-400 dark:text-slate-500 ${styles.iconColor}`} />
        )}
      </div>
      <span className={`font-semibold text-slate-600 dark:text-slate-300 ${styles.textColor}`}>
        {title}
      </span>
      <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</span>
    </button>
  );
}
