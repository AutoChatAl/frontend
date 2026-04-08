'use client';

import { useState } from 'react';

const LINE_COLORS = {
  sent: '#6366f1',
  received: '#10b981',
  read: '#0ea5e9',
};

const LINE_LABELS: Record<string, string> = {
  sent: 'Mensagens Enviadas',
  received: 'Mensagens Recebidas',
  read: 'Mensagens Lidas',
};

function formatAxisValue(val: number): string {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  return String(val);
}

interface Props {
  data: { date: string; sent: number; received: number; read: number }[];
}

export default function CombinedLineChart({ data }: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    day: string;
    sent: number;
    received: number;
    read: number;
  } | null>(null);

  if (!data.length) return null;

  const weekday = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  };

  const fullDay = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  };

  const allValues = data.flatMap((d) => [d.sent, d.received, d.read ?? 0]);
  const max = Math.max(...allValues, 1);

  const CHART_W = 460;
  const CHART_H = 170;
  const PAD_L = 32;
  const PAD_R = 8;
  const PAD_T = 10;
  const PAD_B = 18;
  const plotW = CHART_W - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;

  const getX = (i: number) => PAD_L + (i / (data.length - 1 || 1)) * plotW;
  const getY = (val: number) => PAD_T + plotH - (val / max) * plotH;

  const makePath = (key: 'sent' | 'received' | 'read') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key] ?? 0)}`).join(' ');

  const gridLines = 4;
  const gridYs = Array.from({ length: gridLines + 1 }, (_, i) => ({
    y: PAD_T + (i / gridLines) * plotH,
    val: Math.round(max - (i / gridLines) * max),
  }));

  return (
    <div>
      <div className="relative w-full" style={{ aspectRatio: `${CHART_W}/${CHART_H}` }}>
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setTooltip(null)}
        >
          {gridYs.map((g, i) => (
            <g key={i}>
              <line x1={PAD_L} y1={g.y} x2={CHART_W - PAD_R} y2={g.y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth={0.5} />
              <text x={PAD_L - 4} y={g.y + 3} textAnchor="end" className="fill-slate-400 dark:fill-slate-500" fontSize={8}>
                {formatAxisValue(g.val)}
              </text>
            </g>
          ))}

          {data.map((d, i) => (
            <text key={i} x={getX(i)} y={CHART_H - 3} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize={8}>
              {weekday(d.date)}
            </text>
          ))}

          {(['sent', 'received', 'read'] as const).map((key) => (
            <path key={key} d={makePath(key)} fill="none" stroke={LINE_COLORS[key]} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {(['sent', 'received', 'read'] as const).map((key) =>
            data.map((d, i) => (
              <circle key={`${key}-${i}`} cx={getX(i)} cy={getY(d[key] ?? 0)} r={2.5} fill={LINE_COLORS[key]} stroke="white" strokeWidth={1} />
            )),
          )}

          {data.map((d, i) => {
            const x = getX(i);
            const hitW = plotW / data.length;
            return (
              <rect
                key={i}
                x={x - hitW / 2}
                y={PAD_T}
                width={hitW}
                height={plotH}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setTooltip({ x, y: PAD_T, day: fullDay(d.date), sent: d.sent, received: d.received, read: d.read ?? 0 })}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}

          {tooltip && (
            <line x1={tooltip.x} y1={PAD_T} x2={tooltip.x} y2={PAD_T + plotH} stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth={1} strokeDasharray="4 2" pointerEvents="none" />
          )}
        </svg>

        {tooltip && (
          <div
            className="absolute z-20 bg-slate-800 dark:bg-slate-900 text-white rounded-lg shadow-lg px-3 py-2 pointer-events-none"
            style={{ left: `${(tooltip.x / CHART_W) * 100}%`, top: '0', transform: 'translateX(-50%)', minWidth: '170px' }}
          >
            <p className="text-[10px] font-semibold text-slate-300 mb-1 capitalize">{tooltip.day}</p>
            {(['sent', 'received', 'read'] as const).map((key) => (
              <div key={key} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: LINE_COLORS[key] }} />
                  <span className="text-slate-300">{LINE_LABELS[key]}</span>
                </div>
                <span className="font-bold">{tooltip[key].toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mt-3">
        {(['sent', 'received', 'read'] as const).map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: LINE_COLORS[key] }} />
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{LINE_LABELS[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
