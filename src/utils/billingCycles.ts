import type { BillingCycle, Plan } from '@/types/Subscription';

/**
 * Ciclos de cobrança do plano base. Espelha `backend/src/infra/config/billingCycles.ts`
 * — se o desconto mudar lá, tem que mudar aqui. Os valores exibidos vêm do backend
 * (`plan.cyclePrices`); estas funções só cobrem o cálculo local (planos de fallback
 * da landing) e a formatação.
 *
 * O desconto vale APENAS para o plano base — planos de IA e extras não mudam de preço.
 */
export interface BillingCycleMeta {
  /** Meses cobrados de uma vez. */
  months: number;
  /** Desconto sobre o preço mensal. */
  discountPercent: number;
  label: string;
  /** Como a cobrança é descrita ao usuário. */
  chargeLabel: string;
}

export const BILLING_CYCLES: Record<BillingCycle, BillingCycleMeta> = {
  monthly: { months: 1, discountPercent: 0, label: 'Mensal', chargeLabel: 'cobrado todo mês' },
  quarterly: { months: 3, discountPercent: 13, label: 'Trimestral', chargeLabel: 'cobrado a cada 3 meses' },
  yearly: { months: 12, discountPercent: 19, label: 'Anual', chargeLabel: 'cobrado uma vez por ano' },
};

export const BILLING_CYCLE_ORDER: BillingCycle[] = ['monthly', 'quarterly', 'yearly'];

/** Ciclo pré-selecionado nas telas de escolha de plano. */
export const DEFAULT_BILLING_CYCLE: BillingCycle = 'quarterly';

/** Preço mensal com o desconto do ciclo — é o número exibido como "R$ X/mês". */
export function cycleMonthlyEquivalentCents(monthlyPriceCents: number, cycle: BillingCycle): number {
  return Math.round(monthlyPriceCents * (1 - BILLING_CYCLES[cycle].discountPercent / 100));
}

/** Total cobrado a cada renovação do ciclo. */
export function cycleTotalCents(monthlyPriceCents: number, cycle: BillingCycle): number {
  return cycleMonthlyEquivalentCents(monthlyPriceCents, cycle) * BILLING_CYCLES[cycle].months;
}

/**
 * Preço do plano no ciclo: usa o valor cadastrado no backend e, quando ele ainda não
 * existe (plano antigo ou fallback estático), cai no cálculo a partir do preço mensal.
 */
export function planCycleTotalCents(plan: Pick<Plan, 'priceCents' | 'cyclePrices'>, cycle: BillingCycle): number {
  return plan.cyclePrices?.[cycle]?.priceCents ?? cycleTotalCents(plan.priceCents, cycle);
}

/** Quanto o plano custa por mês dentro do ciclo escolhido. */
export function planMonthlyEquivalentCents(plan: Pick<Plan, 'priceCents' | 'cyclePrices'>, cycle: BillingCycle): number {
  return Math.round(planCycleTotalCents(plan, cycle) / BILLING_CYCLES[cycle].months);
}

/** Ex.: "R$ 305,76 cobrado a cada 3 meses". Vazio no ciclo mensal, que já é o preço exibido. */
export function cycleChargeSummary(plan: Pick<Plan, 'priceCents' | 'cyclePrices'>, cycle: BillingCycle): string | null {
  if (cycle === 'monthly')
    return null;
  const total = planCycleTotalCents(plan, cycle) / 100;
  return `${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ${BILLING_CYCLES[cycle].chargeLabel}`;
}
