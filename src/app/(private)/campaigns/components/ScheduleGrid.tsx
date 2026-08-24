'use client';
import { AlertCircle, CalendarClock, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Card from '@/components/Card';
import { campaignService } from '@/services/campaign.service';
import type { ScheduleGrid as ScheduleGridData } from '@/types/Campaign';

/**
 * Rampa sequencial de um hue só (indigo), clara→escura no modo claro e
 * escura→clara no escuro, porque o ponto de ancoragem é a superfície do card.
 * Os passos foram escolhidos rodando o validador da skill de dataviz: os quatro
 * passam em monotonia de luminosidade, distância entre passos adjacentes e
 * contraste do extremo claro contra a superfície, nos dois modos.
 */
const HEAT_STEPS = [
  'bg-indigo-400 text-slate-900 dark:bg-indigo-700 dark:text-white',
  'bg-indigo-500 text-white dark:bg-indigo-500 dark:text-white',
  'bg-indigo-600 text-white dark:bg-indigo-400 dark:text-slate-900',
  'bg-indigo-800 text-white dark:bg-indigo-300 dark:text-slate-900',
];

const EMPTY_CELL = 'text-slate-300 dark:text-slate-600';

/**
 * Com pouca campanha (o caso comum) a contagem vira o próprio passo, então 1 é
 * o tom mais claro e 4 o mais escuro. Só acima disso a escala passa a ser
 * relativa ao máximo — senão um funil com só 1 execução pintaria tudo de preto.
 */
function heatIndex(count: number, max: number): number {
  if (count <= 0) return -1;
  if (max <= HEAT_STEPS.length) return Math.min(count, HEAT_STEPS.length) - 1;
  return Math.min(HEAT_STEPS.length - 1, Math.ceil((count / max) * HEAT_STEPS.length) - 1);
}

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}h`;
}

function plural(count: number): string {
  return count === 1 ? 'execução' : 'execuções';
}

interface ScheduleGridProps {
  /** Muda quando a lista de campanhas muda, para a agenda recarregar junto. */
  refreshKey?: number;
}

export default function ScheduleGrid({ refreshKey = 0 }: ScheduleGridProps) {
  const [grid, setGrid] = useState<ScheduleGridData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setGrid(await campaignService.getScheduleGrid());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar a agenda.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const max = useMemo(() => {
    if (!grid) return 0;
    return grid.days.reduce(
      (highest, day) => day.cells.reduce((rowMax, cell) => Math.max(rowMax, cell.count), highest),
      0,
    );
  }, [grid]);

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-4">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <CalendarClock size={15} className="text-slate-400" />
          Agenda de execuções
        </h2>
        <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
          Hoje e os próximos 4 dias, por hora de disparo
        </p>
      </div>
      {grid && max > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {max <= HEAT_STEPS.length ? '1' : 'menos'}
          </span>
          {HEAT_STEPS.map((step, index) => (
            <span
              key={step}
              className={`h-3.5 w-3.5 rounded-full ${step.split(' ').filter((cls) => cls.startsWith('bg-') || cls.startsWith('dark:bg-')).join(' ')}`}
              title={max <= HEAT_STEPS.length ? `${index + 1} ${plural(index + 1)}` : undefined}
            />
          ))}
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {max <= HEAT_STEPS.length ? `${HEAT_STEPS.length}+` : `mais (máx. ${max})`}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <Card className="overflow-hidden">
      {header}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-slate-400 dark:text-slate-500">
          <Loader2 size={14} className="animate-spin" />
          Carregando a agenda...
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-rose-500">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {!loading && !error && grid && (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-y border-slate-100 dark:border-slate-700/60">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-white px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  >
                    Dia
                  </th>
                  {grid.hours.map((hour) => (
                    <th
                      scope="col"
                      key={hour}
                      className="px-2 py-2 text-center text-[11px] font-medium tabular-nums text-slate-400 dark:text-slate-500"
                    >
                      {hourLabel(hour)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.days.map((day) => (
                  <tr key={day.date} className="border-b border-slate-100 last:border-0 dark:border-slate-700/60">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-2 text-left font-normal dark:bg-slate-800"
                    >
                      <span className={day.isToday ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}>
                        {day.weekday} {day.label}
                      </span>
                      {day.isToday && (
                        <span className="ml-1.5 text-[11px] text-indigo-600 dark:text-indigo-400">hoje</span>
                      )}
                    </th>
                    {day.cells.map((cell) => {
                      const step = heatIndex(cell.count, max);
                      const title = cell.count === 0
                        ? `Nada ${cell.past ? 'rodou' : 'previsto'} em ${day.weekday} ${day.label} às ${hourLabel(cell.hour)}`
                        : `${cell.count} ${plural(cell.count)} ${cell.past ? 'realizadas' : 'previstas'} · ${day.weekday} ${day.label} às ${hourLabel(cell.hour)}`;
                      return (
                        <td key={cell.hour} className="px-2 py-1 text-center">
                          {/* inline-flex, não flex: dentro de um <td> o block-level
                              esticaria na largura da coluna e o círculo viraria pílula.
                              A centralização vem do text-center da célula.
                              min-width + padding: círculo perfeito com 1 ou 2 dígitos,
                              vira pílula em vez de estourar se a contagem crescer. */}
                          <span
                            title={title}
                            className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-1.5 text-[13px] font-semibold tabular-nums transition-colors ${step >= 0 ? HEAT_STEPS[step] : EMPTY_CELL}`}
                          >
                            {cell.count > 0 ? cell.count : '–'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="px-4 py-3 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
            {grid.total === 0
              ? 'Nenhuma execução agendada para os próximos 5 dias.'
              : 'Horas que já passaram mostram o que realmente rodou; as demais são projeção do agendamento das campanhas ativas.'}
            {' '}Fuso: {grid.timezone.replace('_', ' ')}.
          </p>
        </>
      )}
    </Card>
  );
}
