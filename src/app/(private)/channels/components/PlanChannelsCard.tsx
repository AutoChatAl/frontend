'use client';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

import Card from '@/components/Card';

interface PlanChannelsCardProps {
    planName: string;
    /** `maxTotalInstances` do plano — a cota é uma só, compartilhada entre os tipos. */
    limit: number;
    counts: {
        whatsapp: number;
        official: number;
        instagram: number;
    };
}

const TYPE_ROWS: { key: keyof PlanChannelsCardProps['counts']; label: string; dot: string; bar: string }[] = [
  { key: 'whatsapp', label: 'WhatsApp (QR Code)', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  { key: 'official', label: 'WhatsApp Oficial', dot: 'bg-teal-500', bar: 'bg-teal-500' },
  { key: 'instagram', label: 'Instagram', dot: 'bg-fuchsia-500', bar: 'bg-fuchsia-500' },
];

export default function PlanChannelsCard({ planName, limit, counts }: PlanChannelsCardProps) {
  const used = counts.whatsapp + counts.official + counts.instagram;
  const available = Math.max(0, limit - used);
  const overLimit = limit > 0 && used > limit;
  const scale = Math.max(limit, used, 1);

  return (<Card className="p-4 sm:p-5 h-full flex flex-col">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Canais no seu plano</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cota compartilhada entre os tipos</p>
      </div>
      <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
        <Sparkles size={10}/>
        {planName}
      </span>
    </div>

    {limit === 0 ? (<div className="mt-3 flex-1 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 px-4 text-center">
      <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Seu plano atual não inclui canais</p>
      <Link href="/plans" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
          Ver planos
      </Link>
    </div>) : (<>
      <div className="mt-3.5 flex items-baseline gap-1.5">
        <span className="text-xl sm:text-2xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">{used}</span>
        <span className="text-sm font-medium text-slate-400 dark:text-slate-500 tabular-nums">/{limit}</span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-auto">
          {overLimit
            ? `${used - limit} acima do limite`
            : available === 0 ? 'cota esgotada' : `${available} disponíve${available > 1 ? 'is' : 'l'}`}
        </span>
      </div>

      {/* Uma barra só, fatiada por tipo: mostra a divisão real da cota única. */}
      <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60" role="img" aria-label={`${used} de ${limit} canais usados`}>
        {TYPE_ROWS.map((row) => (counts[row.key] > 0 ? (<div key={row.key} className={`h-full ${row.bar}`} style={{ width: `${(counts[row.key] / scale) * 100}%` }}/>) : null))}
      </div>

      <ul className="mt-3 flex-1 divide-y divide-slate-100 dark:divide-slate-700/60">
        {TYPE_ROWS.map((row) => (<li key={row.key} className="flex items-center gap-2.5 py-1.5 first:pt-0 min-w-0">
          <span className={`h-2 w-2 shrink-0 rounded-full ${counts[row.key] > 0 ? row.dot : 'bg-slate-200 dark:bg-slate-600'}`} aria-hidden/>
          <span className="text-[13px] text-slate-600 dark:text-slate-400 truncate flex-1">{row.label}</span>
          <span className="text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white shrink-0">{counts[row.key]}</span>
        </li>))}
        <li className="flex items-center gap-2.5 py-1.5 min-w-0">
          <span className="h-2 w-2 shrink-0 rounded-full border border-dashed border-slate-300 dark:border-slate-600" aria-hidden/>
          <span className="text-[13px] text-slate-400 dark:text-slate-500 truncate flex-1">Livre para qualquer tipo</span>
          <span className={`text-[13px] font-semibold tabular-nums shrink-0 ${available === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {available}
          </span>
        </li>
      </ul>

      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700">
        {available === 0 ? (<Link href="/plans" className="flex items-center justify-between gap-2 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
          <span>Precisa de mais canais? Veja os planos</span>
          <ArrowRight size={12} className="shrink-0"/>
        </Link>) : (<p className="text-[11px] text-slate-400 dark:text-slate-500">
            Qualquer combinação de tipos cabe na cota — não há reserva por canal.
        </p>)}
      </div>
    </>)}
  </Card>);
}
