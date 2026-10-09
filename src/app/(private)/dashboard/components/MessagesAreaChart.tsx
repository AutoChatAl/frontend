'use client';
import { useEffect, useId, useRef, useState } from 'react';

import { useTheme } from '@/contexts/ThemeContext';

export interface DailyPoint {
    date: string;
    sent: number;
    received: number;
    read: number;
    /** Novos contatos criados no dia (usado pelos sparklines). */
    contacts?: number;
    aiSent?: number;
    automatedSent?: number;
    manualSent?: number;
}

export type MessageSeriesKey = 'aiSent' | 'manualSent' | 'automatedSent';

interface SeriesDef {
    key: MessageSeriesKey;
    label: string;
    /** Label curta para telas pequenas (tabs lado a lado no mobile). */
    shortLabel: string;
    light: string;
    dark: string;
}

/**
 * Séries de origem dos envios. Paleta validada (CVD + contraste) para as duas
 * superfícies: light = white, dark = zinc-900. Ver DESIGN_SYSTEM.md §14.
 */
export const MESSAGE_SERIES: SeriesDef[] = [
  { key: 'aiSent', label: 'Enviadas pela IA', shortLabel: 'IA', light: '#6366f1', dark: '#6366f1' },
  { key: 'manualSent', label: 'Enviadas manualmente', shortLabel: 'Manualmente', light: '#10b981', dark: '#059669' },
  { key: 'automatedSent', label: 'Enviadas por automações', shortLabel: 'Automações', light: '#f59e0b', dark: '#d97706' },
];

export function seriesColor(series: SeriesDef, darkMode: boolean): string {
  return darkMode ? series.dark : series.light;
}

const GRID_LINES = 4;
const PAD_T = 12;
const PAD_R = 4;
const PAD_B = 24;
const PAD_L = 36;

function formatAxisValue(val: number): string {
  if (val >= 1000000)
    return `${(val / 1000000).toFixed(1).replace('.0', '')}M`;
  if (val >= 1000)
    return `${(val / 1000).toFixed(1).replace('.0', '')}k`;
  if (!Number.isInteger(val))
    return val.toFixed(1);
  return String(val);
}

/** Arredonda para cima em passos "bonitos" (1 / 2 / 2.5 / 5 × 10^k). */
function niceCeil(raw: number): number {
  const exp = Math.floor(Math.log10(raw));
  const base = Math.pow(10, exp);
  const n = raw / base;
  const snapped = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return snapped * base;
}

function weekday(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
}

function shortDay(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/** Até uma semana o dia da semana basta; acima disso ele se repete e a data entra no lugar. */
const WEEKDAY_LABEL_MAX_POINTS = 7;

function fullDay(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

interface Props {
    data: DailyPoint[];
    /** Altura do plot em px (a largura é sempre 100% do container). */
    height?: number;
    /** Séries visíveis (controladas pelas tabs do card). Omitido = todas. */
    visibleKeys?: MessageSeriesKey[];
}

export default function MessagesAreaChart({ data, height = 240, visibleKeys }: Props) {
  const gradientId = useId();
  const { darkMode } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el)
      return;
    const observer = new ResizeObserver((entries) => {
      const [entry] = entries;
      if (entry)
        setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  if (!data.length)
    return null;

  const series = visibleKeys ? MESSAGE_SERIES.filter((s) => visibleKeys.includes(s.key)) : MESSAGE_SERIES;
  const plotW = Math.max(width - PAD_L - PAD_R, 0);
  const plotH = Math.max(height - PAD_T - PAD_B, 0);
  const rawMax = Math.max(...data.flatMap((d) => series.map((s) => d[s.key] ?? 0)), 1);
  const step = niceCeil(rawMax / GRID_LINES);
  const yMax = step * GRID_LINES;

  const getX = (i: number) => PAD_L + (i / (data.length - 1 || 1)) * plotW;
  const getY = (val: number) => PAD_T + plotH - (val / yMax) * plotH;

  /** Curva suave (bumpX): tangentes horizontais, sem overshoot vertical. */
  const linePath = (key: MessageSeriesKey): string => {
    return data
      .map((d, i) => {
        const x = getX(i);
        const y = getY(d[key] ?? 0);
        if (i === 0)
          return `M ${x} ${y}`;
        const prevX = getX(i - 1);
        const midX = (prevX + x) / 2;
        const prevY = getY(data[i - 1]?.[key] ?? 0);
        return `C ${midX} ${prevY}, ${midX} ${y}, ${x} ${y}`;
      })
      .join(' ');
  };

  const areaPath = (key: MessageSeriesKey): string => {
    const baseline = PAD_T + plotH;
    return `${linePath(key)} L ${getX(data.length - 1)} ${baseline} L ${getX(0)} ${baseline} Z`;
  };

  const gridYs = Array.from({ length: GRID_LINES + 1 }, (_, i) => ({
    y: PAD_T + (i / GRID_LINES) * plotH,
    val: yMax - i * step,
  }));

  const useWeekdayLabels = data.length <= WEEKDAY_LABEL_MAX_POINTS;
  const labelEvery = useWeekdayLabels ? 1 : Math.max(1, Math.ceil(data.length / 6));

  const updateHover = (clientX: number) => {
    const el = containerRef.current;
    if (!el)
      return;
    const x = clientX - el.getBoundingClientRect().left;
    const ratio = plotW > 0 ? (x - PAD_L) / plotW : 0;
    const idx = Math.round(ratio * (data.length - 1));
    setHoverIdx(Math.min(Math.max(idx, 0), data.length - 1));
  };

  const hovered = hoverIdx !== null ? data[hoverIdx] : undefined;
  const tooltipX = hoverIdx !== null ? Math.min(Math.max(getX(hoverIdx), 92), Math.max(width - 92, 92)) : 0;

  return (<div ref={containerRef} className="relative w-full select-none" style={{ height }} onPointerMove={(e) => updateHover(e.clientX)} onPointerDown={(e) => updateHover(e.clientX)} onPointerLeave={() => setHoverIdx(null)}>
    {width > 0 && (<svg width={width} height={height} role="img" aria-label="Origem dos envios por dia: IA, manuais e automações" className="block">
      <defs>
        {MESSAGE_SERIES.map((s) => (<linearGradient key={s.key} id={`${gradientId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={seriesColor(s, darkMode)} stopOpacity={darkMode ? 0.32 : 0.22}/>
          <stop offset="100%" stopColor={seriesColor(s, darkMode)} stopOpacity={0.02}/>
        </linearGradient>))}
      </defs>

      {gridYs.map((g, i) => (<g key={i}>
        <line x1={PAD_L} y1={g.y} x2={width - PAD_R} y2={g.y} stroke="currentColor" strokeWidth={1} className={i === GRID_LINES ? 'text-slate-200 dark:text-slate-700' : 'text-slate-100 dark:text-slate-700/60'}/>
        <text x={PAD_L - 8} y={g.y + 3.5} textAnchor="end" fontSize={10} className="fill-slate-400 dark:fill-slate-500">
          {formatAxisValue(g.val)}
        </text>
      </g>))}

      {data.map((d, i) => (i % labelEvery === 0 ? (<text key={d.date} x={getX(i)} y={height - 6} textAnchor="middle" fontSize={10} className="fill-slate-400 dark:fill-slate-500 capitalize">
        {useWeekdayLabels ? weekday(d.date) : shortDay(d.date)}
      </text>) : null))}

      {series.map((s) => (<path key={`area-${s.key}`} d={areaPath(s.key)} fill={`url(#${gradientId}-${s.key})`} stroke="none"/>))}

      {series.map((s) => (<path key={`line-${s.key}`} d={linePath(s.key)} fill="none" stroke={seriesColor(s, darkMode)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>))}

      {series.length > 0 && hoverIdx !== null && hovered && (<g>
        <line x1={getX(hoverIdx)} y1={PAD_T} x2={getX(hoverIdx)} y2={PAD_T + plotH} stroke="currentColor" strokeWidth={1} className="text-slate-300 dark:text-slate-600"/>
        {series.map((s) => (<circle key={`dot-${s.key}`} cx={getX(hoverIdx)} cy={getY(hovered[s.key] ?? 0)} r={4} fill={seriesColor(s, darkMode)} strokeWidth={2} className="stroke-white dark:stroke-slate-800"/>))}
      </g>)}
    </svg>)}

    {series.length === 0 && (<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <p className="text-xs text-slate-400 dark:text-slate-500">Selecione uma métrica acima para visualizar</p>
    </div>)}

    {series.length > 0 && hovered && (<div className="absolute z-20 top-1 pointer-events-none bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg dark:shadow-none px-3 py-2 min-w-[168px]" style={{ left: tooltipX, transform: 'translateX(-50%)' }}>
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-300 mb-1.5 capitalize">{fullDay(hovered.date)}</p>
      {series.map((s) => (<div key={s.key} className="flex items-center justify-between gap-4 text-xs leading-5">
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seriesColor(s, darkMode) }}/>
          {s.label}
        </span>
        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{(hovered[s.key] ?? 0).toLocaleString('pt-BR')}</span>
      </div>))}
    </div>)}
  </div>);
}
