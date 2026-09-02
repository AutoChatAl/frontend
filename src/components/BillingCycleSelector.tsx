'use client';

import type { BillingCycle } from '@/types/Subscription';
import { BILLING_CYCLES, BILLING_CYCLE_ORDER } from '@lib/billingCycles';

interface BillingCycleSelectorProps {
    value: BillingCycle;
    onChange: (cycle: BillingCycle) => void;
    /** `app` acompanha o dark mode; `light` fica sempre claro (landing page). */
    theme?: 'app' | 'light';
    size?: 'sm' | 'md';
    className?: string;
}

/**
 * Segmented control de ciclo de cobrança (mensal / trimestral / anual) usado em toda
 * escolha de plano base. O desconto de cada ciclo vem de `BILLING_CYCLES`.
 */
export default function BillingCycleSelector({ value, onChange, theme = 'app', size = 'md', className = '' }: BillingCycleSelectorProps) {
  const isApp = theme === 'app';
  const track = isApp
    ? 'border-slate-200 bg-slate-100/70 dark:border-slate-700 dark:bg-slate-800'
    : 'border-slate-200 bg-slate-100/70';
  const activeTab = isApp
    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
    : 'bg-white text-slate-900 shadow-sm';
  const idleTab = isApp
    ? 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
    : 'text-slate-500 hover:text-slate-700';
  const padding = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const activeBadge = isApp
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
    : 'bg-emerald-100 text-emerald-700';
  const idleBadge = isApp
    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
    : 'bg-emerald-50 text-emerald-600';

  return (
    <div className={`inline-flex rounded-xl border p-1 ${track} ${className}`} role="tablist" aria-label="Ciclo de cobrança">
      {BILLING_CYCLE_ORDER.map((cycle) => {
        const meta = BILLING_CYCLES[cycle];
        const isActive = cycle === value;
        return (
          <button
            key={cycle}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cycle)}
            className={`flex items-center gap-1.5 rounded-lg font-semibold transition-colors duration-200 ${padding} ${isActive ? activeTab : idleTab}`}
          >
            {meta.label}
            {meta.discountPercent > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? activeBadge : idleBadge}`}>
                -{meta.discountPercent}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
