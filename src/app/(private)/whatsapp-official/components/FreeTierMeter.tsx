'use client';
import Skeleton from '@/components/Skeleton';
import type { WaFreeTierUsage } from '@/types/WhatsAppOfficial';

/** A partir daqui a barra avisa que a cota está acabando. */
const NEAR_LIMIT_RATIO = 0.8;

interface FreeTierMeterProps {
    /** Nulo enquanto carrega. */
    usage: WaFreeTierUsage | null;
    /** A consulta falhou: mostra o aviso no lugar da barra. */
    failed?: boolean;
    className?: string;
}

/** Data no fuso da conta na Meta — é nele que a cota vira o mês. */
function formatInAccountZone(iso: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { ...options, timeZone });
  } catch {
    return new Date(iso).toLocaleDateString('pt-BR', options);
  }
}

/**
 * Quanto da cota grátis de atendimento do mês (1.000 por número, regra da Meta desde
 * 01/10/2026) o número já usou. Fica na linha do número porque a cota é de cada número.
 */
export default function FreeTierMeter({ usage, failed = false, className = '' }: FreeTierMeterProps) {
  if (failed) {
    return (<p className={`text-[11px] text-slate-400 dark:text-slate-500 ${className}`}>
      Não foi possível consultar a cota grátis deste número agora.
    </p>);
  }
  if (!usage) {
    return (<div className={`space-y-1.5 ${className}`} aria-busy="true" aria-label="Carregando cota grátis">
      <Skeleton className="h-3 w-44"/>
      <Skeleton className="h-1.5 w-full"/>
    </div>);
  }

  const ratio = usage.limit > 0 ? Math.min(usage.used / usage.limit, 1) : 0;
  const exhausted = usage.used >= usage.limit;
  const fill = exhausted
    ? 'bg-red-500 dark:bg-red-400'
    : ratio >= NEAR_LIMIT_RATIO ? 'bg-amber-500 dark:bg-amber-400' : 'bg-indigo-500 dark:bg-indigo-400';
  const month = formatInAccountZone(usage.periodStart, usage.timeZone, { month: 'long' });
  const resetDay = formatInAccountZone(usage.resetsAt, usage.timeZone, { day: '2-digit', month: '2-digit' });
  const remaining = Math.max(usage.limit - usage.used, 0);
  const status = exhausted
    ? `Cota esgotada${usage.billedAfterLimit > 0 ? ` · ${usage.billedAfterLimit.toLocaleString('pt-BR')} cobradas além dela` : ''}`
    : `Restam ${remaining.toLocaleString('pt-BR')}`;

  return (<div
    className={`space-y-1.5 ${className}`}
    title={usage.source === 'meta'
      ? 'Dado da própria Meta. As mensagens de hoje podem levar algumas horas para aparecer aqui.'
      : 'A Meta não respondeu agora: a contagem é do Synq e só inclui o que saiu por aqui.'}
  >
    <div className="flex items-baseline justify-between gap-3">
      <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Atendimento grátis em {month}</p>
      <p className="shrink-0 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-900 dark:text-white">{usage.used.toLocaleString('pt-BR')}</span>
        {' '}de {usage.limit.toLocaleString('pt-BR')}
      </p>
    </div>
    <div
      role="progressbar"
      aria-label={`Cota grátis de atendimento em ${month}`}
      aria-valuemin={0}
      aria-valuemax={usage.limit}
      aria-valuenow={Math.min(usage.used, usage.limit)}
      className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
    >
      <div className={`h-full rounded-full transition-all ${fill}`} style={{ width: `${ratio * 100}%` }}/>
    </div>
    <p className={`text-[11px] ${exhausted ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
      {status} · zera em {resetDay}
      {usage.source === 'synq' && ' · contado pelo Synq (a Meta não respondeu)'}
    </p>
  </div>);
}
