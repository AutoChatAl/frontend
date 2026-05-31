'use client';

import { AlertCircle, Check, ChevronDown, Search, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
  description?: string | undefined;
  icon?: ReactNode;
  badge?: string;
  badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  disabled?: boolean;
}

type RawOption<V extends string> = SelectOption<V> | string;

interface SelectProps<V extends string = string> {
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  options: RawOption<V>[];
  value?: V | '';
  defaultValue?: V | '';
  onChange?: (value: V) => void;
  disabled?: boolean;
  searchable?: boolean;
  searchThreshold?: number;
  searchPlaceholder?: string;
  emptyMessage?: string;
  wrapperClassName?: string;
  triggerClassName?: string;
  clearable?: boolean;
  onClear?: () => void;
  id?: string;
  name?: string;
  size?: 'sm' | 'md';
}

const BADGE_TONE: Record<NonNullable<SelectOption['badgeTone']>, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  danger: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  info: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
};

function normalizeOption<V extends string>(opt: RawOption<V>): SelectOption<V> {
  if (typeof opt === 'string') return { value: opt as V, label: opt };
  return opt;
}

export default function Select<V extends string = string>({
  label,
  placeholder = 'Selecione...',
  error,
  hint,
  leftIcon,
  options,
  value,
  defaultValue,
  onChange,
  disabled = false,
  searchable,
  searchThreshold = 6,
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Nenhuma opção encontrada',
  wrapperClassName = '',
  triggerClassName = '',
  clearable = false,
  onClear,
  id,
  size = 'md',
}: SelectProps<V>) {
  const reactId = useId();
  const selectId = id ?? `select-${reactId}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [internalValue, setInternalValue] = useState<V | ''>(defaultValue ?? '');
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; placeAbove: boolean } | null>(null);

  const normalizedOptions = useMemo<SelectOption<V>[]>(
    () => options.map((o) => normalizeOption(o as RawOption<V>)),
    [options],
  );

  const showSearch = searchable ?? normalizedOptions.length > searchThreshold;

  const filteredOptions = useMemo(() => {
    if (!showSearch || !search.trim()) return normalizedOptions;
    const q = search.trim().toLowerCase();
    return normalizedOptions.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.description ? o.description.toLowerCase().includes(q) : false),
    );
  }, [normalizedOptions, search, showSearch]);

  const selectedOption = useMemo(
    () => normalizedOptions.find((o) => o.value === currentValue) ?? null,
    [normalizedOptions, currentValue],
  );

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return null;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeightEstimate = Math.min(360, normalizedOptions.length * 48 + (showSearch ? 56 : 0) + 16);
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < menuHeightEstimate && rect.top > spaceBelow;

    return {
      top: placeAbove ? rect.top - menuHeightEstimate - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      placeAbove,
    };
  }, [normalizedOptions.length, showSearch]);

  const handleToggleOpen = () => {
    if (disabled) return;
    if (open) {
      setOpen(false);
      return;
    }
    const pos = computePosition();
    if (pos) setPosition(pos);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleScroll = () => setOpen(false);
    const handleResize = () => {
      const pos = computePosition();
      if (pos) setPosition(pos);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, computePosition]);

  useEffect(() => {
    if (open && showSearch) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, showSearch]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setHighlightIndex(-1);
    }
  }, [open]);

  const commitChange = (opt: SelectOption<V>) => {
    if (opt.disabled) return;
    if (!isControlled) setInternalValue(opt.value);
    onChange?.(opt.value);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isControlled) setInternalValue('');
    onClear?.();
    onChange?.('' as V);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((idx) => Math.min(filteredOptions.length - 1, idx + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((idx) => Math.max(0, idx - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filteredOptions[highlightIndex];
      if (opt) commitChange(opt);
    }
  };

  const sizeClasses = size === 'sm' ? 'py-1.5 text-xs min-h-[32px]' : 'py-2 text-sm min-h-[38px]';

  const renderBadge = (opt: SelectOption<V>) => {
    if (!opt.badge) return null;
    const tone = BADGE_TONE[opt.badgeTone ?? 'default'];
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${tone}`}>
        {opt.badge}
      </span>
    );
  };

  return (
    <div className={`space-y-1 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-medium text-slate-600 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          disabled={disabled}
          onClick={handleToggleOpen}
          className={[
            'flex w-full items-center gap-2 rounded-lg border transition-colors',
            'bg-white dark:bg-slate-800',
            sizeClasses,
            leftIcon ? 'pl-10 pr-9' : 'pl-3 pr-9',
            'text-left',
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-600',
            error
              ? 'border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-400'
              : 'border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400',
            triggerClassName,
          ].join(' ')}
        >
          {selectedOption ? (
            <span className="flex flex-1 items-center gap-2 truncate">
              {selectedOption.icon && (
                <span className="flex shrink-0 items-center text-slate-500 dark:text-slate-400">
                  {selectedOption.icon}
                </span>
              )}
              <span className="truncate text-slate-800 dark:text-slate-100">
                {selectedOption.label}
              </span>
              {renderBadge(selectedOption)}
            </span>
          ) : (
            <span className="flex-1 truncate text-slate-400 dark:text-slate-500">{placeholder}</span>
          )}

          <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-slate-400">
            {clearable && selectedOption && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="rounded p-0.5 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
              >
                <X size={14} />
              </span>
            )}
            <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </span>
        </button>
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}

      {open && position && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          onKeyDown={handleKeyDown}
          style={{ position: 'fixed', top: position.top, left: position.left, width: position.width, zIndex: 9999 }}
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-100 dark:border-slate-700 dark:bg-slate-800"
        >
          {showSearch && (
            <div className="border-b border-slate-100 p-2 dark:border-slate-700">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 outline-none focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-800"
                />
              </div>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-slate-400">{emptyMessage}</div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === currentValue;
                const isHighlighted = idx === highlightIndex;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    onClick={() => commitChange(opt)}
                    className={[
                      'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                      opt.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                      isHighlighted && !opt.disabled
                        ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100'
                        : 'text-slate-700 dark:text-slate-200',
                    ].join(' ')}
                  >
                    {opt.icon && (
                      <span className="flex shrink-0 items-center text-slate-500 dark:text-slate-400">
                        {opt.icon}
                      </span>
                    )}
                    <span className="flex flex-1 flex-col">
                      <span className="flex items-center gap-2 truncate font-medium">
                        {opt.label}
                        {renderBadge(opt)}
                      </span>
                      {opt.description && (
                        <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {opt.description}
                        </span>
                      )}
                    </span>
                    {isSelected && <Check size={15} className="shrink-0 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
