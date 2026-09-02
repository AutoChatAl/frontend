'use client';
import { Bot, Megaphone, MonitorSmartphone, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useSubscription } from '@/contexts/SubscriptionContext';

import Button from './Button';
import Modal from './Modal';

/** Marca a sessão do navegador; o logout limpa, então volta a aparecer no próximo login. */
export const TRIAL_MODAL_SEEN_KEY = 'trial_modal_seen';

const DESTAQUES = [
  {
    icon: Bot,
    titulo: 'IA respondendo por você',
    texto: 'Atendimento automático que consulta agenda, agenda horários e conhece seus produtos.',
  },
  {
    icon: MonitorSmartphone,
    titulo: 'Mais canais conectados',
    texto: 'WhatsApp e Instagram em paralelo, com colaboradores dividindo o atendimento.',
  },
  {
    icon: Megaphone,
    titulo: 'Campanhas e automações',
    texto: 'Disparos em massa, respostas automáticas e automações de comentários sem limite de teste.',
  },
];

/**
 * Convite para assinar, exibido uma vez por login enquanto a conta está em teste.
 * Não aparece para quem já assinou nem se repete a cada navegação.
 */
export default function TrialWelcomeModal() {
  const { isTrialing, trialDaysRemaining, trialEnd, loading } = useSubscription();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (loading || !isTrialing)
      return;
    if (sessionStorage.getItem(TRIAL_MODAL_SEEN_KEY) === 'true')
      return;
    sessionStorage.setItem(TRIAL_MODAL_SEEN_KEY, 'true');
    setIsOpen(true);
  }, [loading, isTrialing]);

  if (!isOpen)
    return null;

  const restante = trialDaysRemaining <= 0
    ? 'menos de um dia'
    : `${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'dia' : 'dias'}`;

  return (<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Você está no período de teste" size="sm">
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Sparkles size={18}/>
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Restam {restante} de teste</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {trialEnd
              ? `Termina em ${new Date(trialEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`
              : 'Assine antes do fim para não perder o acesso.'}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
          O teste tem limites reduzidos. Assinando um plano, você libera:
        </p>
        <ul className="space-y-3">
          {DESTAQUES.map(({ icon: Icon, titulo, texto }) => (
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

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1 justify-center"
          onClick={() => {
            setIsOpen(false);
            router.push('/plans');
          }}
        >
          Ver planos
        </Button>
        <Button variant="secondary" className="flex-1 justify-center" onClick={() => setIsOpen(false)}>
          Continuar no teste
        </Button>
      </div>
    </div>
  </Modal>);
}
