'use client';

import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DAYS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function isoToDate(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function dateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatBR(iso: string): string {
  const d = isoToDate(iso);
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function DatePicker({
  value,
  onChange,
  min,
  placeholder = 'Selecione uma data',
}: DatePickerProps) {
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const minDate = min ? (isoToDate(min) ?? todayDate) : todayDate;
  const todayISO = dateToISO(todayDate);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(isoToDate(value)?.getFullYear() ?? todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(isoToDate(value)?.getMonth() ?? todayDate.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = isoToDate(value);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((v) => v - 1); }
    else setViewMonth((v) => v - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((v) => v + 1); }
    else setViewMonth((v) => v + 1);
  };

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const offset = (firstDow + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

  const cells: Date[] = [];
  for (let i = offset - 1; i >= 0; i--) {
    cells.push(new Date(viewYear, viewMonth - 1, daysInPrev - i));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewYear, viewMonth, d));
  }
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push(new Date(viewYear, viewMonth + 1, nextDay++));
  }

  const handleSelect = (date: Date) => {
    if (date < minDate) return;
    onChange(dateToISO(date));
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const goToday = () => {
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
    if (!(todayDate < minDate)) {
      onChange(todayISO);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 border-2 rounded-xl text-sm transition-all bg-white dark:bg-slate-900 ${
          open
            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <Calendar
          size={16}
          className={`shrink-0 transition-colors ${open ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'}`}
        />
        <span
          className={`flex-1 text-left ${
            value ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {value ? formatBR(value) : placeholder}
        </span>
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 transition-colors"
          >
            <X size={14} />
          </button>
        ) : (
          <ChevronRight
            size={14}
            className={`shrink-0 transition-transform text-slate-300 dark:text-slate-600 ${open ? 'rotate-90' : 'rotate-0'}`}
          />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/30 p-4 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150">

          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-800 dark:text-white">
              {MONTHS_PT[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1.5">
            {DAYS_PT.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide py-1"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((date, i) => {
              const iso = dateToISO(date);
              const isCurrentMonth = date.getMonth() === viewMonth;
              const isSelected = iso === value;
              const isToday = iso === todayISO;
              const isDisabled = date < minDate;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelect(date)}
                  className={`aspect-square flex items-center justify-center rounded-lg text-xs transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 font-semibold scale-105'
                      : isDisabled
                        ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
                        : isToday && isCurrentMonth
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold ring-1 ring-inset ring-indigo-300 dark:ring-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                          : isCurrentMonth
                            ? 'text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                            : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {value ? formatBR(value) : 'Nenhuma data selecionada'}
            </span>
            <button
              type="button"
              onClick={goToday}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
