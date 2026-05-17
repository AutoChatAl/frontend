'use client';

import { Clock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useSubscription } from '@/contexts/SubscriptionContext';

export default function TrialBanner() {
  const { isTrialing, trialDaysRemaining, trialEnd } = useSubscription();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('trial_banner_dismissed') === 'true';
  });
  const router = useRouter();

  if (!isTrialing || dismissed) return null;

  const isUrgent = trialDaysRemaining <= 3;
  const isCritical = trialDaysRemaining <= 1;

  const bgClass = isCritical
    ? 'from-red-500 to-rose-600'
    : isUrgent
      ? 'from-amber-500 to-orange-500'
      : 'from-indigo-500 to-violet-600';

  return (
    <div className={`bg-linear-to-r ${bgClass} text-white rounded-xl p-3 mb-4 flex items-center justify-between gap-3`}>
      <div className="flex items-center gap-2 min-w-0">
        <Clock size={16} className="shrink-0" />
        <span className="text-sm font-medium truncate">
          Seu período de teste termina em{' '}
          {trialEnd
            ? new Date(trialEnd).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : `${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'dia' : 'dias'}`}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => router.push('/plans')}
          className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          Escolher Plano
        </button>
        <button
          onClick={() => {
            setDismissed(true);
            sessionStorage.setItem('trial_banner_dismissed', 'true');
          }}
          className="text-white/70 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
