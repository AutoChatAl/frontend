'use client';
import Link from 'next/link';

import Card from '@/components/Card';
import { useSubscription } from '@/contexts/SubscriptionContext';

/**
 * Card de uso de IA do ciclo atual: mensagens de IA consumidas vs. limite do
 * plano, com barra de progresso (violeta → âmbar ≥ 80% → vermelho ≥ 100%).
 */
export default function AiUsageCard() {
  const { usage, loading, hasAiPlan } = useSubscription();
  const ai = usage?.aiMessages;
  const used = ai?.used ?? 0;
  const limit = ai?.limit ?? 0;
  const unlimited = limit === -1;
  const pct = unlimited || limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const remaining = unlimited ? null : Math.max(0, limit - used);
  const extraUsed = usage?.extraAiMessages?.used ?? 0;
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-violet-500 dark:bg-violet-600';

  return (<Card className="p-3 sm:p-3.5 h-full flex flex-col">
    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Mensagens de IA mensais</p>

    {loading && !usage ? (<div className="flex-1 flex flex-col justify-center gap-2 mt-2 animate-pulse" aria-hidden>
      <div className="h-6 w-20 rounded-md bg-slate-100 dark:bg-slate-700/60"/>
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700/60"/>
    </div>) : !hasAiPlan && limit <= 0 ? (<div className="flex-1 flex flex-col items-start justify-center gap-0.5 mt-2 min-w-0">
      <p className="text-xs text-slate-600 dark:text-slate-400">Seu plano ainda não inclui IA.</p>
      <Link href="/plans" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
          Conhecer planos de IA
      </Link>
    </div>) : (<div className="flex-1 flex flex-col justify-end mt-2 min-w-0">
      <p className="text-xl sm:text-2xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white truncate">
        {used.toLocaleString('pt-BR')}
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {unlimited ? ' / ilimitado' : ` / ${limit.toLocaleString('pt-BR')}`} mensagens
        </span>
      </p>

      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700/60 overflow-hidden mt-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${unlimited ? 100 : pct}%`, opacity: unlimited ? 0.25 : 1 }}/>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 mt-1.5">
        <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
          {unlimited ? 'Sem limite' : `${pct}% usado`}
        </span>
        {!unlimited && remaining !== null && (<span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500 truncate">
          {remaining.toLocaleString('pt-BR')} mensagens restantes
        </span>)}
      </div>

      {extraUsed > 0 && (<p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-1 truncate">
        +{extraUsed.toLocaleString('pt-BR')} excedentes
      </p>)}
    </div>)}
  </Card>);
}
