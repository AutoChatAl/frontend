'use client';
import { Bot, MonitorSmartphone, Sparkles, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

import Button from './Button';
import Modal from './Modal';

export const TRIAL_MODAL_SEEN_KEY = 'trial_modal_seen';

const SHOW_FROM_DAYS_REMAINING = 2;
const OPEN_DELAY_MS = 1200;

function readSeen(): boolean {
  try {
    return sessionStorage.getItem(TRIAL_MODAL_SEEN_KEY) === 'true';
  }
  catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(TRIAL_MODAL_SEEN_KEY, 'true');
  }
  catch {
    return;
  }
}

export default function TrialWelcomeModal() {
  const { isTrialing, trialDaysRemaining, trialEnd, loading, usage, aiPlan } = useSubscription();
  const { showWelcome, activeStep } = useOnboarding();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const tourBusy = showWelcome || activeStep !== null;
  const inFinalDays = trialDaysRemaining <= SHOW_FROM_DAYS_REMAINING;

  useEffect(() => {
    if (loading || !isTrialing || !inFinalDays || tourBusy)
      return;
    if (readSeen())
      return;
    const timer = setTimeout(() => {
      markSeen();
      setIsOpen(true);
    }, OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loading, isTrialing, inFinalDays, tourBusy]);

  useEffect(() => {
    if (isOpen && tourBusy)
      setIsOpen(false);
  }, [isOpen, tourBusy]);

  if (!isOpen)
    return null;

  const restante = trialDaysRemaining <= 0
    ? 'menos de um dia'
    : `${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'dia' : 'dias'}`;

  const aiLimit = usage?.aiMessages.limit && usage.aiMessages.limit > 0
    ? usage.aiMessages.limit
    : aiPlan?.limits.maxAiMessagesPerMonth ?? 0;
  const aiText = aiLimit > 0
    ? `Até ${aiLimit.toLocaleString('pt-BR')} respostas da IA no teste, atendendo seus clientes a qualquer hora.`
    : 'A IA atende seus clientes a qualquer hora, consulta sua agenda e conhece seus produtos.';

  const destaques = [
    {
      icon: Bot,
      titulo: 'IA respondendo seus clientes',
      texto: aiText,
    },
    {
      icon: MonitorSmartphone,
      titulo: 'WhatsApp e Instagram',
      texto: 'Suas conversas dos dois canais num só lugar.',
    },
    {
      icon: Zap,
      titulo: 'Automações',
      texto: 'Respostas automáticas, mensagens para quem comenta nos seus posts e campanhas.',
    },
  ];

  return (<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Seu teste está chegando ao fim" size="sm">
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <Sparkles size={18}/>
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Restam {restante} de teste</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {trialEnd
              ? `Termina em ${new Date(trialEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`
              : 'Assine antes do fim para não parar o atendimento.'}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
          Tudo isto já está liberado no seu teste. Assinando um plano, continua funcionando sem parar:
        </p>
        <ul className="space-y-3">
          {destaques.map(({ icon: Icon, titulo, texto }) => (
            <li key={titulo} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                <Icon size={14}/>
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{titulo}</p>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Suas configurações, contatos e automações ficam guardados mesmo depois do fim do teste.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1 justify-center"
          onClick={() => {
            setIsOpen(false);
            router.push('/plans');
          }}
        >
          Escolher um plano
        </Button>
        <Button variant="secondary" className="flex-1 justify-center" onClick={() => setIsOpen(false)}>
          Continuar no teste
        </Button>
      </div>
    </div>
  </Modal>);
}
