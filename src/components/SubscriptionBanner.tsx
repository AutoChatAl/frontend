'use client';
import { usePathname, useRouter } from 'next/navigation';

import { ACCOUNT_OWNER_PLAN_MESSAGE, canManageWorkspace } from '@/contexts/SidebarContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuthUser } from '@/hooks/useAuthUser';

import Button from './Button';

export default function SubscriptionBanner() {
  const { isInactive, isCanceled, isTrialing, isTrialExpired, loading } = useSubscription();
  const canManage = canManageWorkspace(useAuthUser());
  const router = useRouter();
  const pathname = usePathname();
  if (loading || !isInactive || isTrialing || isTrialExpired)
    return null;
  if (pathname?.startsWith('/plans') || pathname?.startsWith('/settings'))
    return null;
  const title = isCanceled
    ? 'Sua assinatura foi cancelada'
    : 'Sua assinatura está inativa';
  const description = isCanceled
    ? 'O acesso aos recursos pagos foi encerrado. Reative para criar instâncias, campanhas, canais e disparar mensagens.'
    : 'Regularize sua assinatura para voltar a usar todos os recursos do seu plano.';
  return (<div className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center dark:border-red-500/20 dark:bg-red-500/10">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
    </div>
    {canManage ? (<Button size="sm" className="shrink-0 self-start sm:self-auto" onClick={() => router.push('/plans')}>
      Reativar assinatura
    </Button>) : (<p className="shrink-0 self-start text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:max-w-xs sm:self-auto">
      {ACCOUNT_OWNER_PLAN_MESSAGE}
    </p>)}
  </div>);
}
