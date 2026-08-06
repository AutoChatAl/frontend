'use client';

export interface SpendSlice {
  key: string;
  label: string;
  cents: number;
  /** Preenchimento da fatia — step por modo, validado para CVD e contraste. */
  fillClass: string;
  swatchClass: string;
}

interface SpendPieChartProps {
  slices: SpendSlice[];
  totalCents: number;
  formatValue: (cents: number) => string;
}

const SIZE = 200;
const RADIUS = 92;
const CENTER = SIZE / 2;
/** Abaixo disso o rótulo não cabe dentro da fatia — a legenda assume. */
const MIN_LABEL_PERCENT = 8;

function polarToCartesian(angleDegrees: number, radius: number): { x: number; y: number } {
  // -90° para o arco começar no topo, e não às 3 horas.
  const radians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
}

function arcPath(startAngle: number, endAngle: number): string {
  const start = polarToCartesian(startAngle, RADIUS);
  const end = polarToCartesian(endAngle, RADIUS);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export default function SpendPieChart({ slices, totalCents, formatValue }: SpendPieChartProps) {
  const positive = slices.filter((slice) => slice.cents > 0);
  const describedTotal = positive
    .map((slice) => `${slice.label} ${((slice.cents / totalCents) * 100).toFixed(1)}%`)
    .join(', ');

  let cursor = 0;
  const segments = positive.map((slice) => {
    const percent = (slice.cents / totalCents) * 100;
    const sweep = (slice.cents / totalCents) * 360;
    const start = cursor;
    cursor += sweep;
    const mid = start + sweep / 2;
    const labelPoint = polarToCartesian(mid, RADIUS * 0.62);
    return { slice, percent, start, end: cursor, labelPoint };
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-48 w-48 shrink-0"
        role="img"
        aria-label={`Distribuição dos gastos com IA: ${describedTotal}`}
      >
        {segments.length === 1 ? (
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            className={`${segments[0]?.slice.fillClass} stroke-white dark:stroke-slate-800`}
            strokeWidth={2}
          />
        ) : (
          segments.map(({ slice, start, end }) => (
            <path
              key={slice.key}
              d={arcPath(start, end)}
              /* Traço na cor da superfície cria o respiro de 2px entre as fatias. */
              className={`${slice.fillClass} stroke-white dark:stroke-slate-800`}
              strokeWidth={2}
            />
          ))
        )}
        {segments
          .filter(({ percent }) => percent >= MIN_LABEL_PERCENT)
          .map(({ slice, percent, labelPoint }) => (
            <text
              key={`label-${slice.key}`}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white text-[13px] font-semibold"
            >
              {percent.toFixed(0)}%
            </text>
          ))}
      </svg>

      <ul className="w-full space-y-2.5">
        {slices.map((slice) => {
          const percent = totalCents > 0 ? (slice.cents / totalCents) * 100 : 0;
          return (
            <li key={slice.key} className="flex items-center gap-2.5">
              <span className={`h-3 w-3 shrink-0 rounded-sm ${slice.swatchClass}`} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-600 dark:text-slate-300">{slice.label}</span>
              <span className="shrink-0 text-sm font-semibold text-slate-900 dark:text-white">
                {percent.toFixed(1)}%
              </span>
              <span className="w-24 shrink-0 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                {formatValue(slice.cents)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
