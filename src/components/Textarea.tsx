'use client';

import { AlertCircle } from 'lucide-react';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  wrapperClassName?: string;
}

export default function Textarea({
  label,
  error,
  hint,
  wrapperClassName = '',
  className: _,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`space-y-1.5 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        {...props}
        className={[
          'w-full px-4 py-2.5 border rounded-xl text-sm',
          'bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
          'placeholder:text-slate-400 dark:placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 transition-colors resize-none',
          error
            ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400'
            : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-400',
        ].join(' ')}
      />
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
