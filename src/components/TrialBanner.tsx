'use client';
import { Clock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useSubscription } from '@/contexts/SubscriptionContext';

import Button from './Button';

export default function TrialBanner() {
  const { isTrialing, trialDaysRemaining, trialEnd } = useSubscription();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined')
      return false;
    return sessionStorage.getItem('trial_banner_dismissed') === 'true';
  });
  const router = useRouter();
  if (!isTrialing || dismissed)
    return null;
  const isUrgent = trialDaysRemaining <= 3;
  const isCritical = trialDaysRemaining <= 1;
  // A urgência muda só o realce (ícone e contagem), não a superfície: o aviso continua
  // sendo um card do sistema, sem virar um bloco colorido.
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
  return (<div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
    <div className="flex min-w-0 items-center gap-3">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        <Clock size={16}/>
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
          Período de teste — restam <span className={`font-semibold ${countdownColor}`}>{restante}</span>
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
          setDismissed(true);
          sessionStorage.setItem('trial_banner_dismissed', 'true');
        }}
        aria-label="Dispensar aviso"
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
      >
        <X size={16}/>
      </button>
    </div>
  </div>);
}
