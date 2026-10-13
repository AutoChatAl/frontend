'use client';

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
  const monthRecovered = summary?.periodRecovered ?? 0;
  const monthRecoveredValue = summary?.periodRecoveredValueCents ?? 0;

  const cards = [
    { label: 'Carrinhos (30 dias)', value: String(total) },
    { label: 'Recuperados (30 dias)', value: String(recovered) },
    { label: 'Taxa de recuperação', value: `${recoveryRate}%` },
    { label: 'Integrações ativas', value: String(integrationsCount) },
  ];

  const totalValue = summary?.totalValueCents ?? 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10 sm:p-5">
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-emerald-700 tabular-nums dark:text-emerald-300 sm:text-3xl">
            {formatBrl(monthRecoveredValue)}
            <span className="ml-2 text-base font-semibold sm:text-lg">recuperados este mês</span>
          </p>
          <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
            {monthRecovered > 0
              ? `${monthRecovered} venda${monthRecovered === 1 ? '' : 's'} que ${monthRecovered === 1 ? 'estava perdida voltou' : 'estavam perdidas voltaram'} com as mensagens automáticas.`
              : 'Quando alguém comprar depois de receber suas mensagens, o valor aparece aqui.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {card.label}
            </p>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {totalValue > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Recuperado nos últimos 30 dias: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatBrl(summary?.recoveredValueCents ?? 0)}</span>
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
