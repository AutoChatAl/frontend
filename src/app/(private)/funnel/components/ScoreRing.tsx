import type { LeadTemperature } from '@/types/Funnel';

import { TEMPERATURE_META } from './meta';

interface ScoreRingProps {
  score: number;
  temperature: LeadTemperature;
  size?: number;
}

export default function ScoreRing({ score, temperature, size = 40 }: ScoreRingProps) {
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const color = TEMPERATURE_META[temperature].ring;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-100 dark:stroke-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke="currentColor"
          className={`${color} transition-[stroke-dashoffset] duration-500`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-200">
        {clamped}
      </span>
    </div>
  );
}
