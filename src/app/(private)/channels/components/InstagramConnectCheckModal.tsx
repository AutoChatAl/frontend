'use client';
import { BadgeCheck, Instagram } from 'lucide-react';

import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Modal from '@/components/Modal';

import { StepHighlight } from './ConnectStepList';
import InstagramProfessionalSteps from './InstagramProfessionalSteps';

interface InstagramConnectCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
    loading?: boolean;
}

export default function InstagramConnectCheckModal({ isOpen, onClose, onContinue, loading = false }: InstagramConnectCheckModalProps) {
  return (<Modal isOpen={isOpen} onClose={onClose} title="Antes de conectar o Instagram" size="sm">
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-fuchsia-100 dark:border-fuchsia-500/20 bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400">
          <Instagram size={20}/>
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Sua conta precisa ser profissional
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            O Instagram só deixa conectar contas do tipo <StepHighlight>Comercial</StepHighlight> ou <StepHighlight>Criador de conteúdo</StepHighlight>. Contas pessoais não funcionam.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Ainda é pessoal? Mude em 3 passos:</p>
        <InstagramProfessionalSteps/>
      </div>

      <Callout tone="success" className="flex items-start gap-2">
        <BadgeCheck size={14} className="mt-0.5 shrink-0"/>
        <span>É grátis, leva cerca de 1 minuto e você não perde seguidores nem publicações.</span>
      </Callout>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Ao continuar, vai abrir a tela de entrada do Instagram. Entre com a conta da sua empresa e toque em permitir.
      </p>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading} className="justify-center sm:flex-1">
          Vou mudar agora
        </Button>
        <Button type="button" variant="primary" onClick={onContinue} loading={loading} loadingText="Abrindo o Instagram..." className="justify-center sm:flex-1">
          Minha conta já é profissional
        </Button>
      </div>
    </div>
  </Modal>);
}
