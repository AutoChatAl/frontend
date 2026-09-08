'use client';
import { ChevronLeft, ChevronRight, BadgeCheck, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import TemplateStatusBadge from '@/app/(private)/templates/components/TemplateStatusBadge';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';
import CardEmptyState from '@/components/CardEmptyState';
import Dropdown from '@/components/Dropdown';
import EmptyState from '@/components/EmptyState';
import MetricCard, { type MetricTrend } from '@/components/MetricCard';
import { SkeletonCards, SkeletonPage, SkeletonStats } from '@/components/Skeleton';
import { ToastContainer, useToast } from '@/components/Toast';
import { templateService } from '@/services/template.service';
import { whatsappOfficialService } from '@/services/whatsapp-official.service';
import { formatBrlFromMicros, type WaMetaBilledPoint, type WaOfficialOverview, type WaUsageRecord, type WhatsAppTemplate } from '@/types/WhatsAppOfficial';

const USAGE_PAGE_SIZE = 10;
const TEMPLATES_PREVIEW = 4;

const CATEGORY_LABELS: Record<string, string> = {
  marketing: 'Marketing',
  utility: 'Utilidade',
  authentication: 'Autenticação',
  service: 'Atendimento (grátis)',
  referral_conversion: 'Anúncio (grátis)',
  unknown: 'Outros',
};

const TEMPLATE_CATEGORY_LABELS: Record<string, string> = {
  MARKETING: 'Marketing',
  UTILITY: 'Utilidade',
  AUTHENTICATION: 'Autenticação',
};

const QUALITY_BADGE: Record<string, { type: string; text: string }> = {
  GREEN: { type: 'success', text: 'Qualidade alta' },
  YELLOW: { type: 'warning', text: 'Qualidade média' },
  RED: { type: 'error', text: 'Qualidade baixa' },
  UNKNOWN: { type: 'neutral', text: 'Qualidade pendente' },
};

export default function WhatsAppOfficialDashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<WaOfficialOverview | null>(null);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
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
      const [overviewData, history, templateList] = await Promise.all([
        whatsappOfficialService.getOverview(Number(periodDays), channelId || undefined),
        whatsappOfficialService.getUsageHistory({ ...(channelId ? { channelId } : {}), limit: USAGE_PAGE_SIZE, skip: page * USAGE_PAGE_SIZE }),
        templateService.list(channelId || undefined).catch(() => [] as WhatsAppTemplate[]),
      ]);
      setOverview(overviewData);
      setUsageHistory(history.data);
      setUsageTotal(history.total);
      setTemplates(templateList);

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
    const counts = overview?.templates ?? {};
    const approved = counts.APPROVED ?? 0;
    const pending = (counts.PENDING ?? 0) + (counts.IN_APPEAL ?? 0);
    const rejected = counts.REJECTED ?? 0;
    const total = Object.values(counts).reduce((acc, v) => acc + v, 0);
    return { approved, pending, rejected, total };
  }, [overview?.templates]);

  const recentTemplates = useMemo(() => {
    return [...templates]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, TEMPLATES_PREVIEW);
  }, [templates]);

  // Variação do custo estimado: últimos 7 dias vs os 7 anteriores.
  const costTrend = useMemo((): MetricTrend | undefined => {
    const daily = overview?.usage?.daily ?? [];
    if (Number(days) < 14)
      return undefined;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let current = 0;
    let previous = 0;
    for (const point of daily) {
      const age = (now - new Date(point.date + 'T12:00:00').getTime()) / dayMs;
      if (age <= 7)
        current += point.estimatedCostMicros;
      else if (age <= 14)
        previous += point.estimatedCostMicros;
    }
    if (previous <= 0)
      return undefined;
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0)
      return { label: '0% vs sem. passada', tone: 'neutral' };
    return pct > 0
      ? { label: `+${pct}% vs sem. passada`, tone: 'negative' }
      : { label: `${pct}% vs sem. passada`, tone: 'positive' };
  }, [overview?.usage?.daily, days]);

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
    return <SkeletonPage><SkeletonStats count={4}/><SkeletonCards count={3}/></SkeletonPage>;
  }

  const channels = overview?.channels ?? [];
  const usage = overview?.usage;
  const totalSent = usage?.totalMessages ?? 0;
  const deliveryPct = (value: number) => (totalSent > 0 ? `${Math.round((value / totalSent) * 100)}% das enviadas` : '—');

  return (
    <div className="w-full max-w-full space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">API Oficial do WhatsApp</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
            Status da conta, qualidade do número, consumo e custos
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
          {usage && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
              <MetricCard title="Enviadas" value={totalSent.toLocaleString('pt-BR')} hint={`últimos ${overview?.periodDays} dias`}/>
              <MetricCard title="Entregues" value={usage.delivery.delivered.toLocaleString('pt-BR')} hint={deliveryPct(usage.delivery.delivered)}/>
              <MetricCard title="Lidas" value={usage.delivery.read.toLocaleString('pt-BR')} hint={deliveryPct(usage.delivery.read)}/>
              <MetricCard title="Falhas" value={usage.delivery.failed.toLocaleString('pt-BR')} hint={deliveryPct(usage.delivery.failed)}/>
              <MetricCard title="Custo Estimado" value={usage.totalEstimatedCostFormatted} hint={`${usage.totalBillable.toLocaleString('pt-BR')} cobradas · pago à Meta`} {...(costTrend ? { trend: costTrend } : {})} className="col-span-2 lg:col-span-1"/>
            </div>
          )}

          <div className="grid gap-2 sm:gap-3 lg:grid-cols-3">
            <Card className="p-4 sm:p-5 lg:col-span-2">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Números conectados</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Saúde, limites e verificação de cada número na Meta</p>
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                  {channels.length.toLocaleString('pt-BR')} número{channels.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {channels.map((channel) => {
                  const config = channel.whatsappOfficial;
                  const quality = QUALITY_BADGE[config.qualityRating ?? 'UNKNOWN'] ?? QUALITY_BADGE.UNKNOWN!;
                  const pendencies: string[] = [];
                  if (config.businessVerificationStatus && config.businessVerificationStatus !== 'verified') {
                    pendencies.push('Verificação da empresa pendente na Meta — limite inicial de 250 destinatários/24h.');
                  }
                  if (config.qualityRating === 'RED') {
                    pendencies.push('Qualidade baixa: reduza envios de marketing para evitar restrições.');
                  }
                  return (
                    <div key={channel.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <BadgeCheck size={16} className="text-emerald-600 dark:text-emerald-400"/>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">{config.verifiedName || channel.name}</p>
                            <p className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500 truncate">{config.displayPhoneNumber ?? '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge type={quality.type} text={quality.text} pill/>
                          {config.messagingLimitTier && (
                            <Badge type="processing" text={`${config.messagingLimitTier.replace('TIER_', '')}/24h`} pill/>
                          )}
                          {config.businessVerificationStatus === 'verified'
                            ? (<Badge type="success" text="Verificada" pill/>)
                            : (<Badge type="warning" text="Verificação pendente" pill/>)}
                        </div>
                        <Button variant="ghost" size="sm" icon={<RefreshCw size={13} className={refreshing ? 'animate-spin' : ''}/>} onClick={() => handleRefreshChannel(channel.id)}>
                          Atualizar
                        </Button>
                      </div>
                      {pendencies.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {pendencies.map((pendency, i) => (
                            <p key={i} className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-md px-2.5 py-1.5">
                              <ShieldAlert size={12} className="shrink-0 mt-0.5"/> {pendency}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-4 sm:p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Templates</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">Modelos aprovados pela Meta</p>
                </div>
                <Link href="/templates" className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                  Ver todos
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tabular-nums bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-full px-2 py-0.5">
                  {templateTotals.approved} aprovados
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tabular-nums bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 rounded-full px-2 py-0.5">
                  {templateTotals.pending} em análise
                </span>
                {templateTotals.rejected > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tabular-nums bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 rounded-full px-2 py-0.5">
                    {templateTotals.rejected} reprovados
                  </span>
                )}
              </div>

              {recentTemplates.length === 0 ? (
                <CardEmptyState message="Nenhum template ainda." action={
                  <Link href="/templates" className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                    Criar template
                  </Link>
                }/>
              ) : (
                <div className="flex-1 flex flex-col justify-start">
                  {recentTemplates.map((template) => (
                    <Link key={template.id} href="/templates" className="flex items-center justify-between gap-3 py-2 border-b last:border-0 border-slate-100 dark:border-slate-700/60 min-w-0 rounded-sm hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">{template.name}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                          {template.language} · {TEMPLATE_CATEGORY_LABELS[template.category] ?? template.category}
                        </p>
                      </div>
                      <TemplateStatusBadge status={template.status}/>
                    </Link>
                  ))}
                  {templateTotals.total > recentTemplates.length && (
                    <Link href="/templates" className="pt-2 text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-center">
                      + {(templateTotals.total - recentTemplates.length).toLocaleString('pt-BR')} outros templates
                    </Link>
                  )}
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-2 sm:gap-3 lg:grid-cols-2">
            <Card className="p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Consumo por categoria</h2>
              {usage && usage.byCategory.length > 0 ? (
                <div className="space-y-2.5">
                  {usage.byCategory.map((item) => (
                    <div key={item.category} className="flex items-center justify-between gap-3 min-w-0">
                      <span className="text-[13px] text-slate-600 dark:text-slate-300 truncate">{CATEGORY_LABELS[item.category] ?? item.category}</span>
                      <span className="flex items-baseline gap-3 shrink-0">
                        <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">{item.count} msgs ({item.billableCount} cobradas)</span>
                        <span className="text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">{formatBrlFromMicros(item.estimatedCostMicros)}</span>
                      </span>
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    Mensagens livres na janela de 24h e templates de utilidade na janela são gratuitos. A cobrança real é feita pela Meta diretamente na sua conta.
                  </p>
                </div>
              ) : (
                <CardEmptyState message="Nenhum consumo no período."/>
              )}
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Faturado pela Meta</h2>
                <Badge type="success" text="Dado oficial da Meta" pill />
              </div>
              {metaBilledSummary && metaBilledSummary.rows.length > 0 ? (
                <div className="space-y-2.5">
                  <div>
                    <p className="text-xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">
                      {metaBilledSummary.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                      {metaBilledSummary.totalVolume} mensagens cobradas · últimos {overview?.periodDays} dias
                    </p>
                  </div>
                  {metaBilledSummary.rows.map((row) => (
                    <div key={row.category} className="flex items-center justify-between gap-3 min-w-0">
                      <span className="text-[13px] text-slate-600 dark:text-slate-300 truncate">{CATEGORY_LABELS[row.category] ?? row.category}</span>
                      <span className="flex items-baseline gap-3 shrink-0">
                        <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">{row.volume} msgs</span>
                        <span className="text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">
                          {row.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </span>
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    Valores retornados pela própria Meta (pricing_analytics do WABA), na moeda de cobrança da conta — pode levar algumas horas para refletir aqui.
                  </p>
                </div>
              ) : (
                <CardEmptyState message="Nenhuma cobrança da Meta no período — mensagens na janela de atendimento de 24h são gratuitas."/>
              )}
            </Card>
          </div>

          <Card className="p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Histórico de utilização</h2>
            {usageHistory.length === 0 ? (
              <CardEmptyState message="Nenhuma mensagem enviada pela API Oficial ainda."/>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-[13px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
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
                        <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
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
                        <td className="py-2.5 pr-4 text-right font-medium tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
                          {record.billable === false ? 'Grátis' : formatBrlFromMicros(record.estimatedCostMicros)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {usageTotal > USAGE_PAGE_SIZE && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <p className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
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
