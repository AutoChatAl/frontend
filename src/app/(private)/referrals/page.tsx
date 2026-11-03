'use client';
import { useCallback } from 'react';

import Button from '@/components/Button';
import { SkeletonCards, SkeletonPage } from '@/components/Skeleton';
import { ToastContainer, useToast } from '@/components/Toast';

import CreditsCard from './components/CreditsCard';
import HowItWorksCard from './components/HowItWorksCard';
import ReferralList from './components/ReferralList';
import ReferredByCard from './components/ReferredByCard';
import RulesCard from './components/RulesCard';
import ShareCard from './components/ShareCard';
import { useReferralDashboard } from './useReferralDashboard';

/** "Indique e ganhe" — só dono/admin (a rota é bloqueada para colaborador no SidebarContext). */
export default function ReferralsPage() {
  const { dashboard, loading, error, reload } = useReferralDashboard();
  const { toasts, addToast, removeToast } = useToast();
  const handleChanged = useCallback(async (message: string) => {
    addToast('success', message);
    await reload();
  }, [addToast, reload]);

  if (loading) {
    return <SkeletonPage><SkeletonCards count={3}/></SkeletonPage>;
  }
  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-12 text-center dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{error ?? 'Não foi possível carregar suas indicações.'}</p>
        <Button variant="secondary" size="sm" onClick={() => reload()}>Tentar de novo</Button>
      </div>
    );
  }
  const { rules } = dashboard;
  return (
    <div className="w-full max-w-full space-y-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">Indique e ganhe</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Ganhe {rules.referrerPercentOfMonthly}% de desconto por cada negócio que assinar o Synq com o seu link. Quem você indicar ganha {rules.refereePercent}% na primeira fatura.
        </p>
      </div>

      <div className="grid gap-2 sm:gap-3 lg:grid-cols-5">
        <ShareCard
          className="lg:col-span-3"
          code={dashboard.code}
          link={dashboard.link}
          isActive={dashboard.isActive}
          refereePercent={rules.refereePercent}
          onCopied={(what) => addToast('success', what === 'link' ? 'Link copiado.' : 'Código copiado.')}
          onCopyFailed={() => addToast('error', 'Não foi possível copiar. Selecione o texto e copie manualmente.')}
        />
        <CreditsCard className="lg:col-span-2" credits={dashboard.credits} nextInvoice={dashboard.nextInvoice} rules={rules}/>
      </div>

      <HowItWorksCard rules={rules}/>
      <ReferralList referrals={dashboard.referrals} stats={dashboard.stats}/>
      <ReferredByCard
        referredBy={dashboard.referredBy}
        canAttach={dashboard.canAttach}
        rules={rules}
        onChanged={handleChanged}
        onError={(message) => addToast('error', message)}
      />
      <RulesCard rules={rules}/>
      <ToastContainer toasts={toasts} onRemove={removeToast}/>
    </div>
  );
}
