'use client';

import { Plus, Trash2, Info, MessageCircle, Instagram } from 'lucide-react';
import { useMemo, useState } from 'react';

import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Select from '@/components/Select';
import { cartRecoveryService } from '@/services/cart-recovery.service';
import {
  PLATFORM_LABELS,
  type CartRecoveryIntegration,
  type IntegrationChannelType,
  type RecoveryStep,
  type SalesPlatform,
} from '@/types/CartRecovery';

export interface IntegrationChannelOption {
  id: string;
  name: string;
  number?: string | undefined;
  type: IntegrationChannelType;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  channels: IntegrationChannelOption[];
  integration?: CartRecoveryIntegration;
}

const DEFAULT_STEPS: RecoveryStep[] = [
  {
    delayMinutes: 15,
    messageTemplate:
      'Olá {first_name}, percebi que você começou uma compra do {product_name} mas não finalizou. Posso te ajudar? Conclua aqui: {checkout_url}',
    enabled: true,
  },
  {
    delayMinutes: 60,
    messageTemplate:
      'Oi {first_name}! Seu desconto especial para o {product_name} ainda está disponível. Aproveite antes que acabe: {checkout_url}',
    enabled: true,
  },
  {
    delayMinutes: 1440,
    messageTemplate:
      'Última chance, {first_name}! Estamos guardando seu {product_name} ({value}) por mais algumas horas. Garanta o seu agora: {checkout_url}',
    enabled: true,
  },
];

const PLATFORMS: SalesPlatform[] = ['HOTMART', 'KIWIFY', 'EDUZZ', 'MONETIZZE', 'PERFECTPAY'];

interface PlatformConfig {
  help: string;
  tokenRequired: boolean;
  tokenLabel: string;
  tokenHint: string;
}

const PLATFORM_CONFIG: Record<SalesPlatform, PlatformConfig> = {
  HOTMART: {
    help: 'Na Hotmart, vá em Ferramentas → Webhook (Notificação por URL), cadastre esta URL e copie o "HotTok" gerado por lá. Cole o HotTok no campo abaixo.',
    tokenRequired: true,
    tokenLabel: 'HotTok (Hotmart)',
    tokenHint: 'A Hotmart gera esse token automaticamente quando você cria o webhook no painel dela. Copie de lá e cole aqui.',
  },
  KIWIFY: {
    help: 'Na Kiwify, vá em Configurações → Webhooks, cole esta URL e marque os eventos "pedido pago", "pedido pendente" e "carrinho abandonado". A Kiwify não exige token de validação.',
    tokenRequired: false,
    tokenLabel: 'Token (opcional)',
    tokenHint: 'A Kiwify não usa token de validação. Deixe em branco.',
  },
  EDUZZ: {
    help: 'Na Eduzz, em Minhas Ferramentas → MyEduzz → Notificações, cadastre esta URL como Postback. Se ela exigir uma API Key, gere uma no painel e cole abaixo.',
    tokenRequired: false,
    tokenLabel: 'API Key Eduzz (opcional)',
    tokenHint: 'Cole aqui a API Key que aparece no painel da Eduzz, se houver. Pode deixar em branco.',
  },
  MONETIZZE: {
    help: 'Na Monetizze, vá em Postback → Cadastrar Postback, cole esta URL e configure os eventos desejados. A Monetizze envia uma "chave única" automaticamente — você pode deixar o campo abaixo em branco ou copiar o valor para conferência.',
    tokenRequired: false,
    tokenLabel: 'Chave única Monetizze (opcional)',
    tokenHint: 'Opcional. Se quiser que o sistema valide a chave única enviada pela Monetizze, cole aqui o valor exato.',
  },
  PERFECTPAY: {
    help: 'Na PerfectPay, em Configurações → Webhook, cole esta URL e copie o token que aparece no painel. Cole esse token no campo abaixo.',
    tokenRequired: true,
    tokenLabel: 'Token PerfectPay',
    tokenHint: 'Copie do painel da PerfectPay (Configurações → Webhook) e cole aqui.',
  },
};

export default function IntegrationFormModal({ isOpen, onClose, onSaved, channels, integration }: Props) {
  const isEdit = !!integration;

  const [platform, setPlatform] = useState<SalesPlatform>(integration?.platform ?? 'HOTMART');
  const [name, setName] = useState(integration?.name ?? '');
  const [secret, setSecret] = useState(integration?.secret ?? '');
  const [channelType, setChannelType] = useState<IntegrationChannelType>(integration?.channelType ?? 'WHATSAPP');
  const [channelId, setChannelId] = useState(integration?.channelId ?? '');
  const [steps, setSteps] = useState<RecoveryStep[]>(integration?.recoverySteps?.length ? integration.recoverySteps : DEFAULT_STEPS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredChannels = useMemo(
    () => channels.filter((c) => c.type === channelType),
    [channels, channelType],
  );

  const platformConfig = useMemo(() => PLATFORM_CONFIG[platform], [platform]);

  const handleAddStep = () => {
    if (steps.length >= 10) return;
    const last = steps[steps.length - 1];
    setSteps([
      ...steps,
      {
        delayMinutes: last ? Math.min(last.delayMinutes * 2, 43200) : 30,
        messageTemplate: 'Olá {first_name}, sobre o seu carrinho: {checkout_url}',
        enabled: true,
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleUpdateStep = (index: number, patch: Partial<RecoveryStep>) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const handleChannelTypeChange = (next: IntegrationChannelType) => {
    setChannelType(next);
    const available = channels.find((c) => c.type === next);
    setChannelId(available?.id ?? '');
  };

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim()) return setError('Informe um nome para a integração.');
    if (platformConfig.tokenRequired && !secret.trim()) {
      return setError(`${platformConfig.tokenLabel} é obrigatório para essa plataforma.`);
    }
    if (steps.length === 0) return setError('Adicione pelo menos um passo de recuperação.');

    for (const [i, step] of steps.entries()) {
      if (!Number.isFinite(step.delayMinutes) || step.delayMinutes < 1) {
        return setError(`Passo ${i + 1}: o delay deve ser maior que zero.`);
      }
      if (!step.messageTemplate.trim()) {
        return setError(`Passo ${i + 1}: informe a mensagem.`);
      }
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        secret: secret.trim(),
        channelType,
        channelId: channelId || undefined,
        recoverySteps: steps,
      };

      if (isEdit && integration) {
        await cartRecoveryService.updateIntegration(integration.id, payload);
      } else {
        await cartRecoveryService.createIntegration({ ...payload, platform });
      }

      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar integração');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Editar integração' : 'Nova integração'} size="lg">
      <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto pr-1">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select<SalesPlatform>
            label="Plataforma"
            value={platform}
            disabled={isEdit}
            onChange={(v) => setPlatform(v)}
            options={PLATFORMS.map((p) => ({
              value: p,
              label: PLATFORM_LABELS[p],
              description: PLATFORM_CONFIG[p].tokenRequired ? 'Requer token' : 'Sem token obrigatório',
            }))}
          />

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              placeholder="Ex: Hotmart - Produto Principal"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300">
          <Info size={14} className="mt-0.5 shrink-0" />
          <p>{platformConfig.help}</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
            {platformConfig.tokenLabel}
            {!platformConfig.tokenRequired && <span className="ml-1 text-slate-400">(opcional)</span>}
          </label>
          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            maxLength={2048}
            placeholder={platformConfig.tokenRequired ? 'Cole aqui o token da plataforma' : 'Pode deixar em branco'}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{platformConfig.tokenHint}</p>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-300">Canal de envio</label>
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => handleChannelTypeChange('WHATSAPP')}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                channelType === 'WHATSAPP'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <MessageCircle size={14} />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => handleChannelTypeChange('INSTAGRAM')}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                channelType === 'INSTAGRAM'
                  ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Instagram size={14} />
              Instagram DM
            </button>
          </div>
          <Select
            value={channelId}
            placeholder="Selecionar canal..."
            onChange={(v) => setChannelId(v)}
            clearable
            onClear={() => setChannelId('')}
            options={filteredChannels.map((c) => ({
              value: c.id,
              label: c.name,
              description: c.number ?? undefined,
              icon: channelType === 'INSTAGRAM' ? <Instagram size={14} /> : <MessageCircle size={14} />,
            }))}
          />

          {channelType === 'INSTAGRAM' && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Para Instagram, o cliente precisa ter conversado com sua conta nas últimas 24h ou ter dado opt-in para notificações recorrentes.
            </p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-white">Fluxo de recuperação</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Variáveis disponíveis: <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{'{first_name}'}</code>{' '}
                <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{'{name}'}</code>{' '}
                <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{'{product_name}'}</code>{' '}
                <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{'{value}'}</code>{' '}
                <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{'{checkout_url}'}</code>
              </p>
            </div>
            <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={handleAddStep} disabled={steps.length >= 10}>
              Adicionar passo
            </Button>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white">
                      {index + 1}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">Após</span>
                    <input
                      type="number"
                      min={1}
                      max={43200}
                      value={step.delayMinutes}
                      onChange={(e) => handleUpdateStep(index, { delayMinutes: Number(e.target.value) || 1 })}
                      className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-300">minutos</span>
                    <label className="ml-3 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={step.enabled !== false}
                        onChange={(e) => handleUpdateStep(index, { enabled: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      Ativo
                    </label>
                  </div>
                  <button
                    onClick={() => handleRemoveStep(index)}
                    className="rounded-md p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    title="Remover passo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  value={step.messageTemplate}
                  onChange={(e) => handleUpdateStep(index, { messageTemplate: e.target.value })}
                  rows={3}
                  maxLength={4000}
                  placeholder="Mensagem que será enviada..."
                  className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving} loadingText="Salvando...">
            {isEdit ? 'Salvar alterações' : 'Criar integração'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
