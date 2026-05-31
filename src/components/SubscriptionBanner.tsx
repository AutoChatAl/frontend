'use client';
import { AlertTriangle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { useSubscription } from '@/contexts/SubscriptionContext';

export default function SubscriptionBanner() {
  const { isInactive, isCanceled, isTrialing, loading } = useSubscription();
  const router = useRouter();
  const pathname = usePathname();
  if (loading || !isInactive || isTrialing)
    return null;
  if (pathname?.startsWith('/plans') || pathname?.startsWith('/settings'))
    return null;
  const title = isCanceled
    ? 'Sua assinatura foi cancelada'
    : 'Sua assinatura está inativa';
  const description = isCanceled
    ? 'O acesso aos recursos pagos foi encerrado. Reative para criar instâncias, campanhas, canais e disparar mensagens.'
    : 'Regularize sua assinatura para voltar a usar todos os recursos do seu plano.';
  return (<div className="bg-linear-to-r from-red-500 to-rose-600 text-white rounded-xl p-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-start sm:items-center gap-2 min-w-0">
      <AlertTriangle size={16} className="shrink-0 mt-0.5 sm:mt-0"/>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-white/80">{description}</p>
      </div>
    </div>
    <button onClick={() => router.push('/plans')} className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0 self-start sm:self-auto">
        Reativar assinatura
    </button>
  </div>);
}
