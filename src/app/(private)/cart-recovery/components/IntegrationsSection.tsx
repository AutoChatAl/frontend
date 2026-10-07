'use client';

import { Plus, Pencil, Trash2, Copy, Check, Plug, AlertCircle, MessageCircle, Instagram, Lock, PlugZap, ShieldAlert, Gift, CheckCircle2, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import EmptyState from '@/components/EmptyState';
import IconButton from '@/components/IconButton';
import ToggleSwitch from '@/components/ToggleSwitch';
import { usePlanLimitCheck } from '@/contexts/SubscriptionContext';
import { cartRecoveryService } from '@/services/cart-recovery.service';
import {
  PLATFORM_LABELS,
  type CartRecoveryIntegration,
  type SalesPlatform,
} from '@/types/CartRecovery';

import IntegrationFormModal, { type IntegrationChannelOption, type IntegrationFormTab } from './IntegrationFormModal';
import { PLATFORM_GUIDES } from './platformGuides';

interface Props {
  integrations: CartRecoveryIntegration[];
  channels: IntegrationChannelOption[];
  onReload: () => Promise<void>;
  onToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

const PLATFORM_TONE: Record<SalesPlatform, string> = {
  HOTMART: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  KIWIFY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  EDUZZ: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  MONETIZZE: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  PERFECTPAY: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function hasRecentRejection(integration: CartRecoveryIntegration): boolean {
  if (!integration.lastRejectedAt) return false;
  if (!integration.lastEventAt) return true;
  return new Date(integration.lastRejectedAt).getTime() > new Date(integration.lastEventAt).getTime();
}

export default function IntegrationsSection({ integrations, channels, onReload, onToast }: Props) {
  const router = useRouter();
  const { used, limit, isAtLimit } = usePlanLimitCheck('cartRecoveryIntegrations');
  const limitLabel = limit === -1 ? 'ilimitadas' : limit;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ integration: CartRecoveryIntegration; tab: IntegrationFormTab } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CartRecoveryIntegration | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    if (isAtLimit) {
      onToast(
        'error',
        `Você atingiu o limite de ${limit} integraç${limit === 1 ? 'ão' : 'ões'} de recuperação do seu plano. Mude de plano para criar mais.`,
      );
      return;
    }
    setIsFormOpen(true);
  };

  const handleToggle = async (integration: CartRecoveryIntegration) => {
    try {
      await cartRecoveryService.toggleIntegration(integration.id);
      onToast('success', `Integração ${integration.enabled ? 'desligada' : 'ligada'}`);
      await onReload();
    } catch {
      onToast('error', 'Não foi possível ligar ou desligar a integração');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await cartRecoveryService.deleteIntegration(deleteTarget.id);
      onToast('success', 'Integração excluída');
      setDeleteTarget(null);
      await onReload();
    } catch {
      onToast('error', 'Erro ao excluir integração');
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2000);
    } catch {
      onToast('error', 'Não conseguimos copiar. Selecione o endereço e copie manualmente.');
    }
  };

  const handleSaved = async (kind: 'created' | 'updated') => {
    setIsFormOpen(false);
    setEditTarget(null);
    await onReload();
    onToast('success', kind === 'created' ? 'Integração criada' : 'Integração atualizada');
  };

  const hasNoChannels = channels.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Ligue sua plataforma de vendas ao Synq. A gente mostra o passo a passo e testa a conexão com você.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {used} de {limitLabel} integraç{limit === 1 ? 'ão' : 'ões'} utilizada{used === 1 ? '' : 's'}.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          icon={isAtLimit ? <Lock size={16} /> : <Plus size={16} />}
          disabled={isAtLimit}
          title={isAtLimit ? `Limite de ${limit} integraç${limit === 1 ? 'ão' : 'ões'} atingido` : undefined}
          data-tour="cart-recovery-new"
        >
          Nova integração
        </Button>
      </div>

      {isAtLimit && (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <Lock size={16} className="mt-0.5 shrink-0" />
            <p>
              Você atingiu o limite de <strong>{limit}</strong> integraç{limit === 1 ? 'ão' : 'ões'} do seu plano. Mude de plano para ligar mais plataformas de venda.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/plans')}
            className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Ver planos
          </button>
        </div>
      )}

      {hasNoChannels && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>
            Você ainda não tem nenhum WhatsApp ou Instagram conectado. Conecte um em <strong>Canais</strong> para que as
            mensagens possam ser enviadas.
          </p>
        </div>
      )}

      {integrations.length === 0 ? (
        <div data-tour="cart-recovery-empty">
          <EmptyState
            icon={<Plug size={20} />}
            title="Nenhuma plataforma ligada ainda"
            description="Ligue a Hotmart, Kiwify, Eduzz, Monetizze ou PerfectPay para recuperar vendas perdidas e dar boas-vindas a quem comprou."
            {...(!isAtLimit && {
              action: { label: 'Ligar uma plataforma', icon: <Plus size={16} />, onClick: handleOpenCreate },
            })}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {integrations.map((integration) => {
            const channel = channels.find((c) => c.id === integration.channelId);
            const ChannelIcon = integration.channelType === 'INSTAGRAM' ? Instagram : MessageCircle;
            const missingCode = PLATFORM_GUIDES[integration.platform].codeRequired && !integration.secret?.trim();
            const rejected = hasRecentRejection(integration);
            const pixCount = integration.paymentPendingSteps?.length ?? 0;
            return (
              <div
                key={integration.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className={`inline-flex shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${PLATFORM_TONE[integration.platform]}`}>
                      {PLATFORM_LABELS[integration.platform]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-slate-900 dark:text-white">{integration.name}</h3>
                      <p className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        <ChannelIcon size={12} className="shrink-0" />
                        <span className="truncate">
                          {integration.recoverySteps.length} mensagem(ns) de carrinho
                          {pixCount > 0 ? ` · ${pixCount} de Pix/boleto` : ''} · {channel?.name ?? 'sem número escolhido'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <ToggleSwitch
                      checked={integration.enabled}
                      onChange={() => handleToggle(integration)}
                      ariaLabel={`Ligar integração ${integration.name}`}
                    />
                    <IconButton
                      icon={<Pencil size={16} />}
                      onClick={() => setEditTarget({ integration, tab: 'connection' })}
                      variant="primary"
                      title="Editar"
                    />
                    <IconButton icon={<Trash2 size={16} />} onClick={() => setDeleteTarget(integration)} variant="danger" title="Excluir" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {integration.lastEventAt && !rejected && (
                    <Badge type="success" text={`Funcionando · último aviso ${formatDateTime(integration.lastEventAt)}`} icon={CheckCircle2} pill />
                  )}
                  {!integration.lastEventAt && !rejected && (
                    <Badge type="warning" text="Esperando o primeiro aviso" icon={Clock} pill />
                  )}
                  {rejected && <Badge type="error" text="Código de segurança não confere" icon={ShieldAlert} pill />}
                  {missingCode && <Badge type="warning" text="Falta o código de segurança" icon={ShieldAlert} pill />}
                  {integration.buyerWelcome?.enabled && <Badge type="neutral" text="Boas-vindas ligadas" icon={Gift} pill />}
                </div>

                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Endereço de conexão</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {integration.webhookUrl}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(integration.id, integration.webhookUrl)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
                      title="Copiar endereço"
                    >
                      {copiedId === integration.id ? <Check size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {(!integration.lastEventAt || rejected || missingCode) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<PlugZap size={14} />}
                    onClick={() => setEditTarget({ integration, tab: 'connection' })}
                    className="self-start"
                  >
                    Ver passo a passo e testar
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isFormOpen && (
        <IntegrationFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          channels={channels}
          onSaved={handleSaved}
          onChanged={onReload}
        />
      )}

      {editTarget && (
        <IntegrationFormModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          channels={channels}
          integration={editTarget.integration}
          initialTab={editTarget.tab}
          onSaved={handleSaved}
          onChanged={onReload}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
          title="Excluir integração"
          message={`Excluir a integração "${deleteTarget.name}"? Todos os carrinhos associados também serão removidos.`}
        />
      )}
    </div>
  );
}
