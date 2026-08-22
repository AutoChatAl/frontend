'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import Badge from '@/components/Badge';
import Card from '@/components/Card';
import { campaignService } from '@/services/campaign.service';
import type { Campaign } from '@/types/Campaign';

interface TodayRow {
    key: string;
    name: string;
    whenLabel: string;
    running: boolean;
    timeMs: number;
    /** Criação da campanha — o card exibe só o disparo da campanha mais recente. */
    createdAtMs: number;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** Converte "HH:mm" num Date de hoje nesse horário. */
function todayAt(timeOfDay: string): Date | null {
  const [hoursRaw, minutesRaw] = timeOfDay.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw ?? 0);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes))
    return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Disparos de HOJE que ainda não aconteceram: runs em execução, runs
 * pendentes de hoje e recorrências diárias cujo horário ainda está à frente.
 * Campanhas já disparadas (runs concluídos / horário passado) ficam de fora.
 */
function buildTodayRows(campaigns: Campaign[]): TodayRow[] {
  const now = new Date();
  const rows: TodayRow[] = [];
  for (const campaign of campaigns) {
    const runs = campaign.runs ?? [];
    const createdAtMs = new Date(campaign.createdAt).getTime() || 0;
    if (runs.some((r) => r.status === 'RUNNING')) {
      rows.push({ key: `${campaign.id}-running`, name: campaign.name, whenLabel: 'Disparando agora', running: true, timeMs: 0, createdAtMs });
      continue;
    }
    // Todos os disparos pendentes de hoje — a mesma campanha pode aparecer mais de uma vez.
    const pendingToday = runs
      .filter((r) => r.status === 'PENDING')
      .map((r) => ({ run: r, date: new Date(r.scheduledFor) }))
      .filter(({ date }) => isSameDay(date, now) && date.getTime() >= now.getTime())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    if (pendingToday.length > 0) {
      for (const { run, date } of pendingToday) {
        rows.push({
          key: run.id || `${campaign.id}-${date.getTime()}`,
          name: campaign.name,
          whenLabel: `às ${formatTime(date)}`,
          running: false,
          timeMs: date.getTime(),
          createdAtMs,
        });
      }
      continue;
    }
    let dispatchAt: Date | null = null;
    if (campaign.status === 'ACTIVE' && campaign.schedule) {
      if (campaign.schedule.nextRunAt) {
        // Fonte oficial: próximo disparo calculado pelo backend (vale para todas as frequências).
        const candidate = new Date(campaign.schedule.nextRunAt);
        if (isSameDay(candidate, now) && candidate.getTime() >= now.getTime()) {
          dispatchAt = candidate;
        }
      }
      else {
        const frequency = campaign.schedule.frequency ?? campaign.schedule.kind;
        if (frequency === 'DAILY' && campaign.schedule.timeOfDay) {
          const candidate = todayAt(campaign.schedule.timeOfDay);
          const startsOk = !campaign.schedule.startAt || new Date(campaign.schedule.startAt).getTime() <= (candidate?.getTime() ?? 0);
          const endsOk = !campaign.schedule.endAt || new Date(campaign.schedule.endAt).getTime() >= (candidate?.getTime() ?? 0);
          if (candidate && candidate.getTime() >= now.getTime() && startsOk && endsOk) {
            dispatchAt = candidate;
          }
        }
        else if (frequency === 'ONCE') {
          const onceAt = campaign.schedule.onceAt ?? campaign.schedule.startAt;
          if (onceAt) {
            const candidate = new Date(onceAt);
            if (isSameDay(candidate, now) && candidate.getTime() >= now.getTime()) {
              dispatchAt = candidate;
            }
          }
        }
      }
    }
    if (dispatchAt) {
      rows.push({
        key: `${campaign.id}-schedule`,
        name: campaign.name,
        whenLabel: `às ${formatTime(dispatchAt)}`,
        running: false,
        timeMs: dispatchAt.getTime(),
        createdAtMs,
      });
    }
  }
  // Dedup: o mesmo disparo pode chegar por duas fontes (run pendente e
  // nextRunAt do schedule) — nome + horário iguais contam uma vez só.
  const seen = new Set<string>();
  const deduped = rows.filter((row) => {
    const dedupeKey = `${row.name}|${row.timeMs}`;
    if (seen.has(dedupeKey))
      return false;
    seen.add(dedupeKey);
    return true;
  });
  return deduped.sort((a, b) => a.timeMs - b.timeMs);
}

/** Disparos de campanhas previstos para hoje, ordenados pelo horário. */
export default function UpcomingCampaignsCard() {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    campaignService.listCampaigns()
      .then((data) => {
        if (mounted)
          setCampaigns(data);
      })
      .catch(() => {
        if (mounted)
          setCampaigns([]);
      })
      .finally(() => {
        if (mounted)
          setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const rows = campaigns ? buildTodayRows(campaigns) : [];
  // Exibe só um disparo: o da campanha criada mais recentemente (o mais
  // próximo, se ela disparar mais de uma vez hoje).
  const [firstRow] = rows;
  let visible: TodayRow[] = [];
  if (firstRow) {
    const latest = rows.reduce((best, row) => (row.createdAtMs > best.createdAtMs ? row : best), firstRow);
    const [nextOfLatest] = rows
      .filter((row) => row.createdAtMs === latest.createdAtMs)
      .sort((a, b) => a.timeMs - b.timeMs);
    visible = nextOfLatest ? [nextOfLatest] : [];
  }
  const extraCount = rows.length - visible.length;
  const subtitle = rows.length === 0
    ? 'Disparos previstos para hoje'
    : `${rows.length.toLocaleString('pt-BR')} disparo${rows.length > 1 ? 's' : ''} para hoje`;

  return (<Card className="p-4 sm:p-5 h-full flex flex-col">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Campanhas</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{subtitle}</p>
      </div>
      <Link href="/campaigns" className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
          Ver todas
      </Link>
    </div>

    {loading ? (<div className="flex-1 flex flex-col justify-center animate-pulse" aria-hidden>
      <div className="h-9 w-full rounded-md bg-slate-100 dark:bg-slate-700/60"/>
    </div>) : visible.length === 0 ? (<div className="flex-1 flex flex-col items-center justify-center gap-0.5 text-center">
      <p className="text-[13px] text-slate-600 dark:text-slate-400">Nenhum disparo para hoje.</p>
      <Link href="/campaigns" className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
          Criar uma campanha
      </Link>
    </div>) : (<div className="flex-1 flex flex-col justify-center">
      {visible.map((row) => (<div key={row.key} className="flex items-center justify-between gap-3 py-2 border-b last:border-0 border-slate-100 dark:border-slate-700/60 min-w-0">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">{row.name}</p>
          <p className={`text-[11px] mt-0.5 truncate ${row.running ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
            {row.whenLabel}
          </p>
        </div>
        <Badge type={row.running ? 'processing' : 'neutral'} text={row.running ? 'Disparando' : 'Agendada'} pill/>
      </div>))}
      {extraCount > 0 && (<Link href="/campaigns" className="mt-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-center">
        + {extraCount.toLocaleString('pt-BR')} disparo{extraCount > 1 ? 's' : ''} ainda hoje
      </Link>)}
    </div>)}
  </Card>);
}
