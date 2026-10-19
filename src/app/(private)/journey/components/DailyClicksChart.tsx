'use client';
import { useState } from 'react';

import type { DailyClicks } from '@/types/Journey';

import { formatCount, formatShortDate } from './meta';

interface DailyClicksChartProps {
  data: DailyClicks[];
}

const TOOLTIP_EDGE_PERCENT = 12;

export default function DailyClicksChart({ data }: DailyClicksChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((point) => point.clicks));
  const hovered = hoverIndex !== null ? data[hoverIndex] : undefined;
  const [first] = data;
  const middle = data[Math.floor((data.length - 1) / 2)];
  const last = data[data.length - 1];
  const tooltipLeft = hoverIndex !== null
    ? Math.min(100 - TOOLTIP_EDGE_PERCENT, Math.max(TOOLTIP_EDGE_PERCENT, ((hoverIndex + 0.5) / data.length) * 100))
    : 0;

  return (
    <div>
      <div className="flex gap-2">
        <div className="flex h-40 flex-col justify-between text-right text-[10px] tabular-nums text-slate-400 dark:text-slate-500" aria-hidden>
          <span>{formatCount(max)}</span>
          <span>0</span>
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-100 dark:border-slate-700/60" aria-hidden />
          <div
            className="relative flex h-40 items-end gap-0.5 border-b border-slate-200 dark:border-slate-700"
            onPointerLeave={() => setHoverIndex(null)}
            aria-hidden
          >
            {data.map((point, index) => (
              <div
                key={point.date}
                className="flex h-full flex-1 items-end justify-center"
                onPointerEnter={() => setHoverIndex(index)}
                onPointerDown={() => setHoverIndex(index)}
              >
                <div
                  className={`w-full max-w-6 rounded-t transition-colors ${hoverIndex === index ? 'bg-indigo-600' : 'bg-indigo-500'}`}
                  style={{ height: point.clicks > 0 ? `${Math.max(2, (point.clicks / max) * 100)}%` : 0 }}
                />
              </div>
            ))}
          </div>
          {hovered && (
            <div
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-none"
              style={{ left: `${tooltipLeft}%` }}
            >
              <p className="font-medium text-slate-900 dark:text-white">{formatShortDate(hovered.date)}</p>
              <p className="tabular-nums text-slate-500 dark:text-slate-400">
                {formatCount(hovered.clicks)} {hovered.clicks === 1 ? 'clique' : 'cliques'}
              </p>
            </div>
          )}
          <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-slate-400 dark:text-slate-500" aria-hidden>
            <span>{first ? formatShortDate(first.date) : ''}</span>
            <span>{middle && data.length > 2 ? formatShortDate(middle.date) : ''}</span>
            <span>{last && data.length > 1 ? formatShortDate(last.date) : ''}</span>
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>Cliques por dia</caption>
        <thead>
          <tr>
            <th scope="col">Dia</th>
            <th scope="col">Cliques</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.date}>
              <td>{formatShortDate(point.date)}</td>
              <td>{point.clicks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
