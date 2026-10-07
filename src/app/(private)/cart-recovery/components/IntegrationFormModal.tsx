'use client';

import { BadgeCheck, Instagram, MessageCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import SegmentedControl from '@/components/SegmentedControl';
import Select from '@/components/Select';
import ToggleRow from '@/components/ToggleRow';
import { cartRecoveryService } from '@/services/cart-recovery.service';
import {
  PLATFORM_LABELS,
  type BuyerWelcome,
  type CartRecoveryIntegration,
  type IntegrationChannelType,
  type RecoveryStep,
  type SalesPlatform,
} from '@/types/CartRecovery';

import BuyerWelcomeSection from './BuyerWelcomeSection';
import ConnectionGuide from './ConnectionGuide';
import {
  DEFAULT_BUYER_WELCOME,
  DEFAULT_CART_STEPS,
  DEFAULT_PAYMENT_PENDING_STEPS,
  PLATFORM_GUIDES,
} from './platformGuides';
import RecoveryStepsEditor, { MessageVariablesHint } from './RecoveryStepsEditor';

export interface IntegrationChannelOption {
  id: string;
  name: string;
  number?: string | undefined;
  type: IntegrationChannelType;
}

export type IntegrationFormTab = 'connection' | 'cart' | 'payment' | 'welcome';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (kind: 'created' | 'updated') => void | Promise<void>;
  onChanged: () => void | Promise<void>;
  channels: IntegrationChannelOption[];
  integration?: CartRecoveryIntegration;
  initialTab?: IntegrationFormTab;
}

const PLATFORMS: SalesPlatform[] = ['HOTMART', 'KIWIFY', 'EDUZZ', 'MONETIZZE', 'PERFECTPAY'];

const TAB_OPTIONS: ReadonlyArray<{ value: IntegrationFormTab; label: string }> = [
  { value: 'connection', label: 'Conexão' },
  { value: 'cart', label: 'Carrinho abandonado' },
  { value: 'payment', label: 'Pix ou boleto pendente' },
  { value: 'welcome', label: 'Boas-vindas ao comprador' },
];

const CHANNEL_CHOICES: ReadonlyArray<{ type: IntegrationChannelType; label: string; icon: typeof MessageCircle; active: string }> = [
  {
    type: 'WHATSAPP',
    label: 'WhatsApp',
    icon: MessageCircle,
    active: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  {
    type: 'WHATSAPP_OFFICIAL',
    label: 'WhatsApp Oficial',
    icon: BadgeCheck,
    active: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  {
    type: 'INSTAGRAM',
    label: 'Instagram',
    icon: Instagram,
    active: 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-500 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
  },
];

const NEW_CART_STEP = 'Oi {first_name}, seu {product_name} ainda está te esperando: {checkout_url}';
const NEW_PAYMENT_STEP = 'Oi {first_name}, seu Pix ou boleto do {product_name} ainda não foi pago. Link para pagar: {checkout_url}';

interface ValidationIssue {
  message: string;
  tab: IntegrationFormTab;
}

function findEmptyStep(steps: RecoveryStep[]): number {
  return steps.findIndex((step) => !step.messageTemplate.trim() || !Number.isFinite(step.delayMinutes) || step.delayMinutes < 1);
}

export default function IntegrationFormModal({ isOpen, onClose, onSaved, onChanged, channels, integration, initialTab = 'connection' }: Props) {
  const [savedIntegration, setSavedIntegration] = useState<CartRecoveryIntegration | undefined>(integration);
  const [justCreated, setJustCreated] = useState(false);
  const [tab, setTab] = useState<IntegrationFormTab>(initialTab);

  const [platform, setPlatform] = useState<SalesPlatform>(integration?.platform ?? 'HOTMART');
  const [name, setName] = useState(integration?.name ?? '');
  const [secret, setSecret] = useState(integration?.secret ?? '');
  const [channelType, setChannelType] = useState<IntegrationChannelType>(integration?.channelType ?? 'WHATSAPP');
  const [channelId, setChannelId] = useState(integration?.channelId ?? '');
  const [cartSteps, setCartSteps] = useState<RecoveryStep[]>(
    integration?.recoverySteps?.length ? integration.recoverySteps : DEFAULT_CART_STEPS,
  );
  const [paymentEnabled, setPaymentEnabled] = useState<boolean>(
    integration ? (integration.paymentPendingSteps?.length ?? 0) > 0 : true,
  );
  const [paymentSteps, setPaymentSteps] = useState<RecoveryStep[]>(
    integration?.paymentPendingSteps?.length ? integration.paymentPendingSteps : DEFAULT_PAYMENT_PENDING_STEPS,
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

  const filteredChannels = useMemo(
    () => channels.filter((c) => c.type === channelType),
    [channels, channelType],
  );

  const handleChannelTypeChange = (next: IntegrationChannelType) => {
    setChannelType(next);
    const available = channels.find((c) => c.type === next);
    setChannelId(available?.id ?? '');
  };

  const validate = (): ValidationIssue | null => {
    if (!name.trim()) return { message: 'Dê um nome para a integração.', tab: 'connection' };
    if (cartSteps.length === 0) return { message: 'Adicione pelo menos uma mensagem de carrinho abandonado.', tab: 'cart' };
    const emptyCart = findEmptyStep(cartSteps);
    if (emptyCart >= 0) return { message: `Mensagem ${emptyCart + 1} do carrinho abandonado: escreva o texto e um tempo de pelo menos 1 minuto.`, tab: 'cart' };
    if (paymentEnabled) {
      if (paymentSteps.length === 0) return { message: 'Adicione pelo menos uma mensagem para Pix ou boleto, ou desligue essa opção.', tab: 'payment' };
      const emptyPayment = findEmptyStep(paymentSteps);
      if (emptyPayment >= 0) return { message: `Mensagem ${emptyPayment + 1} de Pix ou boleto: escreva o texto e um tempo de pelo menos 1 minuto.`, tab: 'payment' };
    }
    if (welcome.enabled && !welcome.message.trim()) return { message: 'Escreva a mensagem de boas-vindas ou desligue essa opção.', tab: 'welcome' };
    if (isSaved && guide.codeRequired && !secret.trim()) {
      return { message: `Cole o código de segurança da ${platformLabel} no passo a passo antes de concluir.`, tab: 'connection' };
    }
    return null;
  };

  const buildPayload = () => ({
    name: name.trim(),
    secret: secret.trim(),
    channelType,
    channelId: channelId || undefined,
    recoverySteps: cartSteps,
    paymentPendingSteps: paymentEnabled ? paymentSteps : [],
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

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Enviar as mensagens por</p>
              <div className="flex flex-wrap gap-2">
                {CHANNEL_CHOICES.map((choice) => {
                  const Icon = choice.icon;
                  const active = channelType === choice.type;
                  return (
                    <button
                      key={choice.type}
                      type="button"
                      onClick={() => handleChannelTypeChange(choice.type)}
                      aria-pressed={active}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        active
                          ? choice.active
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <Icon size={14} />
                      {choice.label}
                    </button>
                  );
                })}
              </div>
              <Select
                value={channelId}
                placeholder="Escolha o número ou a conta..."
                onChange={(v) => setChannelId(v)}
                clearable
                onClear={() => setChannelId('')}
                emptyMessage="Nenhum número ou conta deste tipo conectado. Conecte em Canais."
                options={filteredChannels.map((c) => ({
                  value: c.id,
                  label: c.name,
                  description: c.number ?? undefined,
                  icon: c.type === 'INSTAGRAM' ? <Instagram size={14} /> : c.type === 'WHATSAPP_OFFICIAL' ? <BadgeCheck size={14} /> : <MessageCircle size={14} />,
                }))}
              />
              {channelType === 'WHATSAPP_OFFICIAL' && (
                <Callout tone="warning">
                  No WhatsApp Oficial, se o cliente não fala com você há mais de 24h, só dá para chamar de novo com um modelo aprovado. Nesses casos a mensagem não é enviada e o motivo aparece nos detalhes do carrinho.
                </Callout>
              )}
              {channelType === 'INSTAGRAM' && (
                <Callout tone="warning">
                  No Instagram, só conseguimos mandar mensagem para quem já conversou com sua conta nas últimas 24 horas ou aceitou receber avisos.
                </Callout>
              )}
            </div>

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
              Mensagens para quem entrou na página de pagamento e saiu sem comprar. O tempo conta a partir do aviso da plataforma.
            </p>
            <MessageVariablesHint />
            <RecoveryStepsEditor steps={cartSteps} onChange={setCartSteps} newStepTemplate={NEW_CART_STEP} />
          </div>
        )}

        {tab === 'payment' && (
          <div className="space-y-4">
            <ToggleRow
              title="Mensagens próprias para Pix e boleto"
              description="Quando o cliente gera um Pix ou boleto e não paga, ele recebe estas mensagens no lugar das de carrinho abandonado."
              checked={paymentEnabled}
              onChange={setPaymentEnabled}
            />
            {paymentEnabled ? (
              <div className="space-y-3">
                <MessageVariablesHint />
                <RecoveryStepsEditor steps={paymentSteps} onChange={setPaymentSteps} newStepTemplate={NEW_PAYMENT_STEP} />
              </div>
            ) : (
              <Callout tone="info">
                Desligado: quem gerar Pix ou boleto e não pagar recebe as mesmas mensagens do carrinho abandonado.
              </Callout>
            )}
          </div>
        )}

        {tab === 'welcome' && (
          <BuyerWelcomeSection value={welcome} onChange={setWelcome} channelType={channelType} />
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
