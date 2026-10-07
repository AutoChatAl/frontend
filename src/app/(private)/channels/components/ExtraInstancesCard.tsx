'use client';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import Card from '@/components/Card';
import { EXTRA_INSTANCE_PRICE_CENTS, formatBRLFromCents } from '@/utils/billing';

interface ExtraInstancesCardProps {
    /** `subscription.extraInstances` — canais avulsos somados ao limite do plano. */
    quantity: number;
}

/** Mesma anatomia dos stat cards vizinhos: título, valor ancorado embaixo, hint. */
export default function ExtraInstancesCard({ quantity }: ExtraInstancesCardProps) {
  const monthlyCents = quantity * EXTRA_INSTANCE_PRICE_CENTS;

  return (<Card className="p-3 sm:p-3.5 min-w-0 h-full flex flex-col">
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">Conexões extras</p>
      <Link href="/settings?tab=billing" title="Contratar conexões extras" aria-label="Contratar conexões extras" className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
        <Plus size={13}/>
      </Link>
    </div>

    <div className="mt-auto pt-2">
      <div className="flex items-baseline justify-between gap-2 min-w-0">
        <span className="text-xl sm:text-2xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">
          {quantity.toLocaleString('pt-BR')}
        </span>
        <span className={`text-[13px] font-semibold tabular-nums shrink-0 ${monthlyCents > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
          {formatBRLFromCents(monthlyCents)}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 truncate">
        {formatBRLFromCents(EXTRA_INSTANCE_PRICE_CENTS)}/mês cada
      </p>
    </div>
  </Card>);
}
