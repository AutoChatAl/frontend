'use client';

import { ShoppingCart, TrendingUp, CheckCircle2, Plug } from 'lucide-react';
import type { AbandonedCartsSummary } from '@/types/CartRecovery';

interface Props {
  summary: AbandonedCartsSummary | null;
  integrationsCount: number;
}

function formatBrl(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function SummaryCards({ summary, integrationsCount }: Props) {
  const total = summary?.total ?? 0;
  const recovered = summary?.recovered ?? 0;
  const recoveryRate = total > 0 ? Math.round((recovered / total) * 100) : 0;

  const cards = [
    {
      label: 'Carrinhos (30d)',
      value: String(total),
      icon: ShoppingCart,
      tone: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300',
    },
    {
      label: 'Recuperados (30d)',
      value: String(recovered),
      icon: CheckCircle2,
      tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    {
      label: 'Taxa de recuperação',
      value: `${recoveryRate}%`,
      icon: TrendingUp,
      tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300',
    },
    {
      label: 'Integrações ativas',
      value: String(integrationsCount),
      icon: Plug,
      tone: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300',
    },
  ];

  const recoveredValue = summary?.recoveredValueCents ?? 0;
  const totalValue = summary?.totalValueCents ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.tone}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {totalValue > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Valor recuperado: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatBrl(recoveredValue)}</span>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total em carrinhos: <span className="font-medium">{formatBrl(totalValue)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
