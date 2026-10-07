'use client';
import { ArrowRight, Megaphone, RotateCcw, Users, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

import type { BusinessType } from '@/types/BusinessType';
import { HIDDEN_FEATURES } from '@/utils/featureFlags';

interface NextStepsProps {
  businessType: BusinessType | null;
}

interface NextStepItem {
  id: string;
  icon: LucideIcon;
  tone: string;
  title: string;
  description: string;
  href: string;
}

function buildItems(businessType: BusinessType | null): NextStepItem[] {
  const items: NextStepItem[] = [
    HIDDEN_FEATURES.campaignNonOfficialChannels
      ? {
        id: 'campaigns',
        icon: Megaphone,
        tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
        title: 'Envie campanhas pelo WhatsApp Oficial',
        description: 'Mande uma mensagem para muitos contatos de uma vez usando o número oficial do WhatsApp.',
        href: '/whatsapp-official',
      }
      : {
        id: 'campaigns',
        icon: Megaphone,
        tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
        title: 'Envie campanhas',
        description: 'Mande uma mensagem para muitos contatos de uma vez, na hora ou agendada.',
        href: '/campaigns',
      },
  ];
  if (!HIDDEN_FEATURES.cartRecovery && (businessType === 'ecommerce' || businessType === 'infoproduct')) {
    items.push({
      id: 'recovery',
      icon: RotateCcw,
      tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
      title: 'Recupere vendas perdidas',
      description: 'Lembre automaticamente quem gerou o Pix ou o boleto e ainda não pagou.',
      href: '/cart-recovery',
    });
  }
  items.push({
    id: 'team',
    icon: Users,
    tone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
    title: 'Convide sua equipe',
    description: 'Chame quem ajuda no atendimento para responder os clientes junto com você.',
    href: '/settings?tab=members',
  });
  return items;
}

export default function NextSteps({ businessType }: NextStepsProps) {
  const items = buildItems(businessType);
  return (
    <section aria-labelledby="next-steps-title">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 id="next-steps-title" className="text-base font-semibold text-slate-900 dark:text-white">Próximos passos</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">Opcional, quando você quiser</span>
      </div>
      <div className={`mt-3 grid grid-cols-1 gap-3 ${items.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {items.map(({ id, icon: Icon, tone, title, description, href }) => (
          <Link
            key={id}
            href={href}
            className="group flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-none dark:hover:border-indigo-500/50"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
              <Icon size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{description}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors group-hover:text-indigo-700 dark:text-indigo-400 dark:group-hover:text-indigo-300">
              Ver como funciona <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
