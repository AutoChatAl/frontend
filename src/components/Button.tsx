'use client';

import { Loader2 } from 'lucide-react';
import React, { type ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  children,
  onClick,
  icon,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  loadingText,
  type = 'button',
}: ButtonProps) {
  const baseStyles = 'flex items-center gap-2 rounded-lg font-medium transition-all hover:scale-105 active:scale-95';

  const variantStyles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none',
    secondary: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600',
    ghost: 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-200 dark:shadow-none',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const isDisabled = disabled || loading;
  const displayIcon = loading ? <Loader2 size={14} className="animate-spin" /> : icon;
  const displayText = loading && loadingText ? loadingText : children;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} ${isDisabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
    >
      {displayIcon && <span className="flex shrink-0">{displayIcon}</span>}
      {displayText}
    </button>
  );
}
