'use client';
import Card from '@/components/Card';

interface Props {
    sent: number;
    received: number;
    read: number;
    /** Dias cobertos pelo período, para a média diária. */
    days: number;
}

interface StatDef {
    label: string;
    value: number;
    hint: string;
    /** Posição do bloco dentro da coluna. */
    justify: string;
    /** Alinhamento do texto dentro do bloco. */
    textAlign: string;
}

/**
 * Resumo textual de mensagens (sem gráfico): enviadas, recebidas e lidas
 * lado a lado, com uma linha de contexto sob cada número.
 */
export default function MessagesSummaryCard({ sent, received, read, days }: Props) {
  const readRate = sent > 0 ? Math.round((read / sent) * 100) : null;
  const perDay = Math.max(days, 1);
  const stats: StatDef[] = [
    { label: 'Enviadas', value: sent, hint: `média de ${Math.round(sent / perDay).toLocaleString('pt-BR')}/dia`, justify: 'justify-start', textAlign: 'text-left' },
    { label: 'Recebidas', value: received, hint: `média de ${Math.round(received / perDay).toLocaleString('pt-BR')}/dia`, justify: 'justify-center', textAlign: 'text-center' },
    { label: 'Lidas', value: read, hint: readRate === null ? 'sem envios no período' : `${Math.min(readRate, 100)}% das enviadas`, justify: 'justify-end', textAlign: 'text-left' },
  ];

  return (<Card className="p-4 sm:p-5 h-full flex flex-col">
    <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Mensagens</h2>

    <div className="flex-1 grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700/60 items-center">
      {stats.map((stat) => (<div key={stat.label} className={`px-3 first:pl-0 last:pr-0 min-w-0 flex ${stat.justify}`}>
        <div className={`min-w-0 ${stat.textAlign}`}>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{stat.label}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white truncate">
            {stat.value.toLocaleString('pt-BR')}
          </p>
          <p className="mt-0.5 text-[11px] tabular-nums text-slate-400 dark:text-slate-500 truncate">{stat.hint}</p>
        </div>
      </div>))}
    </div>
  </Card>);
}
