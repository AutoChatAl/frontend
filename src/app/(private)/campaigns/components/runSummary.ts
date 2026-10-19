import type { CampaignRun, CampaignRunStats } from '@/types/Campaign';

export type RunPhase = 'running' | 'completed' | 'failed' | 'empty';

export interface RunProgressSummary {
  phase: RunPhase;
  label: string;
  badgeType: 'processing' | 'success' | 'error' | 'neutral';
  stats: CampaignRunStats;
  /** Envios já resolvidos (enviados, falhas e ignorados). */
  done: number;
  percent: number;
  /** Data que a tela mostra: quando começou ou, se ainda não começou, quando estava marcado. */
  date: string;
}

const EMPTY_STATS: CampaignRunStats = { total: 0, pending: 0, sending: 0, sent: 0, failed: 0, skipped: 0 };

/** Ainda há envio na fila: a lista e o modal continuam se atualizando. */
export function isRunInProgress(run: CampaignRun): boolean {
  const stats = run.stats ?? EMPTY_STATS;
  if (stats.total === 0)
    return run.status === 'PENDING' || run.status === 'RUNNING';
  return stats.pending + stats.sending > 0;
}

export function summarizeRun(run: CampaignRun): RunProgressSummary {
  const stats = run.stats ?? EMPTY_STATS;
  const done = stats.sent + stats.failed + stats.skipped;
  const percent = stats.total > 0 ? Math.round((done / stats.total) * 100) : 0;
  const date = run.startedAt ?? run.scheduledFor;
  if (stats.total === 0) {
    return run.status === 'PENDING' || run.status === 'RUNNING'
      ? { phase: 'running', label: 'Preparando', badgeType: 'processing', stats, done, percent, date }
      : { phase: 'empty', label: 'Nenhum envio gerado', badgeType: 'neutral', stats, done, percent, date };
  }
  if (stats.pending + stats.sending > 0)
    return { phase: 'running', label: 'Em andamento', badgeType: 'processing', stats, done, percent, date };
  if (stats.sent === 0)
    return { phase: 'failed', label: 'Falhou', badgeType: 'error', stats, done, percent, date };
  return { phase: 'completed', label: 'Concluído', badgeType: 'success', stats, done, percent, date };
}

/** Execução mais recente da campanha — a que a lista mostra. */
export function latestRun(runs: CampaignRun[] | undefined): CampaignRun | null {
  if (!runs || runs.length === 0)
    return null;
  const sorted = [...runs].sort((a, b) => {
    const dateA = a.startedAt ?? a.scheduledFor;
    const dateB = b.startedAt ?? b.scheduledFor;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
  return sorted[0] ?? null;
}

export function formatRunDate(dateStr?: string | null): string {
  if (!dateStr)
    return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCount(value: number): string {
  return value.toLocaleString('pt-BR');
}
