import Link from 'next/link';

import Card from '@/components/Card';
import type { ReferralRules } from '@/types/Referral';

interface RulesCardProps {
  rules: ReferralRules;
}

export default function RulesCard({ rules }: RulesCardProps) {
  const items = [
    `Quem você indicar ganha ${rules.refereePercent}% de desconto no plano, só na primeira fatura paga.`,
    `A indicação é confirmada quando a pessoa mantém a assinatura por ${rules.graceDays} dias, sem cancelar nem pedir reembolso.`,
    `Cada indicação confirmada vale ${rules.referrerPercentOfMonthly}% de uma mensalidade do seu plano, abatidos na sua próxima renovação. Várias indicações no mesmo ciclo se somam.`,
    `O desconto de uma fatura (cupom + indicação) vai até ${rules.maxTotalDiscountPercent}% do valor do plano. O que passar fica guardado para as faturas seguintes.`,
    'O desconto vale para o plano. IA, conexões extras e mensagens excedentes são cobradas normalmente.',
    'Vale só para negócios que assinam o Synq pela primeira vez, com cartão e CPF próprios. Indicações de si mesmo não contam.',
    'Nos planos trimestral e anual, o crédito entra na próxima renovação do ciclo.',
  ];
  return (
    <Card className="p-4 sm:p-5">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Regras do programa</h2>
          <span className="text-xs font-medium text-indigo-600 group-open:hidden dark:text-indigo-400">Ver regras</span>
          <span className="hidden text-xs font-medium text-indigo-600 group-open:inline dark:text-indigo-400">Esconder</span>
        </summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13px] text-slate-600 dark:text-slate-300">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Detalhes completos nos{' '}
          <Link href="/termos#programa-de-indicacao" className="text-indigo-600 hover:underline dark:text-indigo-400">Termos de Serviço</Link>.
        </p>
      </details>
    </Card>
  );
}
