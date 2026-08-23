'use client';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import Card from '@/components/Card';
import Sparkline from '@/components/Sparkline';
import { useTheme } from '@/contexts/ThemeContext';
import { dashboardService, type DashboardMetrics, type BillingMetrics } from '@/services/dashboard.service';

import AiUsageCard from './components/AiUsageCard';
import MessagesAreaChart, { MESSAGE_SERIES, seriesColor, type MessageSeriesKey } from './components/MessagesAreaChart';
import MessagesSummaryCard from './components/MessagesSummaryCard';
import RevenueAreaChart, { type RevenuePoint } from './components/RevenueAreaChart';
import UpcomingCampaignsCard from './components/UpcomingCampaignsCard';

/** Preenche os últimos `n` dias (chave YYYY-MM-DD local) com os dados existentes. */
function fillLastDays(rows: BillingMetrics['dailyRevenue'], n: number): RevenuePoint[] {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const filled: RevenuePoint[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const key = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');
    const row = byDate.get(key);
    filled.push({ date: key, revenueCents: row?.revenueCents ?? 0, count: row?.count ?? 0 });
  }
  return filled;
}

interface MetricCardProps {
    title: string;
    /** Número é formatado em pt-BR; string entra pronta (ex.: valor em moeda). */
    value: number | string;
    /** Evolução diária para o sparkline (omitido = card sem mini-gráfico). */
    spark?: number[];
    sparkColor?: string;
    /** Reserva a altura do sparkline para alinhar com cards vizinhos que têm gráfico. */
    reserveSpark?: boolean;
    /** Linha de contexto exibida abaixo do número. */
    hint?: string;
    /** Classes extras (ex.: col-span no grid). */
    className?: string;
}
function MetricCard({ title, value, spark, sparkColor, reserveSpark, hint, className }: MetricCardProps) {
  return (<Card className={`p-3 sm:p-3.5 min-w-0 flex flex-col ${className ?? ''}`}>
    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{title}</p>
    {spark && sparkColor
      ? (<div className="mt-2 flex-1"><Sparkline data={spark} color={sparkColor} height={36}/></div>)
      : reserveSpark
        ? (<div className="mt-2 flex-1 min-h-9" aria-hidden/>)
        : null}
    <p className="mt-1.5 text-xl sm:text-2xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white truncate">
      {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
    </p>
    {hint && (<p className="mt-0.5 text-[11px] tabular-nums text-slate-400 dark:text-slate-500 truncate">{hint}</p>)}
  </Card>);
}
function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
export default function DashboardPage() {
  const { darkMode } = useTheme();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [billing, setBilling] = useState<BillingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Séries visíveis no gráfico de origem — todas ativas no início.
  const [activeSeries, setActiveSeries] = useState<MessageSeriesKey[]>(['aiSent', 'manualSent', 'automatedSent']);
  useEffect(() => {
    loadMetrics();
  }, []);
  async function loadMetrics() {
    try {
      setLoading(true);
      setError(null);
      const [data, billingData] = await Promise.all([
        dashboardService.getMetrics(),
        dashboardService.getBillingMetrics().catch(() => null),
      ]);
      setMetrics(data);
      setBilling(billingData);
    }
    catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Erro ao carregar métricas');
      }
      else {
        setError('Erro ao carregar métricas');
      }
    }
    finally {
      setLoading(false);
    }
  }
  if (loading) {
    return (<div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto"/>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Carregando métricas...</p>
      </div>
    </div>);
  }
  if (error || !metrics) {
    return (<div className="flex items-center justify-center h-64">
      <div className="text-center">
        <AlertCircle size={40} className="text-red-400 mx-auto"/>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{error || 'Erro desconhecido'}</p>
        <button onClick={loadMetrics} className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
            Tentar novamente
        </button>
      </div>
    </div>);
  }
  if (!metrics.daily || !Array.isArray(metrics.daily)) {
    return (<div className="flex items-center justify-center h-64">
      <div className="text-center">
        <AlertCircle size={40} className="text-red-400 mx-auto"/>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Dados de métricas inválidos</p>
        <button onClick={loadMetrics} className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
            Tentar novamente
        </button>
      </div>
    </div>);
  }
  const daily7 = metrics.daily.slice(-7);
  const originTotals: Record<MessageSeriesKey, number> = {
    aiSent: metrics.aiSent ?? 0,
    manualSent: metrics.manualSent ?? 0,
    automatedSent: metrics.automatedSent ?? 0,
  };
  const toggleSeries = (key: MessageSeriesKey) => {
    setActiveSeries((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };
  return (<div className="w-full max-w-full space-y-3">
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Visão Geral</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
            Métricas do seu workspace
        </p>
      </div>
      <span className="hidden sm:inline-flex items-center shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md px-2.5 py-1">
        Últimos 7 dias
      </span>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 sm:gap-3">
      {MESSAGE_SERIES.map((s) => (<MetricCard key={s.key} title={s.label} value={originTotals[s.key]} spark={daily7.map((d) => d[s.key] ?? 0)} sparkColor={seriesColor(s, darkMode)}/>))}
      <div className="lg:col-span-2">
        <AiUsageCard />
      </div>
    </div>

    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2.5 mb-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Origem dos envios</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mensagens enviadas pela IA, manualmente e por automações por dia
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-1" role="group" aria-label="Séries visíveis no gráfico">
          {MESSAGE_SERIES.map((s) => {
            const active = activeSeries.includes(s.key);
            return (<button key={s.key} type="button" onClick={() => toggleSeries(s.key)} aria-pressed={active} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${active
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs dark:shadow-none'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${active ? '' : 'bg-slate-300 dark:bg-slate-600'}`} {...(active ? { style: { backgroundColor: seriesColor(s, darkMode) } } : {})}/>
              <span className="sm:hidden">{s.shortLabel}</span>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="font-semibold tabular-nums">{originTotals[s.key].toLocaleString('pt-BR')}</span>
            </button>);
          })}
        </div>
      </div>
      <MessagesAreaChart data={daily7} height={240} visibleKeys={activeSeries}/>
    </Card>

    <div className="grid gap-2 sm:gap-3 lg:grid-cols-2">
      <MessagesSummaryCard sent={metrics.messagesSent} received={metrics.messagesReceived} read={metrics.messagesRead ?? 0}/>
      <UpcomingCampaignsCard />
    </div>

    {metrics.messagesFailed > 0 && (<div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg p-3.5 flex items-start gap-3">
      <AlertCircle size={16} className="text-red-500 dark:text-red-400 mt-0.5 shrink-0"/>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-red-700 dark:text-red-400">
          {metrics.messagesFailed.toLocaleString('pt-BR')} mensagens falharam no envio
        </p>
        <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
            Verifique a conexão dos canais e tente reenviar as campanhas afetadas.
        </p>
      </div>
    </div>)}

    {billing && (() => {
      const revenue30 = fillLastDays(billing.dailyRevenue, 30);
      const avgTicketCents = billing.totalCompleted > 0 ? Math.round(billing.totalRevenueCents / billing.totalCompleted) : 0;
      const bestDay = revenue30.reduce((best, d) => (d.revenueCents > best.revenueCents ? d : best), { date: '', revenueCents: 0, count: 0 });
      const bestDayLabel = bestDay.revenueCents > 0
        ? new Date(bestDay.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '')
        : '—';
      const hasRevenue = billing.totalRevenueCents > 0;
      const topProducts = billing.revenueByProduct.slice(0, 5);
      const extraProducts = billing.revenueByProduct.length - topProducts.length;
      const summaryRows: { label: string; sub?: string; value: string }[] = [
        { label: 'Agendamentos concluídos', value: billing.totalCompleted.toLocaleString('pt-BR') },
        { label: 'Ticket médio', sub: 'por agendamento', value: formatCurrency(avgTicketCents) },
        { label: 'Melhor dia', sub: bestDayLabel, value: formatCurrency(bestDay.revenueCents) },
        { label: 'Produtos com vendas', value: billing.revenueByProduct.length.toLocaleString('pt-BR') },
      ];
      return (<div className="grid gap-2 sm:gap-3 lg:grid-cols-5 pt-1">
        <Card className="p-4 sm:p-5 lg:col-span-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Faturamento</h2>
            <span className="shrink-0 text-[11px] font-medium text-slate-400 dark:text-slate-500">Últimos 30 dias</span>
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white truncate">
            {formatCurrency(billing.totalRevenueCents)}
          </p>
          {hasRevenue && (<p className="mt-0.5 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
            média de {formatCurrency(Math.round(billing.totalRevenueCents / 30))}/dia
          </p>)}
          <div className="mt-3">
            {hasRevenue ? (<RevenueAreaChart data={revenue30} height={148}/>) : (<div className="h-[148px] flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-200 dark:border-slate-700 text-center px-4">
              <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Nenhuma receita nos últimos 30 dias</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Agendamentos concluídos com produto aparecem aqui automaticamente.</p>
              <Link href="/scheduling" className="mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                  Ver agendamentos
              </Link>
            </div>)}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 lg:col-span-2 h-full flex flex-col">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Resumo</h2>
          <div className="flex-1 flex flex-col divide-y divide-slate-100 dark:divide-slate-700/60">
            {summaryRows.map((row) => (<div key={row.label} className="flex-1 flex items-center justify-between gap-3 py-2 min-w-0">
              <div className="min-w-0">
                <p className="text-[13px] text-slate-600 dark:text-slate-400 truncate">{row.label}</p>
                {row.sub && (<p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{row.sub}</p>)}
              </div>
              <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white shrink-0">{row.value}</p>
            </div>))}
          </div>
        </Card>

        {topProducts.length > 0 && (<Card className="p-4 sm:p-5 lg:col-span-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Produtos mais vendidos</h2>
            <span className="shrink-0 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
              {billing.revenueByProduct.length.toLocaleString('pt-BR')} produto{billing.revenueByProduct.length > 1 ? 's' : ''} no período
            </span>
          </div>
          <div>
            {topProducts.map((item, i) => {
              const share = billing.totalRevenueCents > 0 ? Math.round((item.totalCents / billing.totalRevenueCents) * 100) : 0;
              return (<div key={item.productId} className="flex items-center gap-3 py-2.5 border-b last:border-0 border-slate-100 dark:border-slate-700/60 min-w-0">
                <span className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-semibold shrink-0 ${i === 0
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'}`}>
                  {i + 1}º
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">{item.productName}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{item.count.toLocaleString('pt-BR')} agendamento{item.count > 1 ? 's' : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(item.totalCents)}</p>
                  <p className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">{share}% da receita</p>
                </div>
              </div>);
            })}
            {extraProducts > 0 && (<p className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 text-center">
              + {extraProducts.toLocaleString('pt-BR')} outro{extraProducts > 1 ? 's' : ''} produto{extraProducts > 1 ? 's' : ''} com vendas
            </p>)}
          </div>
        </Card>)}
      </div>);
    })()}
  </div>);
}
