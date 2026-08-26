import Card from '@/components/Card';

export interface MetricTrend {
    label: string;
    /** positive = bom (verde), negative = atenção (âmbar), neutral = cinza. */
    tone: 'positive' | 'negative' | 'neutral';
}

interface MetricCardProps {
    title: string;
    value: string;
    /** Linha de contexto exibida abaixo do número. */
    hint?: string;
    /** Chip lateral ao número (ex.: variação vs semana passada). */
    trend?: MetricTrend;
    className?: string;
}

const TREND_CLASSES: Record<MetricTrend['tone'], string> = {
  positive: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
  negative: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20',
  neutral: 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600',
};

/** KPI compacto: título em negrito, número tabular e linha inferior com hint à esquerda e chip de variação à direita. */
export default function MetricCard({ title, value, hint, trend, className }: MetricCardProps) {
  return (<Card className={`p-3 sm:p-3.5 min-w-0 flex flex-col ${className ?? ''}`}>
    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{title}</p>
    <p className="mt-1.5 text-xl sm:text-2xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white truncate">{value}</p>
    {(hint || trend) && (<div className="mt-1 flex items-center justify-between gap-2 min-w-0">
      {hint
        ? (<p className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500 truncate">{hint}</p>)
        : <span aria-hidden/>}
      {trend && (<span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold tabular-nums ${TREND_CLASSES[trend.tone]}`}>
        {trend.label}
      </span>)}
    </div>)}
  </Card>);
}
