'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import SegmentedControl from '@/components/SegmentedControl';
import Select from '@/components/Select';
import { cartRecoveryService } from '@/services/cart-recovery.service';
import {
  PLATFORM_LABELS,
  type BuyerWelcome,
  type CartRecoveryIntegration,
  type RecoveryStep,
  type SalesPlatform,
} from '@/types/CartRecovery';

import BuyerWelcomeSection from './BuyerWelcomeSection';
import ConnectionGuide from './ConnectionGuide';
import {
  DEFAULT_BUYER_WELCOME,
  DEFAULT_CART_STEPS,
  PLATFORM_GUIDES,
} from './platformGuides';
import RecoveryStepsEditor, { MessageVariablesHint } from './RecoveryStepsEditor';

export type IntegrationFormTab = 'connection' | 'cart' | 'welcome';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (kind: 'created' | 'updated') => void | Promise<void>;
  onChanged: () => void | Promise<void>;
  integration?: CartRecoveryIntegration;
  initialTab?: IntegrationFormTab;
}

const PLATFORMS: SalesPlatform[] = ['HOTMART', 'KIWIFY', 'EDUZZ', 'MONETIZZE', 'PERFECTPAY'];

const TAB_OPTIONS: ReadonlyArray<{ value: IntegrationFormTab; label: string }> = [
  { value: 'connection', label: 'Conexão' },
  { value: 'cart', label: 'Carrinho abandonado' },
  { value: 'welcome', label: 'Boas-vindas ao comprador' },
];

const NEW_CART_STEP = 'Oi {first_name}, seu {product_name} ainda está te esperando: {checkout_url}';

interface ValidationIssue {
  message: string;
  tab: IntegrationFormTab;
}

function findEmptyStep(steps: RecoveryStep[]): number {
  return steps.findIndex((step) => !step.messageTemplate.trim() || !Number.isFinite(step.delayMinutes) || step.delayMinutes < 1);
}

export default function IntegrationFormModal({ isOpen, onClose, onSaved, onChanged, integration, initialTab = 'connection' }: Props) {
  const [savedIntegration, setSavedIntegration] = useState<CartRecoveryIntegration | undefined>(integration);
  const [justCreated, setJustCreated] = useState(false);
  const [tab, setTab] = useState<IntegrationFormTab>(initialTab);

  const [platform, setPlatform] = useState<SalesPlatform>(integration?.platform ?? 'HOTMART');
  const [name, setName] = useState(integration?.name ?? '');
  const [secret, setSecret] = useState(integration?.secret ?? '');
  const [cartSteps, setCartSteps] = useState<RecoveryStep[]>(
    integration?.recoverySteps?.length ? integration.recoverySteps : DEFAULT_CART_STEPS,
  );
  const [welcome, setWelcome] = useState<BuyerWelcome>({ ...DEFAULT_BUYER_WELCOME, ...integration?.buyerWelcome });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChangedRef = useRef(onChanged);
  useEffect(() => {
    onChangedRef.current = onChanged;
  }, [onChanged]);

  const isSaved = !!savedIntegration;
  const guide = PLATFORM_GUIDES[platform];
  const platformLabel = PLATFORM_LABELS[platform];

  const validate = (): ValidationIssue | null => {
    if (!name.trim()) return { message: 'Dê um nome para a integração.', tab: 'connection' };
    if (cartSteps.length === 0) return { message: 'Adicione pelo menos uma mensagem de carrinho abandonado.', tab: 'cart' };
    const emptyCart = findEmptyStep(cartSteps);
    if (emptyCart >= 0) return { message: `Mensagem ${emptyCart + 1} do carrinho abandonado: escreva o texto e um tempo de pelo menos 1 minuto.`, tab: 'cart' };
    if (welcome.enabled && !welcome.message.trim()) return { message: 'Escreva a mensagem de boas-vindas ou desligue essa opção.', tab: 'welcome' };
    if (isSaved && guide.codeRequired && !secret.trim()) {
      return { message: `Cole o código de segurança da ${platformLabel} no passo a passo antes de concluir.`, tab: 'connection' };
    }
    return null;
  };

  const buildPayload = () => ({
    name: name.trim(),
    secret: secret.trim(),
    recoverySteps: cartSteps,
    buyerWelcome: { ...welcome, message: welcome.message.trim() || DEFAULT_BUYER_WELCOME.message },
  });

  const handleSubmit = async () => {
    setError(null);
    const issue = validate();
    if (issue) {
      setError(issue.message);
      setTab(issue.tab);
      return;
    }

    try {
      setSaving(true);
      if (savedIntegration) {
        await cartRecoveryService.updateIntegration(savedIntegration.id, buildPayload());
        await onSaved(justCreated ? 'created' : 'updated');
        return;
      }
      const created = await cartRecoveryService.createIntegration({ ...buildPayload(), platform });
      setSavedIntegration(created);
      setSecret(created.secret ?? '');
      setJustCreated(true);
      setTab('connection');
      await onChangedRef.current();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a integração.');
    } finally {
      setSaving(false);
    }
  };

  const handleBeforeTest = useCallback(async (): Promise<boolean> => {
    if (!savedIntegration) return false;
    if (secret.trim() === (savedIntegration.secret ?? '')) return true;
    try {
      const updated = await cartRecoveryService.updateIntegration(savedIntegration.id, { secret: secret.trim() });
      setSavedIntegration(updated);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o código de segurança.');
      return false;
    }
  }, [savedIntegration, secret]);

  const handleEventReceived = useCallback((fresh: CartRecoveryIntegration) => {
    setSavedIntegration(fresh);
    void onChangedRef.current();
  }, []);

  const title = isSaved ? (justCreated ? `Conectar ${platformLabel}` : 'Editar integração') : 'Nova integração';
  const submitLabel = !isSaved ? 'Criar e ver o passo a passo' : justCreated ? 'Concluir' : 'Salvar alterações';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="flex flex-col gap-5">
        {justCreated && (
          <Callout tone="success">
            Integração criada! Agora siga os passos abaixo para ligar a {platformLabel} ao Synq.
          </Callout>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <SegmentedControl<IntegrationFormTab>
          options={TAB_OPTIONS}
          value={tab}
          onChange={setTab}
          ariaLabel="Partes da integração"
        />

        {tab === 'connection' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select<SalesPlatform>
                label="Plataforma de vendas"
                value={platform}
                disabled={isSaved}
                onChange={(v) => setPlatform(v)}
                options={PLATFORMS.map((p) => ({
                  value: p,
                  label: PLATFORM_LABELS[p],
                  description: PLATFORM_GUIDES[p].codeRequired ? 'Pede código de segurança' : 'Não pede código de segurança',
                }))}
              />
              <Input
                label="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                placeholder="Ex.: Hotmart - Curso principal"
              />
            </div>

            {/* Não há canal para escolher: a mensagem sai por onde o comprador já fala com você.
                Mandar para quem nunca escreveu é o que faz um número ser bloqueado. */}
            <Callout tone="info">
              As mensagens saem pelo canal em que o cliente já conversou com você: quem clicou num link seu no
              Instagram é chamado no Instagram, e quem falou pelo WhatsApp, no WhatsApp. Quem nunca mandou mensagem
              para você não recebe nada, para o seu número não correr risco de bloqueio.
            </Callout>

            {savedIntegration ? (
              <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Passo a passo para ligar a {platformLabel}</h3>
                <ConnectionGuide
                  integration={savedIntegration}
                  secret={secret}
                  onSecretChange={setSecret}
                  onBeforeTest={handleBeforeTest}
                  onEventReceived={handleEventReceived}
                />
              </div>
            ) : (
              <Callout tone="info">
                Ao criar, mostramos o passo a passo para ligar a {platformLabel} ao Synq, com o endereço para copiar e um teste para confirmar que está funcionando.
              </Callout>
            )}
          </div>
        )}

        {tab === 'cart' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Mensagens para quem entrou na página de pagamento e saiu sem comprar, ou gerou um Pix ou boleto e não pagou. O tempo conta a partir do aviso da plataforma.
            </p>
            <MessageVariablesHint />
            <RecoveryStepsEditor steps={cartSteps} onChange={setCartSteps} newStepTemplate={NEW_CART_STEP} />
          </div>
        )}

        {tab === 'welcome' && (
          <BuyerWelcomeSection value={welcome} onChange={setWelcome} />
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-3 dark:border-slate-700 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={saving} className="justify-center">
            {justCreated ? 'Fechar' : 'Cancelar'}
          </Button>
          <Button onClick={handleSubmit} loading={saving} loadingText="Salvando..." className="justify-center">
            {submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
