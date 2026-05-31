'use client';
import { AlertCircle, Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';

export interface DropdownOption {
    value: string;
    label: string;
    icon?: ReactNode;
}
interface DropdownProps {
    label?: string | undefined;
    error?: string | undefined;
    hint?: string | undefined;
    leftIcon?: ReactNode;
    options: (DropdownOption | string)[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    wrapperClassName?: string;
    id?: string;
}
export default function Dropdown({ label, error, hint, leftIcon, options, value, onChange, placeholder = 'Selecione...', disabled = false, wrapperClassName = '', id }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const buttonId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  // Aceita opções como string (value === label) ou objeto { value, label, icon } — igual ao Select nativo.
  const opts: DropdownOption[] = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const selected = opts.find((o) => o.value === value) ?? null;
  useEffect(() => {
    if (!open)
      return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  useEffect(() => {
    if (open)
      setActiveIndex(options.findIndex((o) => (typeof o === 'string' ? o : o.value) === value));
  }, [open, options, value]);
  const select = (optValue: string) => {
    onChange(optValue);
    setOpen(false);
  };
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled)
      return;
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open)
      return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(opts.length - 1, i + 1));
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = opts[activeIndex];
      if (opt)
        select(opt.value);
    }
  };
  return (<div className={`space-y-1.5 ${wrapperClassName}`}>
    {label && (<label htmlFor={buttonId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
    </label>)}
    <div ref={ref} className="relative">
      <button id={buttonId} type="button" disabled={disabled} onClick={() => !disabled && setOpen((v) => !v)} onKeyDown={handleKeyDown} aria-haspopup="listbox" aria-expanded={open} className={[
        'w-full flex items-center gap-2 py-2.5 border rounded-xl text-sm text-left transition-colors',
        'bg-white dark:bg-slate-900 focus:outline-none focus:ring-2',
        leftIcon ? 'pl-10' : 'pl-4',
        'pr-10',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        error
          ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400'
          : open
            ? 'border-indigo-400 ring-2 ring-indigo-500/20'
            : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-400',
      ].join(' ')}>
        {leftIcon && (<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {leftIcon}
        </span>)}
        <span className={`flex-1 min-w-0 flex items-center gap-2 ${selected ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
          {selected?.icon && <span className="shrink-0 text-slate-400">{selected.icon}</span>}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown size={15} className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && (<ul role="listbox" className="absolute top-full left-0 mt-2 z-50 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150">
        {opts.map((opt, i) => {
          const isSelected = opt.value === value;
          const isActive = i === activeIndex;
          return (<li key={opt.value} role="option" aria-selected={isSelected}>
            <button type="button" onClick={() => select(opt.value)} onMouseEnter={() => setActiveIndex(i)} className={[
              'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors',
              isSelected ? 'text-indigo-700 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300',
              isActive ? 'bg-slate-50 dark:bg-slate-700/50' : '',
            ].join(' ')}>
              {opt.icon && <span className="shrink-0 text-slate-400">{opt.icon}</span>}
              <span className="flex-1 truncate">{opt.label}</span>
              {isSelected && <Check size={15} className="shrink-0 text-indigo-600 dark:text-indigo-400"/>}
            </button>
          </li>);
        })}
      </ul>)}
    </div>
    {error && (<p className="text-xs text-red-500 flex items-center gap-1">
      <AlertCircle size={12}/>
      {error}
    </p>)}
    {hint && !error && (<p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>)}
  </div>);
}
