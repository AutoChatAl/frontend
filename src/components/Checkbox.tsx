'use client';

import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string | ReactNode;
    description?: string;
    disabled?: boolean;
    className?: string;
}

export default function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}: CheckboxProps) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={`
          w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center
          ${checked
      ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 group-hover:border-indigo-400 dark:group-hover:border-indigo-500'
    }
          ${!disabled && 'peer-focus:ring-2 peer-focus:ring-indigo-500/20 peer-focus:ring-offset-2 dark:peer-focus:ring-offset-slate-900'}
        `}>
          <Check
            size={14}
            className={`text-white transition-all duration-200 ${checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
            strokeWidth={3}
          />
        </div>
      </div>

      {(label || description) && (
        <div className="flex-1 select-none">
          {label && (
            typeof label === 'string' ? (
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
                {label}
              </span>
            ) : (
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
              </div>
            )
          )}
          {description && (
            <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}
