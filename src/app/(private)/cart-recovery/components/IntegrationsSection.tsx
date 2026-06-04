'use client';

import { Plus, Pencil, Trash2, Copy, Check, Plug, AlertCircle, MessageCircle, Instagram, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

import IntegrationFormModal, { type IntegrationChannelOption } from './IntegrationFormModal';

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

export default function IntegrationsSection({ integrations, channels, onReload, onToast }: Props) {
  const router = useRouter();
  const { used, limit, isAtLimit } = usePlanLimitCheck('cartRecoveryIntegrations');
  const limitLabel = limit === -1 ? 'ilimitadas' : limit;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CartRecoveryIntegration | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CartRecoveryIntegration | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    if (isAtLimit) {
      onToast(
        'error',
        `Você atingiu o limite de ${limit} integraç${limit === 1 ? 'ão' : 'ões'} de recuperação do seu plano. Faça upgrade para criar mais.`,
      );
      return;
    }
    setIsFormOpen(true);
  };

  const handleToggle = async (integration: CartRecoveryIntegration) => {
    try {
      await cartRecoveryService.toggleIntegration(integration.id);
      onToast('success', `Integração ${integration.enabled ? 'desativada' : 'ativada'}`);
      await onReload();
    } catch {
      onToast('error', 'Erro ao alternar integração');
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
      onToast('error', 'Erro ao copiar URL');
    }
  };

  const hasNoChannels = channels.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Conecte suas plataformas de venda. Os webhooks devem ser cadastrados no painel da plataforma usando a URL gerada para cada integração.
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
              Você atingiu o limite de <strong>{limit}</strong> integraç{limit === 1 ? 'ão' : 'ões'} do seu plano. Faça upgrade para cadastrar mais webhooks de recuperação.
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
          <AlertCircle size={16} className="mt-0.5" />
          <p>
            Você ainda não tem nenhum canal WhatsApp conectado. Conecte um canal em <strong>Canais</strong> antes
            de configurar uma integração para que as mensagens possam ser enviadas.
          </p>
        </div>
      )}

      {integrations.length === 0 ? (
        <div data-tour="cart-recovery-empty">
          <EmptyState
            icon={<Plug size={20} />}
            title="Nenhuma integração cadastrada"
            description="Crie uma integração para começar a receber e recuperar carrinhos abandonados."
            {...(!isAtLimit && {
              action: { label: 'Criar integração', icon: <Plus size={16} />, onClick: handleOpenCreate },
            })}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {integrations.map((integration) => {
            const channel = channels.find((c) => c.id === integration.channelId);
            const ChannelIcon = integration.channelType === 'INSTAGRAM' ? Instagram : MessageCircle;
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
                          {integration.recoverySteps.length} passo(s) · {channel?.name ?? 'sem canal'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <ToggleSwitch checked={integration.enabled} onChange={() => handleToggle(integration)} />
                    <IconButton icon={<Pencil size={16} />} onClick={() => setEditTarget(integration)} variant="primary" title="Editar" />
                    <IconButton icon={<Trash2 size={16} />} onClick={() => setDeleteTarget(integration)} variant="danger" title="Excluir" />
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">URL do Webhook</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 truncate rounded bg-white px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {integration.webhookUrl}
                    </code>
                    <button
                      onClick={() => handleCopy(integration.id, integration.webhookUrl)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-indigo-600 dark:hover:bg-slate-700"
                      title="Copiar URL"
                    >
                      {copiedId === integration.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {integration.lastEventAt && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Último evento: {new Date(integration.lastEventAt).toLocaleString('pt-BR')}
                  </p>
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
          onSaved={async () => {
            setIsFormOpen(false);
            await onReload();
            onToast('success', 'Integração criada');
          }}
        />
      )}

      {editTarget && (
        <IntegrationFormModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          channels={channels}
          integration={editTarget}
          onSaved={async () => {
            setEditTarget(null);
            await onReload();
            onToast('success', 'Integração atualizada');
          }}
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
