'use client';
import { AlertCircle } from 'lucide-react';
import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string | undefined;
    error?: string | undefined;
    hint?: string | undefined;
    leftIcon?: ReactNode;
    rightElement?: ReactNode;
    wrapperClassName?: string;
}
export default function Input({ label, error, hint, leftIcon, rightElement, wrapperClassName = '', className: _, id, required, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
  const errorId = `${inputId}-error`;
  return (<div className={`space-y-1.5 ${wrapperClassName}`}>
    {label && (<label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
      {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
    </label>)}
    <div className="relative">
      {leftIcon && (<div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        {leftIcon}
      </div>)}
      <input id={inputId} required={required} {...props} {...(error ? { 'aria-invalid': true, 'aria-describedby': errorId } : {})} className={[
        'w-full py-2.5 border rounded-xl text-sm',
        'bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
        'placeholder:text-slate-400 dark:placeholder:text-slate-500',
        'focus:outline-none focus:ring-2 transition-colors',
        leftIcon ? 'pl-10' : 'pl-4',
        rightElement ? 'pr-11' : 'pr-4',
        error
          ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400'
          : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-400',
      ].join(' ')}/>
      {rightElement && (<div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>)}
    </div>
    {error && (<p id={errorId} role="alert" className="text-xs text-red-500 flex items-center gap-1">
      <AlertCircle size={12} aria-hidden="true"/>
      {error}
    </p>)}
    {hint && !error && (<p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>)}
  </div>);
}
