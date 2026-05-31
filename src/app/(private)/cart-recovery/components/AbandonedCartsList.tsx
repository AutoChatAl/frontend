'use client';

import { Trash2, Search, ExternalLink, Phone, Mail, ShoppingCart, User, Instagram, Tag } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@/components/Button';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import EmptyState from '@/components/EmptyState';
import IconButton from '@/components/IconButton';
import Modal from '@/components/Modal';
import Select from '@/components/Select';
import { cartRecoveryService } from '@/services/cart-recovery.service';
import {
  ATTEMPT_STATUS_LABELS,
  PLATFORM_LABELS,
  STATUS_LABELS,
  type AbandonedCart,
  type AbandonedCartStatus,
  type CartRecoveryIntegration,
  type ListCartsParams,
  type RecoveryAttemptStatus,
} from '@/types/CartRecovery';

interface Props {
  carts: AbandonedCart[];
  total: number;
  integrations: CartRecoveryIntegration[];
  initialContactId?: string | undefined;
  initialStatus?: AbandonedCartStatus | undefined;
  onReload: (params?: ListCartsParams) => Promise<void>;
  onToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

const MATCH_LABELS: Record<NonNullable<AbandonedCart['matchReason']>, string> = {
  SCK: 'SCK (link)',
  PHONE: 'Telefone',
  EMAIL: 'E-mail',
  IG_USERNAME: 'Usuário IG',
  NONE: 'Sem contato',
};

function isValidUrl(value?: string): value is string {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatBrl(cents?: number): string {
  if (typeof cents !== 'number') return '—';
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

const STATUS_TONE: Record<AbandonedCartStatus, string> = {
  ABANDONED: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  RECOVERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  EXPIRED: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  CANCELED: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

const ATTEMPT_STATUS_TONE: Record<RecoveryAttemptStatus, string> = {
  PENDING: 'text-amber-600 dark:text-amber-400',
  SENT: 'text-emerald-600 dark:text-emerald-400',
  FAILED: 'text-rose-600 dark:text-rose-400',
  SKIPPED: 'text-slate-500 dark:text-slate-400',
};

export default function AbandonedCartsList({ carts, total, integrations, initialContactId, initialStatus, onReload, onToast }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AbandonedCartStatus | ''>(initialStatus ?? '');
  const [integrationFilter, setIntegrationFilter] = useState<string>('');
  const [contactFilter, setContactFilter] = useState<string>(initialContactId ?? '');
  const [deleteTarget, setDeleteTarget] = useState<AbandonedCart | null>(null);
  const [detailTarget, setDetailTarget] = useState<AbandonedCart | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setStatusFilter(initialStatus ?? '');
    setContactFilter(initialContactId ?? '');
  }, [initialContactId, initialStatus]);

  const integrationsById = useMemo(() => {
    const map = new Map<string, CartRecoveryIntegration>();
    integrations.forEach((i) => map.set(i.id, i));
    return map;
  }, [integrations]);

  const isFirstRender = useRef(true);
  const prevSearchRef = useRef('');

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const trimmedSearch = search.trim();
    const debounceMs = trimmedSearch !== prevSearchRef.current ? 350 : 0;
    prevSearchRef.current = trimmedSearch;

    const timer = setTimeout(async () => {
      setRefreshing(true);
      try {
        await onReload({
          search: trimmedSearch || undefined,
          status: statusFilter || undefined,
          integrationId: integrationFilter || undefined,
          contactId: contactFilter || undefined,
        });
      } finally {
        setRefreshing(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [search, statusFilter, integrationFilter, contactFilter, onReload]);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('');
    setIntegrationFilter('');
    setContactFilter('');
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await cartRecoveryService.deleteCart(deleteTarget.id);
      onToast('success', 'Carrinho removido');
      setDeleteTarget(null);
      await onReload();
    } catch {
      onToast('error', 'Erro ao remover carrinho');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, telefone, produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-900"
          />
          {refreshing && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
            </div>
          )}
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            placeholder="Todos os status"
            onChange={(v) => setStatusFilter(v as AbandonedCartStatus | '')}
            clearable
            onClear={() => setStatusFilter('')}
            options={[
              { value: 'ABANDONED', label: 'Abandonado', badge: '●', badgeTone: 'warning' },
              { value: 'RECOVERED', label: 'Recuperado', badge: '●', badgeTone: 'success' },
              { value: 'EXPIRED', label: 'Expirado', badge: '●', badgeTone: 'default' },
              { value: 'CANCELED', label: 'Cancelado', badge: '●', badgeTone: 'danger' },
            ]}
          />
        </div>

        <div className="w-full sm:w-64">
          <Select
            value={integrationFilter}
            placeholder="Todas integrações"
            onChange={(v) => setIntegrationFilter(v)}
            clearable
            onClear={() => setIntegrationFilter('')}
            options={integrations.map((i) => ({
              value: i.id,
              label: i.name,
              description: PLATFORM_LABELS[i.platform],
            }))}
          />
        </div>

        {(search || statusFilter || integrationFilter || contactFilter) && (
          <Button onClick={handleClearFilters} variant="ghost" size="md">
            Limpar
          </Button>
        )}
      </div>

      {contactFilter && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300">
          <span className="flex items-center gap-2">
            <User size={14} />
            Filtrando por contato vinculado
          </span>
          <Link
            href={`/contacts`}
            className="text-xs underline hover:text-indigo-900 dark:hover:text-indigo-100"
          >
            Ver contato →
          </Link>
        </div>
      )}

      {carts.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={20} />}
          title="Nenhum carrinho encontrado"
          description="Quando uma plataforma enviar um carrinho abandonado, ele aparecerá aqui."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Cliente</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Contato</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Produto</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Valor</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Plataforma</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Tentativas</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Abandonado em</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {carts.map((cart) => {
                  const integrationName = integrationsById.get(cart.integrationId)?.name;
                  const attempts = cart.recoveryAttempts ?? [];
                  const sent = attempts.filter((a) => a.status === 'SENT').length;
                  return (
                    <tr key={cart.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">{cart.customerName ?? '—'}</div>
                        {integrationName && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">via {integrationName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
                          {cart.customerEmail && (
                            <span className="flex items-center gap-1">
                              <Mail size={12} />
                              {cart.customerEmail}
                            </span>
                          )}
                          {cart.customerPhone && (
                            <span className="flex items-center gap-1">
                              <Phone size={12} />
                              {cart.customerPhone}
                            </span>
                          )}
                          {cart.customerIgUsername && (
                            <span className="flex items-center gap-1">
                              <Instagram size={12} />
                              @{cart.customerIgUsername}
                            </span>
                          )}
                          {!cart.customerEmail && !cart.customerPhone && !cart.customerIgUsername && <span>—</span>}
                          {cart.matchReason && cart.matchReason !== 'NONE' && (
                            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                              <Tag size={10} />
                              Match: {MATCH_LABELS[cart.matchReason]}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">{cart.productName ?? '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {formatBrl(cart.productValueCents)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">{PLATFORM_LABELS[cart.platform]}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[cart.status]}`}>
                          {STATUS_LABELS[cart.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {sent}/{attempts.length} enviadas
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {formatDate(cart.abandonedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailTarget(cart)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-700"
                            title="Ver detalhes"
                          >
                            <User size={16} />
                          </button>
                          {isValidUrl(cart.checkoutUrl) && (
                            <a
                              href={cart.checkoutUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-700"
                              title="Abrir checkout (link da plataforma de venda — útil para conferir o que o cliente viu)"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          <IconButton icon={<Trash2 size={16} />} onClick={() => setDeleteTarget(cart)} variant="danger" title="Excluir" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Mostrando {carts.length} de {total} carrinho(s)
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
          title="Excluir carrinho"
          message={`Deseja excluir o carrinho de ${deleteTarget.customerName ?? deleteTarget.externalCartId}?`}
        />
      )}

      {detailTarget && (
        <Modal isOpen={!!detailTarget} onClose={() => setDetailTarget(null)} title="Detalhes do carrinho" size="lg">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cliente</p>
                <p className="text-slate-900 dark:text-white">{detailTarget.customerName ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">ID externo</p>
                <code className="text-xs text-slate-700 dark:text-slate-300">{detailTarget.externalCartId}</code>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">E-mail</p>
                <p className="text-slate-700 dark:text-slate-300">{detailTarget.customerEmail ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Telefone</p>
                <p className="text-slate-700 dark:text-slate-300">{detailTarget.customerPhone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Instagram</p>
                <p className="text-slate-700 dark:text-slate-300">
                  {detailTarget.customerIgUsername ? `@${detailTarget.customerIgUsername}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Match</p>
                <p className="text-slate-700 dark:text-slate-300">
                  {detailTarget.matchReason ? MATCH_LABELS[detailTarget.matchReason] : '—'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Parâmetros UTM
              </p>
              {detailTarget.utmParameters && Object.values(detailTarget.utmParameters).some(Boolean) ? (
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {detailTarget.utmParameters.utmSource && (
                    <p className="text-xs"><span className="font-medium text-slate-500">source:</span> <code>{detailTarget.utmParameters.utmSource}</code></p>
                  )}
                  {detailTarget.utmParameters.utmMedium && (
                    <p className="text-xs"><span className="font-medium text-slate-500">medium:</span> <code>{detailTarget.utmParameters.utmMedium}</code></p>
                  )}
                  {detailTarget.utmParameters.utmCampaign && (
                    <p className="text-xs"><span className="font-medium text-slate-500">campaign:</span> <code>{detailTarget.utmParameters.utmCampaign}</code></p>
                  )}
                  {detailTarget.utmParameters.utmContent && (
                    <p className="text-xs"><span className="font-medium text-slate-500">content:</span> <code>{detailTarget.utmParameters.utmContent}</code></p>
                  )}
                  {detailTarget.utmParameters.sck && (
                    <p className="text-xs col-span-full"><span className="font-medium text-slate-500">sck:</span> <code className="break-all">{detailTarget.utmParameters.sck}</code></p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Nenhum UTM capturado neste carrinho.</p>
              )}
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Tentativas de recuperação</p>
              <div className="space-y-1">
                {(detailTarget.recoveryAttempts ?? []).map((a, i) => {
                  const channelLabel = a.channelType === 'INSTAGRAM' ? 'Instagram' : a.channelType === 'WHATSAPP' ? 'WhatsApp' : '—';
                  const statusLabel = ATTEMPT_STATUS_LABELS[a.status];
                  const whenLabel = a.sentAt
                    ? `em ${formatDate(a.sentAt)}`
                    : a.scheduledFor
                      ? `agendada para ${formatDate(a.scheduledFor)}`
                      : '';
                  return (
                    <div key={i} className="flex items-center justify-between gap-3 rounded border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-300">
                        Passo {a.stepIndex + 1} · {channelLabel}
                      </span>
                      <span className={`flex items-center gap-1 font-medium ${ATTEMPT_STATUS_TONE[a.status]}`}>
                        <span>{statusLabel}</span>
                        {whenLabel && <span className="font-normal text-slate-500 dark:text-slate-400">· {whenLabel}</span>}
                      </span>
                    </div>
                  );
                })}
                {(detailTarget.recoveryAttempts ?? []).length === 0 && (
                  <p className="text-xs italic text-slate-400">Nenhuma tentativa registrada.</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
