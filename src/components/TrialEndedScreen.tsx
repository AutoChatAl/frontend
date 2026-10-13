'use client';
import { MessageCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSupportChat } from '@/contexts/SupportChatContext';

import Button from './Button';
import Card from './Card';

const ALLOWED_PREFIXES = ['/plans', '/settings'];

const GUARDADOS = [
  'Configurações da IA e do seu negócio',
  'Contatos e etiquetas',
  'Automações e respostas automáticas',
];

interface TrialEndedScreenProps {
  canChoosePlan?: boolean;
  showSupport?: boolean;
}

export function TrialEndedScreen({ canChoosePlan = true, showSupport = true }: TrialEndedScreenProps) {
  const router = useRouter();
  const { openChat } = useSupportChat();

  return (<div className="mx-auto w-full max-w-xl py-6 sm:py-12">
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-8 text-center dark:border-slate-700 dark:bg-slate-900/40 sm:px-8">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">Seu teste terminou</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          A IA e as automações estão pausadas. Escolha um plano para o Synq voltar a atender seus clientes na hora.
        </p>
      </div>

      <div className="space-y-5 px-6 py-6 sm:px-8">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Suas configurações, contatos e automações estão guardados
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 marker:text-slate-300 dark:text-slate-300 dark:marker:text-slate-600">
            {GUARDADOS.map((texto) => (
              <li key={texto}>{texto}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Nada foi apagado. Assim que você assinar, tudo volta a funcionar do jeito que estava.
          </p>
        </div>

        <p className="rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 text-xs leading-relaxed text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
          Enquanto a conta está pausada, mensagens que chegarem no WhatsApp e no Instagram não recebem resposta automática.
        </p>

        {canChoosePlan
          ? (<div className="flex flex-col gap-2 sm:flex-row">
            <Button size="lg" className="flex-1 justify-center" onClick={() => router.push('/plans')}>
              Escolher um plano
            </Button>
            {showSupport && (<Button
              size="lg"
              variant="secondary"
              className="flex-1 justify-center"
              icon={<MessageCircle size={16}/>}
              onClick={openChat}
            >
              Falar com o suporte
            </Button>)}
          </div>)
          : (<p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
            Peça ao responsável pela conta para escolher um plano. Assim que ele assinar, você volta a usar o Synq normalmente.
          </p>)}
      </div>
    </Card>
  </div>);
}

function TrialEndedNotice() {
  const router = useRouter();
  return (<div className="mb-4 flex flex-col gap-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/20 dark:bg-amber-500/10">
    <p className="min-w-0 text-sm text-amber-700 dark:text-amber-300">
      Seu teste terminou. Suas configurações estão guardadas e voltam a funcionar quando você assinar.
    </p>
    <Button size="sm" className="shrink-0 self-start sm:self-auto" onClick={() => router.push('/plans')}>
      Escolher um plano
    </Button>
  </div>);
}

interface TrialEndedGateProps {
  children: ReactNode;
  canChoosePlan?: boolean;
  showSupport?: boolean;
}

export default function TrialEndedGate({ children, canChoosePlan = true, showSupport = true }: TrialEndedGateProps) {
  const { isTrialExpired, loading } = useSubscription();
  const pathname = usePathname() ?? '';

  if (loading || !isTrialExpired)
    return <>{children}</>;

  const allowed = ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!allowed)
    return <TrialEndedScreen canChoosePlan={canChoosePlan} showSupport={showSupport}/>;

  if (pathname.startsWith('/settings') && canChoosePlan) {
    return (<>
      <TrialEndedNotice />
      {children}
    </>);
  }

  return <>{children}</>;
}
