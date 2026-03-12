'use client';

import { AlertCircle, ChevronDown } from 'lucide-react';
import type { ReactNode, SelectHTMLAttributes } from 'react';

type SelectOption = { value: string; label: string } | string;

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  leftIcon?: ReactNode;
  options: SelectOption[];
  wrapperClassName?: string;
}

export default function Select({
  label,
  error,
  hint,
  leftIcon,
  options,
  wrapperClassName = '',
  className: _,
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`space-y-1.5 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <select
          id={selectId}
          {...props}
          className={[
            'w-full py-2.5 border rounded-xl text-sm',
            'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200',
            'focus:outline-none focus:ring-2 transition-colors appearance-none cursor-pointer',
            leftIcon ? 'pl-10 pr-10' : 'pl-4 pr-10',
            error
              ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400'
              : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-400',
          ].join(' ')}
        >
          {options.map((opt) => {
            const value = typeof opt === 'string' ? opt : opt.value;
            const optLabel = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={value} value={value}>
                {optLabel}
              </option>
            );
          })}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown size={15} />
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
    </div>
  );
}
