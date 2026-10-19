import Card from '@/components/Card';
import Illustration from '@/components/Illustration';
import type { ReferralRules } from '@/types/Referral';

interface HowItWorksCardProps {
  rules: ReferralRules;
}

export default function HowItWorksCard({ rules }: HowItWorksCardProps) {
  const steps = [
    {
      image: '/referral/step-share.png',
      title: 'Compartilhe seu link',
      text: 'Envie para outros negócios pelo WhatsApp, Instagram ou e-mail.',
    },
    {
      image: '/referral/step-subscribe.png',
      title: `A pessoa assina com ${rules.refereePercent}% de desconto`,
      text: `Ela testa grátis por 7 dias e ganha ${rules.refereePercent}% na primeira fatura do plano.`,
    },
    {
      image: '/referral/step-earn.png',
      title: `Você ganha ${rules.referrerPercentOfMonthly}%`,
      text: `Depois de ${rules.graceDays} dias de assinatura, ${rules.referrerPercentOfMonthly}% de uma mensalidade entram na sua próxima fatura.`,
    },
  ];
  return (
    <Card className="p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Como funciona</h2>
      <ol className="mt-3 grid gap-4 sm:grid-cols-3">
        {steps.map((step) => (
          <li key={step.title} className="flex items-start gap-3">
            {/* Caixa fixa: as ilustrações têm proporções diferentes e ocupam a mesma área. */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center">
              <Illustration src={step.image} width={48} height={48} className="max-h-12 w-auto"/>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{step.title}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
