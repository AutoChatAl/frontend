import Card from '@/components/Card';
import type { ReferralCredits, ReferralNextInvoice, ReferralRules } from '@/types/Referral';
import { formatBRLFromCents } from '@/utils/billing';

import { formatShortDate } from '../referralStatus';

interface CreditsCardProps {
  credits: ReferralCredits;
  nextInvoice: ReferralNextInvoice | null;
  rules: ReferralRules;
  className?: string;
}

function percentLabel(value: number): string {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right font-medium tabular-nums text-slate-900 dark:text-white">{value}</dd>
    </div>
  );
}

/** Saldo de créditos do indicador. O número fica neutro: zero não é destaque. */
export default function CreditsCard({ credits, nextInvoice, rules, className = '' }: CreditsCardProps) {
  const hasCredit = credits.availableBp > 0;
  const projected = nextInvoice && nextInvoice.estimatedCents > 0 ? nextInvoice : null;
  const value = credits.availableCentsEstimate !== null
    ? formatBRLFromCents(credits.availableCentsEstimate)
    : percentLabel(credits.availablePercentOfMonthly);
  const nextInvoiceLabel = projected
    ? `− ${formatBRLFromCents(projected.estimatedCents)}${projected.appliesTo === 'renewal' && projected.date ? ` em ${formatShortDate(projected.date)}` : ''}`
    : 'Sem desconto ainda';
  const graceLabel = credits.inGraceCount > 0
    ? `${credits.inGraceCount}${credits.nextReleaseAt ? ` · libera ${formatShortDate(credits.nextReleaseAt)}` : ''}`
    : 'Nenhuma';

  return (
    <Card className={`flex h-full flex-col p-4 sm:p-5 ${className}`}>
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Seus créditos</h2>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Abatidos automaticamente na próxima fatura do plano.</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {hasCredit
          ? `Equivale a ${percentLabel(credits.availablePercentOfMonthly)} de uma mensalidade.`
          : `Cada indicação confirmada vale ${rules.referrerPercentOfMonthly}% de uma mensalidade.`}
      </p>
      <dl className="mt-auto space-y-2 border-t border-slate-100 pt-3 text-[13px] dark:border-slate-700">
        <Row label="Próxima fatura" value={nextInvoiceLabel}/>
        <Row label="Em carência" value={graceLabel}/>
        <Row label="Limite por fatura" value={`${rules.maxTotalDiscountPercent}% do plano`}/>
      </dl>
    </Card>
  );
}
