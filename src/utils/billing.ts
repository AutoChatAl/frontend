/**
 * Preços dos recursos extras cobrados por unidade/mês. Espelham os produtos
 * criados em `backend/src/scripts/seed-plans.ts` — se o valor mudar lá (ou nos
 * price IDs do Stripe), tem que mudar aqui. O backend não expõe esses valores
 * em nenhum endpoint hoje.
 */
export const EXTRA_INSTANCE_PRICE_CENTS = 2490;
export const EXTRA_COLLABORATOR_PRICE_CENTS = 1990;

export function formatBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
