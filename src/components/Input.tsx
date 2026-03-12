'use client';

import { AlertCircle } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  wrapperClassName?: string;
}

export default function Input({
  label,
  error,
  hint,
  leftIcon,
  rightElement,
  wrapperClassName = '',
  className: _,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`space-y-1.5 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
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
        <input
          id={inputId}
          {...props}
          className={[
            'w-full py-2.5 border rounded-xl text-sm',
            'bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 transition-colors',
            leftIcon ? 'pl-10' : 'pl-4',
            rightElement ? 'pr-11' : 'pr-4',
            error
              ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400'
              : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-400',
          ].join(' ')}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
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
