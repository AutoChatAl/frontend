'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

import Button from '@/components/Button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { subscriptionService } from '@/services/subscription.service';

export default function PlansSuccessPage() {
  const router = useRouter();
  const { refresh } = useSubscription();

  useEffect(() => {
    subscriptionService.clearCache();
    refresh();
    const timer = setTimeout(() => router.push('/dashboard'), 5000);
    return () => clearTimeout(timer);
  }, [refresh, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
        <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Assinatura ativada!</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Seu plano foi ativado com sucesso. Aproveite todos os recursos!</p>
      <Button onClick={() => router.push('/dashboard')}>Ir para o Dashboard</Button>
    </div>
  );
}
