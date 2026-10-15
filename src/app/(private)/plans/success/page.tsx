'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import Button from '@/components/Button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { subscriptionService } from '@/services/subscription.service';

export default function PlansSuccessPage() {
  const router = useRouter();
  const { refreshAfterPurchase } = useSubscription();
  useEffect(() => {
    subscriptionService.clearCache();
    refreshAfterPurchase({ expectActive: true, tries: 8 });
    const timer = setTimeout(() => router.push('/dashboard'), 5000);
    return () => clearTimeout(timer);
  }, [refreshAfterPurchase, router]);
  return (<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Assinatura ativada!</h1>
    <p className="text-slate-500 dark:text-slate-400 mb-6">Seu plano foi ativado com sucesso. Aproveite todos os recursos!</p>
    <Button onClick={() => router.push('/dashboard')}>Ir para o Dashboard</Button>
  </div>);
}
