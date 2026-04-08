'use client';

import {
  Send,
  MessageSquare,
  CheckCheck,
  Users,
  Wifi,
  Megaphone,
  AlertCircle,
  DollarSign,
  CalendarCheck,
  Package,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { authService } from '@/services/auth.service';
import { dashboardService, type DashboardMetrics, type BillingMetrics, type CollaboratorMetric } from '@/services/dashboard.service';

import CollaboratorsPieChart, { PIE_PALETTE } from './components/CollaboratorsPieChart';
import CombinedLineChart from './components/CombinedLineChart';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
}

function MetricCard({ title, value, icon: Icon, color, bgColor }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bgColor}`}>
        <Icon size={18} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{title}</p>
        <p className="text-xl font-bold text-slate-800 dark:text-white">
          {value.toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  );
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [billing, setBilling] = useState<BillingMetrics | null>(null);
  const [collabMetrics, setCollabMetrics] = useState<CollaboratorMetric[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = authService.getUser();
  const isOwner = user?.role === 'owner';

  useEffect(() => {
    loadMetrics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMetrics() {
    try {
      setLoading(true);
      setError(null);
      const [data, billingData, collabData] = await Promise.all([
        dashboardService.getMetrics(),
        dashboardService.getBillingMetrics().catch(() => null),
        isOwner ? dashboardService.getCollaboratorsMetrics().catch(() => null) : Promise.resolve(null),
      ]);
      setMetrics(data);
      setBilling(billingData);
      setCollabMetrics(collabData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Erro ao carregar métricas');
      } else {
        setError('Erro ao carregar métricas');
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto" />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{error || 'Erro desconhecido'}</p>
          <button
            onClick={loadMetrics}
            className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!metrics.daily || !Array.isArray(metrics.daily)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto" />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Dados de métricas inválidos</p>
          <button
            onClick={loadMetrics}
            className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const daily7 = metrics.daily.slice(-7);

  const _totalSent7d = daily7.reduce((sum, d) => sum + d.sent, 0);
  const _totalReceived7d = daily7.reduce((sum, d) => sum + d.received, 0);
  const _totalRead7d = daily7.reduce((sum, d) => sum + (d.read ?? 0), 0);

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Visão Geral</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Métricas dos últimos 7 dias do seu workspace
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard title="Mensagens Enviadas" value={metrics.messagesSent} icon={Send} color="text-indigo-600 dark:text-indigo-400" bgColor="bg-indigo-50 dark:bg-indigo-900/30" />
        <MetricCard title="Mensagens Recebidas" value={metrics.messagesReceived} icon={MessageSquare} color="text-emerald-600 dark:text-emerald-400" bgColor="bg-emerald-50 dark:bg-emerald-900/30" />
        <MetricCard title="Mensagens Lidas" value={metrics.messagesRead ?? 0} icon={CheckCheck} color="text-sky-600 dark:text-sky-400" bgColor="bg-sky-50 dark:bg-sky-900/30" />
        <MetricCard title="Contatos" value={metrics.totalContacts} icon={Users} color="text-violet-600 dark:text-violet-400" bgColor="bg-violet-50 dark:bg-violet-900/30" />
        <MetricCard title="Canais Ativos" value={metrics.activeChannels} icon={Wifi} color="text-sky-600 dark:text-sky-400" bgColor="bg-sky-50 dark:bg-sky-900/30" />
        <MetricCard title="Campanhas" value={metrics.totalCampaigns} icon={Megaphone} color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-50 dark:bg-amber-900/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex flex-col">
          <div className="mb-2 shrink-0">
            <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Mensagens — Últimos 7 dias</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Volume de mensagens enviadas, recebidas e lidas na semana
            </p>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <CombinedLineChart data={daily7} />
          </div>
        </div>

        {isOwner && collabMetrics && collabMetrics.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex flex-col">
            <div className="mb-2 shrink-0">
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Envios por Colaborador</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Mensagens enviadas por cada membro
              </p>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <CollaboratorsPieChart
                slices={collabMetrics.map((c, i) => ({
                  name: c.name || c.email,
                  value: c.messagesSent,
                  color: PIE_PALETTE[i % PIE_PALETTE.length] ?? '#6366f1',
                }))}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex flex-col">
            <div className="mb-2 shrink-0">
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Origem dos envios — Últimos 7 dias</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Mensagens enviadas por IA, manualmente e por automações (campanhas/autoresposta)
              </p>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <CollaboratorsPieChart
                slices={[
                  { name: 'Enviadas pela IA', value: metrics.aiSent ?? 0, color: '#6366f1' },
                  { name: 'Enviadas manualmente', value: metrics.manualSent ?? 0, color: '#10b981' },
                  { name: 'Enviadas por automações', value: metrics.automatedSent ?? 0, color: '#f59e0b' },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {metrics.messagesFailed > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {metrics.messagesFailed.toLocaleString('pt-BR')} mensagens falharam no envio
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
              Verifique a conexão dos canais e tente reenviar as campanhas afetadas.
            </p>
          </div>
        </div>
      )}

      {billing && (
        <>
          <div className="pt-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Faturamento</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Baseado em agendamentos concluídos nos últimos 30 dias
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Agendamentos Concluídos"
              value={billing.totalCompleted}
              icon={CalendarCheck}
              color="text-emerald-600 dark:text-emerald-400"
              bgColor="bg-emerald-50 dark:bg-emerald-900/30"
            />
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-green-50 dark:bg-green-900/30">
                <DollarSign size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">Faturamento Total</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">
                  {formatCurrency(billing.totalRevenueCents)}
                </p>
              </div>
            </div>
            <MetricCard
              title="Produtos com Vendas"
              value={billing.revenueByProduct.length}
              icon={Package}
              color="text-violet-600 dark:text-violet-400"
              bgColor="bg-violet-50 dark:bg-violet-900/30"
            />
          </div>

          {billing.revenueByProduct.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Faturamento por Produto</h3>
              <div className="space-y-3">
                {billing.revenueByProduct.map((item) => {
                  const maxRevenue = billing.revenueByProduct[0]?.totalCents || 1;
                  const pct = Math.round((item.totalCents / maxRevenue) * 100);
                  return (
                    <div key={item.productId}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.productName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{item.count} agend.</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(item.totalCents)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
