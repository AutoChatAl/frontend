import { readHealth, type HealthZone } from '../diagnosis';

// Semicírculo de 180°: 0 fica à esquerda (crítico), 100 à direita (saudável).
const CX = 100;
const CY = 100;
const RADIUS = 76;

const ZONES: { zone: HealthZone; label: string; from: number; to: number; stroke: string; text: string; pill: string }[] = [
  {
    zone: 'critico',
    label: 'Crítico',
    from: 2,
    to: 32,
    stroke: 'stroke-red-500',
    text: 'text-red-600 dark:text-red-400',
    pill: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  },
  {
    zone: 'risco',
    label: 'Risco',
    from: 35,
    to: 65,
    stroke: 'stroke-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    pill: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  },
  {
    zone: 'saudavel',
    label: 'Saudável',
    from: 68,
    to: 98,
    stroke: 'stroke-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
];

function pointAt(value: number, radius: number) {
  const angle = Math.PI * (1 - value / 100);
  return { x: CX + radius * Math.cos(angle), y: CY - radius * Math.sin(angle) };
}

function arcPath(from: number, to: number) {
  const start = pointAt(from, RADIUS);
  const end = pointAt(to, RADIUS);
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`;
}

interface HealthGaugeProps {
  score: number;
  className?: string;
}

export default function HealthGauge({ score, className = '' }: HealthGaugeProps) {
  const health = readHealth(score);
  const current = ZONES.find((item) => item.zone === health.zone);
  const needle = pointAt(score, RADIUS * 0.82);

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-5 text-center shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:shadow-none ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Saúde da sua operação
      </p>
      <svg viewBox="0 0 200 118" role="img" aria-label={`Nota ${score} de 100: ${health.label}`} className="mx-auto mt-3 w-52">
        {ZONES.map((item) => (
          <path
            key={item.zone}
            d={arcPath(item.from, item.to)}
            className={item.stroke}
            strokeWidth={15}
            strokeLinecap="round"
            fill="none"
          />
        ))}
        <line
          x1={CX}
          y1={CY}
          x2={needle.x}
          y2={needle.y}
          className="stroke-slate-900 dark:stroke-white"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r={8} className="fill-slate-900 dark:fill-white" />
        <circle cx={CX} cy={CY} r={3.5} className="fill-white dark:fill-slate-800" />
      </svg>
      <p className={`-mt-2 text-4xl font-bold tabular-nums ${current?.text ?? ''}`}>
        {score}
        <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">/100</span>
      </p>
      <p className={`mt-1 text-base font-semibold ${current?.text ?? ''}`}>{health.label}</p>
      <div className="mt-4 flex justify-center gap-1.5">
        {ZONES.map((item) => (
          <span
            key={item.zone}
            className={`max-w-24 flex-1 rounded-md px-1 py-1.5 text-xs font-semibold uppercase tracking-wider transition-opacity ${item.pill} ${
              item.zone === health.zone ? '' : 'opacity-30'
            }`}
          >
            {item.label}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{health.note}</p>
    </div>
  );
}
