import type { ReferralListItem } from '@/types/Referral';

/** Badge e texto de cada status — tabela do DESIGN_SYSTEM.md §9.15. */
export function statusBadge(item: ReferralListItem): { type: string; text: string } {
  switch (item.status) {
  case 'registered':
    return { type: 'neutral', text: 'Cadastrou-se' };
  case 'in_grace':
    return { type: 'processing', text: 'Em carência' };
  case 'qualified':
    return item.rewardStatus === 'consumed'
      ? { type: 'success', text: 'Desconto aplicado' }
      : { type: 'success', text: 'Confirmada' };
  case 'on_hold':
    return { type: 'warning', text: 'Em análise' };
  default:
    return { type: 'neutral', text: 'Não confirmada' };
  }
}

export function formatShortDate(value: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/** Linha de apoio abaixo do nome: o que acontece a seguir com aquela indicação. */
export function statusDetail(item: ReferralListItem): string {
  switch (item.status) {
  case 'registered':
    return `Criou a conta em ${formatShortDate(item.createdAt)}. Falta assinar um plano.`;
  case 'in_grace':
    return `Assinou em ${formatShortDate(item.firstPaidAt)}. Seu desconto libera em ${formatShortDate(item.graceEndsAt)}.`;
  case 'qualified':
    if (item.rewardStatus === 'consumed') return 'Os 10% já foram abatidos numa fatura sua.';
    if (item.rewardStatus === 'canceled') return 'O pagamento dessa assinatura foi estornado.';
    if (item.rewardRemainingBp < 1000) return `Restam ${(item.rewardRemainingBp / 100).toLocaleString('pt-BR')}% para a próxima fatura.`;
    return '10% de uma mensalidade para a sua próxima fatura.';
  case 'on_hold':
    return 'Nossa equipe está conferindo esta indicação. Avisamos quando liberar.';
  default:
    return 'A assinatura foi cancelada ou reembolsada nos primeiros 7 dias.';
  }
}
