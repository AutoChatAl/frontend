'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { authService } from '@/services/auth.service';

import Button from './Button';
import Illustration from './Illustration';
import Modal from './Modal';

const NOTICE = 'referral-banner';
const OPEN_DELAY_MS = 1200;

/**
 * Apresenta o "Indique e ganhe" uma vez, logo depois de o dono entrar no app. Fechar de
 * qualquer jeito grava em `User.dismissedNotices` e o modal não volta em nenhum aparelho.
 * Só para assinante pagante (no teste já existe o modal do teste) e nunca por cima do tour.
 */
export default function ReferralInviteModal() {
  const user = useAuthUser();
  const pathname = usePathname();
  const router = useRouter();
  const { loading, isActive, isTrialing } = useSubscription();
  const { showWelcome, activeStep } = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);

  const tourBusy = showWelcome || activeStep !== null;
  const dismissed = user?.dismissedNotices;
  // Sem a lista do /me ainda não abre: quem já fechou não vê o modal piscar.
  const eligible = !!user
    && user.role === 'owner'
    && Array.isArray(dismissed)
    && !dismissed.includes(NOTICE)
    && !loading
    && isActive
    && !isTrialing
    && !pathname.startsWith('/referrals');

  useEffect(() => {
    if (!eligible || tourBusy || isOpen) return;
    const timer = setTimeout(() => setIsOpen(true), OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [eligible, tourBusy, isOpen]);

  if (!isOpen) return null;

  const close = () => {
    setIsOpen(false);
    authService.dismissNotice(NOTICE).catch(() => {});
  };
  return (
    <Modal isOpen={isOpen} onClose={close} title="Indique e ganhe" size="sm">
      <div className="space-y-5">
        <div className="flex justify-center">
          <Illustration src="/referral/empty.png" width={130} height={112} className="h-28 w-auto"/>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-md font-semibold text-slate-900 dark:text-white">
            Ganhe 10% de desconto por cada novo usuário que assinar com o seu link
          </p>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            O desconto entra sozinho na sua próxima fatura e as indicações se somam, até 50% por fatura. Quem você indicar ganha 5% de desconto na primeira fatura.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="flex-1 justify-center"
            onClick={() => {
              close();
              router.push('/referrals');
            }}
          >
            Pegar meu link
          </Button>
          <Button variant="secondary" className="flex-1 justify-center" onClick={close}>
            Agora não
          </Button>
        </div>
      </div>
    </Modal>
  );
}
