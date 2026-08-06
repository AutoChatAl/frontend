'use client';
import { ChevronLeft, ChevronRight,
  BadgeCheck,
  CheckCheck,
  CircleDollarSign,
  Eye,
  LayoutTemplate,
  MessageSquareText,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Dropdown from '@/components/Dropdown';
import EmptyState from '@/components/EmptyState';
import PageLoader from '@/components/PageLoader';
import { ToastContainer, useToast } from '@/components/Toast';
import { whatsappOfficialService } from '@/services/whatsapp-official.service';
import { formatBrlFromMicros, type WaMetaBilledPoint, type WaOfficialOverview, type WaUsageRecord } from '@/types/WhatsAppOfficial';

const USAGE_PAGE_SIZE = 10;

const CATEGORY_LABELS: Record<string, string> = {
  marketing: 'Marketing',
  utility: 'Utilidade',
  authentication: 'Autenticação',
  service: 'Atendimento (grátis)',
  referral_conversion: 'Anúncio (grátis)',
  unknown: 'Outros',
};

const QUALITY_BADGE: Record<string, { type: string; text: string }> = {
  GREEN: { type: 'success', text: 'Qualidade alta' },
  YELLOW: { type: 'warning', text: 'Qualidade média' },
  RED: { type: 'error', text: 'Qualidade baixa' },
  UNKNOWN: { type: 'neutral', text: 'Qualidade pendente' },
};

function MetricCard({ title, value, icon, hint }: { title: string; value: string; icon: React.ReactNode; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{hint}</p>}
    </Card>
  );
}

export default function WhatsAppOfficialDashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<WaOfficialOverview | null>(null);
  const [usageHistory, setUsageHistory] = useState<WaUsageRecord[]>([]);
  const [usageTotal, setUsageTotal] = useState(0);
  const [usagePage, setUsagePage] = useState(0);
  const [metaBilled, setMetaBilled] = useState<WaMetaBilledPoint[] | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const loadData = useCallback(async (channelId: string, periodDays: string, page = 0) => {
    try {
      const [overviewData, history] = await Promise.all([
        whatsappOfficialService.getOverview(Number(periodDays), channelId || undefined),
        whatsappOfficialService.getUsageHistory({ ...(channelId ? { channelId } : {}), limit: USAGE_PAGE_SIZE, skip: page * USAGE_PAGE_SIZE }),
      ]);
      setOverview(overviewData);
      setUsageHistory(history.data);
      setUsageTotal(history.total);

      const billedTargets = channelId
        ? overviewData.channels.filter((c) => c.id === channelId)
        : overviewData.channels;
      const billedResults = await Promise.all(
        billedTargets.map((c) => whatsappOfficialService.getMetaBilling(c.id, Number(periodDays)).catch(() => [] as WaMetaBilledPoint[])),
      );
      setMetaBilled(billedResults.flat());
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Erro ao carregar o painel.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setUsagePage(0);
    loadData(selectedChannelId, days, 0);
  }, [loadData, selectedChannelId, days]);

  const changeUsagePage = (page: number) => {
    setUsagePage(page);
    loadData(selectedChannelId, days, page);
  };

  const handleRefreshChannel = async (channelId: string) => {
    setRefreshing(true);
    try {
      await whatsappOfficialService.refreshHealth(channelId);
      addToast('success', 'Dados da conta atualizados com a Meta.');
      await loadData(selectedChannelId, days, usagePage);
    } catch (error) {
      setRefreshing(false);
      addToast('error', error instanceof Error ? error.message : 'Erro ao atualizar a conta.');
    }
  };

  const channelOptions = useMemo(() => ([
    { value: '', label: 'Todos os números' },
    ...(overview?.channels ?? []).map((c) => ({
      value: c.id,
      label: c.whatsappOfficial.verifiedName || c.whatsappOfficial.displayPhoneNumber || c.name,
    })),
  ]), [overview?.channels]);

  const templateTotals = useMemo(() => {
    const templates = overview?.templates ?? {};
    const approved = templates.APPROVED ?? 0;
    const pending = (templates.PENDING ?? 0) + (templates.IN_APPEAL ?? 0);
    const rejected = templates.REJECTED ?? 0;
    const total = Object.values(templates).reduce((acc, v) => acc + v, 0);
    return { approved, pending, rejected, total };
  }, [overview?.templates]);

  const metaBilledSummary = useMemo(() => {
    if (!metaBilled) return null;
    const byCategory = new Map<string, { volume: number; cost: number }>();
    let totalCost = 0;
    let totalVolume = 0;
    for (const point of metaBilled) {
      const category = (point.pricing_category ?? 'unknown').toLowerCase();
      const entry = byCategory.get(category) ?? { volume: 0, cost: 0 };
      entry.volume += point.volume ?? 0;
      entry.cost += point.cost ?? 0;
      byCategory.set(category, entry);
      totalCost += point.cost ?? 0;
      totalVolume += point.volume ?? 0;
    }
    const rows = [...byCategory.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.cost - a.cost);
    return { rows, totalCost, totalVolume };
  }, [metaBilled]);

  if (loading && !overview) {
    return <PageLoader message="Carregando painel da API Oficial..." />;
  }

  const channels = overview?.channels ?? [];
  const usage = overview?.usage;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">API Oficial do WhatsApp</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Status da conta, qualidade do número, consumo e custos da WhatsApp Business Platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-40">
            <Dropdown options={[{ value: '7', label: 'Últimos 7 dias' }, { value: '30', label: 'Últimos 30 dias' }, { value: '90', label: 'Últimos 90 dias' }]} value={days} onChange={setDays} />
          </div>
          {channels.length > 1 && (
            <div className="w-48">
              <Dropdown options={channelOptions} value={selectedChannelId} onChange={setSelectedChannelId} />
            </div>
          )}
        </div>
      </div>

      {channels.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={28} />}
          title="Nenhuma conta oficial conectada"
          description="Conecte sua conta do WhatsApp Business Platform para acompanhar qualidade, consumo e custos por aqui."
          action={{ label: 'Conectar API Oficial', onClick: () => router.push('/channels') }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {channels.map((channel) => {
              const config = channel.whatsappOfficial;
              const quality = QUALITY_BADGE[config.qualityRating ?? 'UNKNOWN'] ?? QUALITY_BADGE.UNKNOWN!;
              const pendencies: string[] = [];
              if (config.businessVerificationStatus && config.businessVerificationStatus !== 'verified') {
                pendencies.push('Verificação da empresa pendente na Meta — limite inicial de 250 destinatários/24h.');
              }
              if (config.nameStatus && !['APPROVED', 'AVAILABLE_WITHOUT_REVIEW'].includes(config.nameStatus)) {
                pendencies.push('Nome de exibição aguardando aprovação da Meta.');
              }
              if (config.qualityRating === 'RED') {
                pendencies.push('Qualidade baixa: reduza envios de marketing para evitar restrições.');
              }
              return (
                <Card key={channel.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center shrink-0">
                        <BadgeCheck size={22} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-800 dark:text-white truncate">{config.verifiedName || channel.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{config.displayPhoneNumber ?? '—'}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" icon={<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />} onClick={() => handleRefreshChannel(channel.id)}>
                      Atualizar
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge type={quality.type} text={quality.text} />
                    {config.messagingLimitTier && (
                      <Badge type="processing" text={`Limite: ${config.messagingLimitTier.replace('TIER_', '')} destinatários/24h`} />
                    )}
                    {config.businessVerificationStatus === 'verified' ? (
                      <Badge type="success" text="Empresa verificada" />
                    ) : (
                      <Badge type="warning" text="Verificação pendente" />
                    )}
                    {config.nameStatus === 'APPROVED' && <Badge type="success" text="Nome aprovado" />}
                  </div>

                  {pendencies.length > 0 && (
                    <div className="space-y-1.5">
                      {pendencies.map((pendency, i) => (
                        <p key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg px-3 py-2">
                          <ShieldAlert size={14} className="shrink-0 mt-0.5" /> {pendency}
                        </p>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {usage && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              <MetricCard title="Mensagens enviadas" value={String(usage.totalMessages)} icon={<MessageSquareText size={18} className="text-indigo-500" />} hint={`Últimos ${overview?.periodDays} dias`} />
              <MetricCard title="Entregues" value={String(usage.delivery.delivered)} icon={<CheckCheck size={18} className="text-emerald-500" />} />
              <MetricCard title="Lidas" value={String(usage.delivery.read)} icon={<Eye size={18} className="text-blue-500" />} />
              <MetricCard title="Falhas" value={String(usage.delivery.failed)} icon={<XCircle size={18} className="text-rose-500" />} />
              <MetricCard title="Custo estimado" value={usage.totalEstimatedCostFormatted} icon={<CircleDollarSign size={18} className="text-amber-500" />} hint={`${usage.totalBillable} mensagens cobradas · pago à Meta`} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">Consumo por categoria</h3>
              {usage && usage.byCategory.length > 0 ? (
                <div className="space-y-3">
                  {usage.byCategory.map((item) => (
                    <div key={item.category} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">{CATEGORY_LABELS[item.category] ?? item.category}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-slate-400 dark:text-slate-500 text-xs">{item.count} msgs ({item.billableCount} cobradas)</span>
                        <span className="font-semibold text-slate-800 dark:text-white">{formatBrlFromMicros(item.estimatedCostMicros)}</span>
                      </span>
                    </div>
                  ))}
                  <p className="text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700">
                    Mensagens livres na janela de 24h e templates de utilidade na janela são gratuitos. A cobrança real é feita pela Meta diretamente na sua conta (Gerenciador de Negócios).
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500">Nenhum consumo no período.</p>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">Faturado pela Meta</h3>
                <Badge type="success" text="Dado oficial da Meta" pill />
              </div>
              {metaBilledSummary && metaBilledSummary.rows.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {metaBilledSummary.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {metaBilledSummary.totalVolume} mensagens cobradas · últimos {overview?.periodDays} dias
                      </p>
                    </div>
                  </div>
                  {metaBilledSummary.rows.map((row) => (
                    <div key={row.category} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">{CATEGORY_LABELS[row.category] ?? row.category}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-slate-400 dark:text-slate-500 text-xs">{row.volume} msgs</span>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {row.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </span>
                    </div>
                  ))}
                  <p className="text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700">
                    Valores retornados pela própria Meta (pricing_analytics do WABA), na moeda de cobrança da conta.
                    A cobrança é feita pela Meta no método de pagamento do Gerenciador de Negócios — pode levar algumas horas para refletir aqui.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Nenhuma cobrança da Meta no período — mensagens na janela de atendimento de 24h são gratuitas.
                </p>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">Templates</h3>
                <Link href="/templates" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  <LayoutTemplate size={14} /> Gerenciar
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-3">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{templateTotals.approved}</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">Aprovados</p>
                </div>
                <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-3">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{templateTotals.pending}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">Em análise</p>
                </div>
                <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-3">
                  <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">{templateTotals.rejected}</p>
                  <p className="text-xs text-rose-700 dark:text-rose-400">Reprovados</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600 p-3">
                  <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{templateTotals.total}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">Histórico de utilização</h3>
            {usageHistory.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">Nenhuma mensagem enviada pela API Oficial ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
                      <th className="py-2 pr-4 font-semibold">Data</th>
                      <th className="py-2 pr-4 font-semibold">Tipo</th>
                      <th className="py-2 pr-4 font-semibold">Categoria</th>
                      <th className="py-2 pr-4 font-semibold">Status</th>
                      <th className="py-2 pr-4 font-semibold text-right">Custo est.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageHistory.map((record) => (
                      <tr key={record.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                        <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(record.sentAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-700 dark:text-slate-300">
                          {record.kind === 'TEMPLATE' ? `Template${record.templateName ? `: ${record.templateName}` : ''}` : 'Mensagem livre'}
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge type={record.category === 'marketing' ? 'instagram' : record.category === 'service' ? 'success' : 'processing'} text={CATEGORY_LABELS[record.category] ?? record.category} pill />
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge type={record.status === 'failed' ? 'error' : record.status === 'read' ? 'success' : 'neutral'} text={record.status === 'failed' ? 'Falhou' : record.status === 'read' ? 'Lida' : record.status === 'delivered' ? 'Entregue' : 'Enviada'} pill />
                        </td>
                        <td className="py-2.5 pr-4 text-right font-medium text-slate-800 dark:text-white whitespace-nowrap">
                          {record.billable === false ? 'Grátis' : formatBrlFromMicros(record.estimatedCostMicros)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {usageTotal > USAGE_PAGE_SIZE && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {usagePage * USAGE_PAGE_SIZE + 1}–{Math.min((usagePage + 1) * USAGE_PAGE_SIZE, usageTotal)} de {usageTotal}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />} disabled={usagePage === 0} onClick={() => changeUsagePage(usagePage - 1)}>
                    Anterior
                  </Button>
                  <Button variant="ghost" size="sm" icon={<ChevronRight size={14} />} disabled={(usagePage + 1) * USAGE_PAGE_SIZE >= usageTotal} onClick={() => changeUsagePage(usagePage + 1)}>
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
