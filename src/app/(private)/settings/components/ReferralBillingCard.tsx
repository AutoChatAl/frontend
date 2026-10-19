import Link from 'next/link';

import Card from '@/components/Card';
import Illustration from '@/components/Illustration';
import type { ReferralDashboard } from '@/types/Referral';
import { formatBRLFromCents } from '@/utils/billing';

interface ReferralBillingCardProps {
  dashboard: ReferralDashboard;
}

/** Atalho do Faturamento para o "Indique e ganhe", com o saldo de créditos. */
export default function ReferralBillingCard({ dashboard }: ReferralBillingCardProps) {
  const { credits, rules } = dashboard;
  const hasCredit = credits.availableBp > 0;
  const message = hasCredit
    ? `Você tem ${credits.availableCentsEstimate !== null ? formatBRLFromCents(credits.availableCentsEstimate) : `${credits.availablePercentOfMonthly}% de uma mensalidade`} em créditos de indicação, abatidos na próxima fatura.`
    : `Ganhe ${rules.referrerPercentOfMonthly}% de desconto por cada negócio que assinar o Synq com o seu link.`;
  return (
    <Card className="flex items-center gap-4 p-4">
      <Illustration src="/referral/gift-badge.png" width={56} height={56} className="h-14 w-14 shrink-0"/>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Indique e ganhe</h3>
        <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{message}</p>
      </div>
      <Link
        href="/referrals"
        className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
      >
        {hasCredit ? 'Ver créditos' : 'Pegar meu link'}
      </Link>
    </Card>
  );
}
