'use client';
import { Clock } from 'lucide-react';

import Badge from '@/components/Badge';
import type { CampaignRun } from '@/types/Campaign';

import { formatCount, formatRunDate, summarizeRun } from './runSummary';

interface RunProgressBarProps {
    sent: number;
    failed: number;
    skipped: number;
    total: number;
    className?: string;
}

/** Barra em três cores: enviadas, falhas e ignoradas. O que falta fica vazio. */
export function RunProgressBar({ sent, failed, skipped, total, className = '' }: RunProgressBarProps) {
  const pct = (value: number) => (total > 0 ? `${(value / total) * 100}%` : '0%');
  return (<div className={`h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex ${className}`} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={sent + failed + skipped}>
    <div className="h-full bg-emerald-500 transition-all" style={{ width: pct(sent) }}/>
    <div className="h-full bg-red-400 transition-all" style={{ width: pct(failed) }}/>
    <div className="h-full bg-amber-400 transition-all" style={{ width: pct(skipped) }}/>
  </div>);
}

interface RunProgressProps {
    run: CampaignRun;
    /** Abre o histórico de execuções. Sem ele, o bloco é só leitura. */
    onClick?: () => void;
}

/**
 * Resumo da execução para a lista de campanhas: estado, data, barra e os
 * contadores "X/Y enviadas · falhas · na fila".
 */
export default function RunProgress({ run, onClick }: RunProgressProps) {
  const summary = summarizeRun(run);
  const { stats } = summary;
  const parts: string[] = [];
  if (stats.failed > 0)
    parts.push(`${formatCount(stats.failed)} falha${stats.failed !== 1 ? 's' : ''}`);
  if (stats.skipped > 0)
    parts.push(`${formatCount(stats.skipped)} ignorada${stats.skipped !== 1 ? 's' : ''}`);
  if (stats.pending + stats.sending > 0)
    parts.push(`${formatCount(stats.pending + stats.sending)} na fila`);
  const content = (<div className="min-w-44 space-y-1.5">
    <div className="flex items-center gap-2 flex-wrap">
      <Badge type={summary.badgeType} text={summary.label} pill/>
      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <Clock size={11} className="text-slate-400"/>
        {formatRunDate(summary.date)}
      </span>
    </div>
    {stats.total > 0 && (<>
      <RunProgressBar sent={stats.sent} failed={stats.failed} skipped={stats.skipped} total={stats.total}/>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        <span className="font-medium text-slate-800 dark:text-slate-200">{formatCount(stats.sent)}/{formatCount(stats.total)}</span> enviadas
        {parts.length > 0 && ` · ${parts.join(' · ')}`}
      </p>
    </>)}
  </div>);
  if (!onClick)
    return content;
  return (<button type="button" onClick={onClick} title="Ver execuções" className="text-left rounded-lg -m-1 p-1 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
    {content}
  </button>);
}
