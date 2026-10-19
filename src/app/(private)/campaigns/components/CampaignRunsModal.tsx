'use client';
import { AlertTriangle, Clock, Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { campaignService } from '@/services/campaign.service';
import type { Campaign, CampaignRunDetail, CampaignRunIssue } from '@/types/Campaign';

import { describeDispatchError } from './dispatchErrors';
import { RunProgressBar } from './RunProgress';
import { formatCount, formatRunDate, isRunInProgress, summarizeRun } from './runSummary';

/** Enquanto houver envio na fila, o histórico se atualiza sozinho neste intervalo. */
const REFRESH_MS = 10000;

interface CampaignRunsModalProps {
    isOpen: boolean;
    campaign: Campaign | null;
    onClose: () => void;
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: 'sent' | 'failed' | 'skipped' | 'pending' }) {
  const tones = {
    sent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    failed: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    skipped: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    pending: 'bg-slate-50 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300',
  };
  return (<div className={`rounded-xl p-3 text-center ${tones[tone]}`}>
    <p className="text-lg font-bold leading-tight">{formatCount(value)}</p>
    <p className="text-[11px] font-medium uppercase tracking-wider opacity-80 mt-0.5">{label}</p>
  </div>);
}

function IssueList({ issues }: { issues: CampaignRunIssue[] }) {
  if (issues.length === 0)
    return null;
  return (<div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-900/10 p-3 space-y-1.5">
    <p className="text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
      <AlertTriangle size={13}/>
      Motivos
    </p>
    <ul className="space-y-1">
      {issues.map((issue) => (<li key={`${issue.status}-${issue.error}`} className="flex items-start justify-between gap-3 text-xs text-slate-700 dark:text-slate-300">
        <span className="min-w-0 break-words">
          <span className={`font-medium ${issue.status === 'FAILED' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {issue.status === 'FAILED' ? 'Falha' : 'Ignorada'}:
          </span>{' '}
          {describeDispatchError(issue.error || 'Sem motivo registrado.')}
        </span>
        <span className="shrink-0 font-semibold tabular-nums">{formatCount(issue.count)}</span>
      </li>))}
    </ul>
  </div>);
}

function RunCard({ run }: { run: CampaignRunDetail }) {
  const summary = summarizeRun(run);
  const { stats } = summary;
  return (<div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 space-y-3">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <Clock size={14} className="text-slate-400"/>
        <span>{formatRunDate(summary.date)}</span>
        {run.finishedAt && summary.phase !== 'running' && (<span className="text-xs text-slate-400 dark:text-slate-500">· terminou {formatRunDate(run.finishedAt)}</span>)}
      </div>
      <div className="flex items-center gap-2">
        {summary.phase === 'running' && <Loader2 size={14} className="animate-spin text-indigo-500"/>}
        <Badge type={summary.badgeType} text={summary.label} pill/>
      </div>
    </div>

    {stats.total === 0 ? (<p className="text-xs text-slate-500 dark:text-slate-400">
      {summary.phase === 'running'
        ? 'Os envios ainda estão sendo preparados.'
        : 'Nenhum envio foi gerado nesta execução: os destinatários não tinham telefone ou identidade no canal.'}
    </p>) : (<>
      <div className="space-y-1.5">
        <RunProgressBar sent={stats.sent} failed={stats.failed} skipped={stats.skipped} total={stats.total} className="h-2"/>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatCount(summary.done)} de {formatCount(stats.total)} envios processados ({summary.percent}%)
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatTile label="Enviadas" value={stats.sent} tone="sent"/>
        <StatTile label="Falhas" value={stats.failed} tone="failed"/>
        <StatTile label="Ignoradas" value={stats.skipped} tone="skipped"/>
        <StatTile label="Na fila" value={stats.pending + stats.sending} tone="pending"/>
      </div>
      <IssueList issues={run.issues}/>
    </>)}
  </div>);
}

/**
 * Histórico de execuções da campanha: progresso de cada disparo e os motivos das
 * falhas agrupados. Fica se atualizando enquanto houver envio na fila.
 */
export default function CampaignRunsModal({ isOpen, campaign, onClose }: CampaignRunsModalProps) {
  const [runs, setRuns] = useState<CampaignRunDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const campaignId = campaign?.id ?? null;
  const requestIdRef = useRef(0);

  const load = useCallback(async (silent: boolean) => {
    if (!campaignId)
      return;
    const requestId = ++requestIdRef.current;
    if (silent)
      setRefreshing(true);
    else
      setLoading(true);
    try {
      const data = await campaignService.listRuns(campaignId);
      if (requestId !== requestIdRef.current)
        return;
      setRuns(data);
      setUpdatedAt(new Date());
      setError('');
    }
    catch (err) {
      if (requestId !== requestIdRef.current)
        return;
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as execuções.');
    }
    finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [campaignId]);

  useEffect(() => {
    if (!isOpen || !campaignId) {
      setRuns([]);
      setError('');
      setUpdatedAt(null);
      return;
    }
    void load(false);
  }, [isOpen, campaignId, load]);

  const inProgress = runs.some(isRunInProgress);
  useEffect(() => {
    if (!isOpen || !inProgress)
      return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible')
        void load(true);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [isOpen, inProgress, load]);

  if (!campaign)
    return null;
  return (<Modal isOpen={isOpen} onClose={onClose} title={`Execuções · ${campaign.name}`} size="lg">
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {inProgress
            ? 'Há envios na fila: este histórico se atualiza sozinho a cada 10 segundos.'
            : updatedAt
              ? `Atualizado às ${updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`
              : ''}
        </p>
        <button type="button" onClick={() => { void load(true); }} disabled={loading || refreshing} className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50">
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''}/>
          Atualizar
        </button>
      </div>

      {loading ? (<div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="animate-spin text-indigo-500" size={26}/>
        <p className="text-sm text-slate-500 dark:text-slate-400">Carregando execuções...</p>
      </div>) : error ? (<div className="py-8 text-center space-y-3">
        <p className="text-sm text-red-500">{error}</p>
        <button type="button" onClick={() => { void load(false); }} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          Tentar novamente
        </button>
      </div>) : runs.length === 0 ? (<div className="py-12 text-center">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Nenhuma execução ainda</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Dispare a campanha para acompanhar o progresso aqui.</p>
      </div>) : (<div className="space-y-3">
        {runs.map((run) => <RunCard key={run.id} run={run}/>)}
      </div>)}

      <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95">
          Fechar
        </button>
      </div>
    </div>
  </Modal>);
}
