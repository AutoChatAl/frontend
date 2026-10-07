'use client';
import { Bot, CheckCircle2, Hourglass, MessageCircle, Settings2, Users, Zap } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSupportChat } from '@/contexts/SupportChatContext';

import Button from './Button';
import Card from './Card';

const ALLOWED_PREFIXES = ['/plans', '/settings'];

const GUARDADOS = [
  { icon: Settings2, texto: 'Configurações da IA e do seu negócio' },
  { icon: Users, texto: 'Contatos e etiquetas' },
  { icon: Zap, texto: 'Automações e respostas automáticas' },
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
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <Hourglass size={22}/>
        </span>
        <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">Seu teste terminou</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          A IA e as automações estão pausadas. Escolha um plano para o Synq voltar a atender seus clientes na hora.
        </p>
      </div>

      <div className="space-y-5 px-6 py-6 sm:px-8">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400"/>
            Suas configurações, contatos e automações estão guardados
          </p>
          <ul className="mt-3 space-y-2">
            {GUARDADOS.map(({ icon: Icon, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                  <Icon size={14}/>
                </span>
                {texto}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Nada foi apagado. Assim que você assinar, tudo volta a funcionar do jeito que estava.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 dark:border-violet-500/20 dark:bg-violet-500/10">
          <Bot size={16} className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400"/>
          <p className="text-xs leading-relaxed text-violet-700 dark:text-violet-300">
            Enquanto a conta está pausada, mensagens que chegarem no WhatsApp e no Instagram não recebem resposta automática.
          </p>
        </div>

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
    <div className="flex min-w-0 items-start gap-3 sm:items-center">
      <Hourglass size={16} className="mt-0.5 shrink-0 text-amber-600 sm:mt-0 dark:text-amber-400"/>
      <p className="text-sm text-amber-700 dark:text-amber-300">
        Seu teste terminou. Suas configurações estão guardadas e voltam a funcionar quando você assinar.
      </p>
    </div>
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
