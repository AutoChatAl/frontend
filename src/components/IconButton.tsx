'use client';

import type { ReactNode } from 'react';

interface IconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  title?: string;
  variant?: 'default' | 'danger' | 'success' | 'fuchsia' | 'primary';
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export default function IconButton({
  icon,
  onClick,
  title,
  variant = 'default',
  size = 'sm',
  disabled = false,
  className = '',
}: IconButtonProps) {
  const sizeStyles = {
    sm: 'p-1.5',
    md: 'p-2',
  };

  const variantStyles = {
    default: 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
    danger: 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-slate-700',
    success: 'text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700',
    fuchsia: 'text-slate-400 dark:text-slate-500 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:bg-fuchsia-50 dark:hover:bg-slate-700',
    primary: 'text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`${sizeStyles[size]} rounded-lg transition-colors ${variantStyles[variant]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      {icon}
    </button>
  );
}
