'use client';

import { ShoppingCart, Plug, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import PageLoader from '@/components/PageLoader';
import { ToastContainer, useToast } from '@/components/Toast';
import { cartRecoveryService } from '@/services/cart-recovery.service';
import { channelsService } from '@/services/channels.service';
import type {
  AbandonedCart,
  AbandonedCartsSummary,
  CartRecoveryIntegration,
} from '@/types/CartRecovery';
import type { InstagramAccount, WhatsAppInstance } from '@/types/Channel';

import AbandonedCartsList from './components/AbandonedCartsList';
import IntegrationsSection from './components/IntegrationsSection';
import SummaryCards from './components/SummaryCards';
import type { IntegrationChannelOption } from './components/IntegrationFormModal';

type TabId = 'carts' | 'integrations';

const TABS: Array<{ id: TabId; label: string; icon: typeof ShoppingCart }> = [
  { id: 'carts', label: 'Carrinhos', icon: ShoppingCart },
  { id: 'integrations', label: 'Integrações', icon: Plug },
];

export default function CartRecoveryPage() {
  const searchParams = useSearchParams();
  const initialContactFilter = searchParams.get('contactId') ?? undefined;
  const initialStatusFilter = searchParams.get('status') ?? undefined;

  const [activeTab, setActiveTab] = useState<TabId>('carts');
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [cartsTotal, setCartsTotal] = useState(0);
  const [integrations, setIntegrations] = useState<CartRecoveryIntegration[]>([]);
  const [channelOptions, setChannelOptions] = useState<IntegrationChannelOption[]>([]);
  const [summary, setSummary] = useState<AbandonedCartsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    try {
      if (mode === 'initial') {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      const [cartsRes, integrationsRes, waChannels, igChannels, summaryRes] = await Promise.all([
        cartRecoveryService.listCarts({
          limit: 50,
          skip: 0,
          contactId: initialContactFilter,
          status: (initialStatusFilter as AbandonedCart['status']) ?? undefined,
        }),
        cartRecoveryService.listIntegrations(),
        channelsService.getWhatsAppInstances().catch(() => [] as WhatsAppInstance[]),
        channelsService.getInstagramAccounts().catch(() => [] as InstagramAccount[]),
        cartRecoveryService.getSummary(30),
      ]);

      setCarts(cartsRes.data);
      setCartsTotal(cartsRes.total);
      setIntegrations(integrationsRes);
      setSummary(summaryRes);

      const opts: IntegrationChannelOption[] = [
        ...waChannels.map((c) => ({ id: c.id, name: c.name, number: c.number, type: 'WHATSAPP' as const })),
        ...igChannels.map((c) => ({
          id: c.id,
          name: c.name,
          number: c.instagram?.username ?? undefined,
          type: 'INSTAGRAM' as const,
        })),
      ];
      setChannelOptions(opts);

      if (initialContactFilter || initialStatusFilter) {
        setActiveTab('carts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados de recuperação');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialContactFilter, initialStatusFilter]);

  useEffect(() => {
    fetchAll('initial');
  }, [fetchAll]);

  const handleRefresh = useCallback(async () => {
    await fetchAll('refresh');
    addToast('success', 'Dados atualizados');
  }, [fetchAll, addToast]);

  const reloadCarts = useCallback(
    async (params?: Parameters<typeof cartRecoveryService.listCarts>[0]) => {
      const res = await cartRecoveryService.listCarts({ limit: 50, skip: 0, ...params });
      setCarts(res.data);
      setCartsTotal(res.total);
    },
    []
  );

  const reloadIntegrations = useCallback(async () => {
    const items = await cartRecoveryService.listIntegrations();
    setIntegrations(items);
  }, []);

  const enabledIntegrationsCount = useMemo(
    () => integrations.filter((i) => i.enabled).length,
    [integrations]
  );

  if (loading) {
    return <PageLoader message="Carregando recuperação..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">Recuperação de Carrinhos</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Capture vendas perdidas com mensagens automáticas via WhatsApp ou Instagram para clientes que abandonaram o checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
          title="Atualizar dados"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <SummaryCards summary={summary} integrationsCount={enabledIntegrationsCount} />

      <div data-tour="cart-recovery-tabs" className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 px-1 dark:border-slate-700">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'carts' && (
        <AbandonedCartsList
          carts={carts}
          total={cartsTotal}
          integrations={integrations}
          initialContactId={initialContactFilter}
          initialStatus={(initialStatusFilter as AbandonedCart['status']) ?? undefined}
          onReload={reloadCarts}
          onToast={addToast}
        />
      )}

      {activeTab === 'integrations' && (
        <IntegrationsSection
          integrations={integrations}
          channels={channelOptions}
          onReload={reloadIntegrations}
          onToast={addToast}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
