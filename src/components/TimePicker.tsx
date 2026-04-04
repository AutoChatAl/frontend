'use client';

import { Clock3 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  minuteStep?: number;
  disabled?: boolean;
}

function normalizePart(input: string | undefined, fallback: string, max: number) {
  const numeric = Number(input);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > max) return fallback;
  return String(numeric).padStart(2, '0');
}

export default function TimePicker({
  value,
  onChange,
  minuteStep = 5,
  disabled = false,
}: TimePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState<'hour' | 'minute' | null>(null);

  const [rawHour, rawMinute] = String(value || '').split(':');
  const hour = normalizePart(rawHour, '00', 23);
  const minute = normalizePart(rawMinute, '00', 59);

  const safeStep = Number.isFinite(minuteStep) && minuteStep > 0 && minuteStep <= 60 ? minuteStep : 5;
  const minuteOptions = useMemo(() => {
    const options = Array.from({ length: Math.ceil(60 / safeStep) }, (_, idx) => {
      const val = Math.min(idx * safeStep, 59);
      return String(val).padStart(2, '0');
    });
    if (!options.includes(minute)) {
      options.push(minute);
      options.sort((a, b) => Number(a) - Number(b));
    }
    return options;
  }, [safeStep, minute]);

  const hourOptions = useMemo(
    () => Array.from({ length: 24 }, (_, idx) => String(idx).padStart(2, '0')),
    [],
  );

  useEffect(() => {
    if (!openMenu) return;
    const handleOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [openMenu]);

  const handleMinuteChange = (nextMinute: string) => {
    onChange(`${hour}:${nextMinute}`);
    setOpenMenu(null);
  };

  const handleHourChange = (nextHour: string) => {
    onChange(`${nextHour}:${minute}`);
    setOpenMenu(null);
  };

  return (
    <div
      ref={rootRef}
      className={`relative w-full min-w-0 flex items-center gap-1 px-3 py-2 border rounded-xl text-sm bg-white dark:bg-slate-900 transition-all ${
        openMenu
          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      } ${
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      }`}
    >
      <Clock3 size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />

      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => !disabled && setOpenMenu((prev) => (prev === 'hour' ? null : 'hour'))}
            disabled={disabled}
            className={`w-8 h-6 px-1 text-sm tabular-nums flex items-center justify-center transition-colors rounded-md ${
              openMenu === 'hour'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                : 'text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{hour}</span>
          </button>

          <span className="text-slate-400 dark:text-slate-500 text-xs">:</span>

          <button
            type="button"
            onClick={() => !disabled && setOpenMenu((prev) => (prev === 'minute' ? null : 'minute'))}
            disabled={disabled}
            className={`w-8 h-6 px-1 text-sm tabular-nums flex items-center justify-center transition-colors rounded-md ${
              openMenu === 'minute'
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                : 'text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{minute}</span>
          </button>
        </div>
      </div>

      {openMenu === 'hour' && (
        <div className="absolute z-50 top-full mt-2 left-8 w-18 max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg p-1">
          {hourOptions.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => handleHourChange(h)}
              className={`w-full px-2 py-1.5 text-sm text-center rounded-md tabular-nums transition-colors ${
                h === hour
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {openMenu === 'minute' && (
        <div className="absolute z-50 top-full mt-2 right-0 w-18 max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg p-1">
          {minuteOptions.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleMinuteChange(m)}
              className={`w-full px-2 py-1.5 text-sm text-center rounded-md tabular-nums transition-colors ${
                m === minute
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
