'use client';

import { useState } from 'react';

export const PIE_PALETTE = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#e11d48', '#7c3aed', '#0ea5e9', '#d946ef', '#22d3ee',
];

export interface CollabSlice {
  name: string;
  value: number;
  color: string;
}

interface Props {
  slices: CollabSlice[];
}

const VB = 220;
const CX = VB / 2;
const CY = VB / 2;
const R = 90;
const R_HOVER = 98;

function arcPath(startAngle: number, endAngle: number, r: number): string {
  const sweep = endAngle - startAngle;
  if (sweep >= Math.PI * 2 - 0.001) {
    const midAngle = startAngle + Math.PI;
    const x1 = CX + r * Math.cos(startAngle);
    const y1 = CY + r * Math.sin(startAngle);
    const xm = CX + r * Math.cos(midAngle);
    const ym = CY + r * Math.sin(midAngle);
    return `M ${x1} ${y1} A ${r} ${r} 0 1 1 ${xm} ${ym} A ${r} ${r} 0 1 1 ${x1} ${y1} Z`;
  }
  const x1 = CX + r * Math.cos(startAngle);
  const y1 = CY + r * Math.sin(startAngle);
  const x2 = CX + r * Math.cos(endAngle);
  const y2 = CY + r * Math.sin(endAngle);
  const largeArc = sweep > Math.PI ? 1 : 0;
  return `M ${CX} ${CY} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export default function CollaboratorsPieChart({ slices }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const visibleSlices = slices.filter((s) => s.value > 0);

  if (total === 0) {
    return (
      <div>
        <div className="flex justify-center">
          <div style={{ width: '60%', maxWidth: 220, minWidth: 120, aspectRatio: '1/1' }}>
            <svg viewBox={`0 0 ${VB} ${VB}`} className="w-full h-full">
              <circle cx={CX} cy={CY} r={R} fill="currentColor" className="text-slate-100 dark:text-slate-700" />
              <text x={CX} y={CY - 8} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize={13} fontWeight="500">Sem dados</text>
              <text x={CX} y={CY + 12} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize={10}>neste período</text>
            </svg>
          </div>
        </div>
        <div className="mt-3 max-h-[72px] overflow-y-auto">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
            {slices.map((sl, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded px-1.5 py-0.5">
                <span className="w-2 h-2 rounded-full shrink-0 opacity-40" style={{ backgroundColor: sl.color }} />
                <span className="text-xs text-slate-400 dark:text-slate-500">{sl.name}: <strong>0</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  type ArcData = { startAngle: number; endAngle: number; slice: CollabSlice; idx: number };
  const arcs: ArcData[] = [];
  let angle = -Math.PI / 2;
  visibleSlices.forEach((sl, idx) => {
    const sweep = (sl.value / total) * Math.PI * 2;
    arcs.push({ startAngle: angle, endAngle: angle + sweep, slice: sl, idx });
    angle += sweep;
  });

  const hovered = hoveredIdx !== null ? visibleSlices[hoveredIdx] : null;

  return (
    <div>
      <div className="flex justify-center">
        <div
          className="relative"
          style={{ width: '60%', maxWidth: 220, minWidth: 120, aspectRatio: '1/1' }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <svg viewBox={`0 0 ${VB} ${VB}`} className="w-full h-full">
            {arcs.map((a) => {
              const isHover = hoveredIdx === a.idx;
              return (
                <path
                  key={a.idx}
                  d={arcPath(a.startAngle, a.endAngle, isHover ? R_HOVER : R)}
                  fill={a.slice.color}
                  opacity={hoveredIdx !== null && !isHover ? 0.5 : 1}
                  stroke="white"
                  strokeWidth={1.5}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredIdx(a.idx)}
                />
              );
            })}
          </svg>

          {hovered && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-slate-800 dark:bg-slate-900 text-white rounded-lg shadow-lg px-3 py-2 text-center max-w-[150px]">
                <p className="text-[10px] text-slate-300 truncate">{hovered.name}</p>
                <p className="text-sm font-bold">{hovered.value.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-slate-400">{((hovered.value / total) * 100).toFixed(1)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 max-h-[72px] overflow-y-auto">
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
          {slices.map((sl, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 cursor-pointer rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              onMouseEnter={() => {
                const visIdx = visibleSlices.findIndex((v) => v.name === sl.name);
                if (visIdx >= 0) setHoveredIdx(visIdx);
              }}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sl.color }} />
              <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[110px]">
                {sl.name}{sl.value === 0 ? ': 0' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
