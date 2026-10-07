'use client';
import { Bot, Clock, MessageCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useSubscription } from '@/contexts/SubscriptionContext';

import Button from './Button';

const COUNTDOWN_DISMISSED_KEY = 'trial_banner_dismissed';
const USAGE_DISMISSED_KEY = 'trial_usage_banner_dismissed';
const USAGE_ALERT_RATIO = 0.8;

interface UsageEntry {
  used: number;
  limit: number;
}

interface UsageAlert {
  kind: 'ai' | 'messages';
  used: number;
  limit: number;
  reachedLimit: boolean;
}

function readFlag(key: string): boolean {
  if (typeof window === 'undefined')
    return false;
  try {
    return sessionStorage.getItem(key) === 'true';
  }
  catch {
    return false;
  }
}

function writeFlag(key: string) {
  try {
    sessionStorage.setItem(key, 'true');
  }
  catch {
    return;
  }
}

function ratioOf(entry: UsageEntry | undefined): number {
  if (!entry || entry.limit <= 0)
    return 0;
  return entry.used / entry.limit;
}

function pickUsageAlert(ai: UsageEntry | undefined, messages: UsageEntry | undefined): UsageAlert | null {
  const aiRatio = ratioOf(ai);
  const messagesRatio = ratioOf(messages);
  if (ai && aiRatio >= USAGE_ALERT_RATIO && aiRatio >= messagesRatio) {
    return { kind: 'ai', used: ai.used, limit: ai.limit, reachedLimit: ai.used >= ai.limit };
  }
  if (messages && messagesRatio >= USAGE_ALERT_RATIO) {
    return { kind: 'messages', used: messages.used, limit: messages.limit, reachedLimit: messages.used >= messages.limit };
  }
  return null;
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

function usageCopy(alert: UsageAlert): { title: string; description: string } {
  const used = formatNumber(Math.min(alert.used, alert.limit));
  const limit = formatNumber(alert.limit);
  if (alert.kind === 'ai') {
    return alert.reachedLimit
      ? {
        title: `Sua IA já respondeu ${limit} mensagens no teste e chegou ao limite`,
        description: 'Assine um plano para ela voltar a atender seus clientes agora mesmo.',
      }
      : {
        title: `Sua IA já respondeu ${used} de ${limit} mensagens do teste`,
        description: 'Ela está trabalhando por você. Assine para continuar atendendo sem parar.',
      };
  }
  return alert.reachedLimit
    ? {
      title: `Você usou todas as ${limit} mensagens do teste`,
      description: 'Assine um plano para suas automações e campanhas voltarem a enviar mensagens.',
    }
    : {
      title: `Você já usou ${used} de ${limit} mensagens do teste`,
      description: 'Suas automações estão funcionando. Assine para não parar quando acabar.',
    };
}

export default function TrialBanner() {
  const { isTrialing, trialDaysRemaining, trialEnd, usage } = useSubscription();
  const [countdownDismissed, setCountdownDismissed] = useState(() => readFlag(COUNTDOWN_DISMISSED_KEY));
  const [usageDismissed, setUsageDismissed] = useState(() => readFlag(USAGE_DISMISSED_KEY));
  const router = useRouter();
  if (!isTrialing)
    return null;

  const usageAlert = pickUsageAlert(usage?.aiMessages, usage?.messages);

  if (usageAlert && (!usageDismissed || usageAlert.reachedLimit)) {
    const { title, description } = usageCopy(usageAlert);
    const Icon = usageAlert.kind === 'ai' ? Bot : MessageCircle;
    const accent = usageAlert.reachedLimit
      ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
      : 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400';
    const percentage = Math.min(100, Math.round((usageAlert.used / usageAlert.limit) * 100));
    const barColor = usageAlert.reachedLimit
      ? 'bg-red-500 dark:bg-red-400'
      : 'bg-amber-500 dark:bg-amber-400';
    return (<div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={16}/>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
          <div
            className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            aria-label="Uso do teste"
          >
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percentage}%` }}/>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
        <Button size="sm" onClick={() => router.push('/plans')}>
          Assinar agora
        </Button>
        {!usageAlert.reachedLimit && (<button
          onClick={() => {
            setUsageDismissed(true);
            writeFlag(USAGE_DISMISSED_KEY);
          }}
          aria-label="Dispensar aviso"
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
        >
          <X size={16}/>
        </button>)}
      </div>
    </div>);
  }

  if (countdownDismissed)
    return null;

  const isUrgent = trialDaysRemaining <= 3;
  const isCritical = trialDaysRemaining <= 1;
  const accent = isCritical
    ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
    : isUrgent
      ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400';
  const countdownColor = isCritical
    ? 'text-red-600 dark:text-red-400'
    : isUrgent
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-slate-900 dark:text-white';
  const restante = trialDaysRemaining <= 0
    ? 'menos de um dia'
    : `${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'dia' : 'dias'}`;
  return (<div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
    <div className="flex min-w-0 items-center gap-3">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        <Clock size={16}/>
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
          Teste grátis: restam <span className={`font-semibold ${countdownColor}`}>{restante}</span>
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {trialEnd
            ? `Termina em ${new Date(trialEnd).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
            : 'Assine um plano para não perder o acesso.'}
        </p>
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-1">
      <Button size="sm" onClick={() => router.push('/plans')}>
        Escolher plano
      </Button>
      <button
        onClick={() => {
          setCountdownDismissed(true);
          writeFlag(COUNTDOWN_DISMISSED_KEY);
        }}
        aria-label="Dispensar aviso"
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
      >
        <X size={16}/>
      </button>
    </div>
  </div>);
}
