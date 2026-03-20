'use client';

import {
  Send,
  MessageSquare,
  CheckCheck,
  Users,
  Wifi,
  Megaphone,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { dashboardService, type DashboardMetrics } from '@/services/dashboard.service';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
}

function MetricCard({ title, value, icon: Icon, color, bgColor }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${bgColor}`}>
        <Icon size={20} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">
          {value.toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  );
}

function MiniChart({
  data,
  dataKey,
  color,
}: {
  data: { date: string; sent: number; received: number; read: number }[];
  dataKey: 'sent' | 'received' | 'read';
  color: string;
}) {
  if (!data.length) return null;

  const values = data.map((d) => d[dataKey]);
  const max = Math.max(...values, 1);

  const weekday = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  };

  const BAR_HEIGHT = 112;

  return (
    <div>
      <div className="flex items-end gap-1.5 w-full" style={{ height: BAR_HEIGHT }}>
        {data.map((d, i) => {
          const val = d[dataKey];
          const px = Math.max(Math.round((val / max) * BAR_HEIGHT), 3);
          return (
            <div
              key={i}
              className="flex-1 group relative"
              style={{ minWidth: 0 }}
            >
              <div
                className={`w-full rounded-t-sm ${color} opacity-80 hover:opacity-100 transition-all cursor-pointer`}
                style={{ height: `${px}px` }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                {weekday(d.date)}: {val}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-slate-400 dark:text-slate-500 truncate">
            {weekday(d.date)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getMetrics();
      setMetrics(data);
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

  const totalSent7d = daily7.reduce((sum, d) => sum + d.sent, 0);
  const totalReceived7d = daily7.reduce((sum, d) => sum + d.received, 0);
  const totalRead7d = daily7.reduce((sum, d) => sum + (d.read ?? 0), 0);

  const first3 = daily7.slice(0, 3);
  const last3 = daily7.slice(-3);
  const sentFirst3 = first3.reduce((s, d) => s + d.sent, 0);
  const sentLast3 = last3.reduce((s, d) => s + d.sent, 0);
  const sentTrend = sentFirst3 > 0 ? ((sentLast3 - sentFirst3) / sentFirst3 * 100) : 0;
  const recFirst3 = first3.reduce((s, d) => s + d.received, 0);
  const recLast3 = last3.reduce((s, d) => s + d.received, 0);
  const recTrend = recFirst3 > 0 ? ((recLast3 - recFirst3) / recFirst3 * 100) : 0;
  const readFirst3 = first3.reduce((s, d) => s + (d.read ?? 0), 0);
  const readLast3 = last3.reduce((s, d) => s + (d.read ?? 0), 0);
  const readTrend = readFirst3 > 0 ? ((readLast3 - readFirst3) / readFirst3 * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Visão Geral</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Métricas dos últimos 7 dias do seu workspace
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Mensagens Enviadas"
          value={metrics.messagesSent}
          icon={Send}
          color="text-indigo-600 dark:text-indigo-400"
          bgColor="bg-indigo-50 dark:bg-indigo-900/30"
        />
        <MetricCard
          title="Mensagens Recebidas"
          value={metrics.messagesReceived}
          icon={MessageSquare}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-50 dark:bg-emerald-900/30"
        />
        <MetricCard
          title="Mensagens Lidas"
          value={metrics.messagesRead ?? 0}
          icon={CheckCheck}
          color="text-sky-600 dark:text-sky-400"
          bgColor="bg-sky-50 dark:bg-sky-900/30"
        />
        <MetricCard
          title="Contatos"
          value={metrics.totalContacts}
          icon={Users}
          color="text-violet-600 dark:text-violet-400"
          bgColor="bg-violet-50 dark:bg-violet-900/30"
        />
        <MetricCard
          title="Canais Ativos"
          value={metrics.activeChannels}
          icon={Wifi}
          color="text-sky-600 dark:text-sky-400"
          bgColor="bg-sky-50 dark:bg-sky-900/30"
        />
        <MetricCard
          title="Campanhas"
          value={metrics.totalCampaigns}
          icon={Megaphone}
          color="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-50 dark:bg-amber-900/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">Mensagens Enviadas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Últimos 7 dias</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-slate-800 dark:text-white">
                {totalSent7d.toLocaleString('pt-BR')}
              </p>
              {sentTrend !== 0 && (
                <div className={`flex items-center gap-1 text-xs justify-end ${sentTrend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {sentTrend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span>{Math.abs(sentTrend).toFixed(0)}% tendência</span>
                </div>
              )}
            </div>
          </div>
          <MiniChart data={daily7} dataKey="sent" color="bg-indigo-500" />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">Mensagens Recebidas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Últimos 7 dias</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-slate-800 dark:text-white">
                {totalReceived7d.toLocaleString('pt-BR')}
              </p>
              {recTrend !== 0 && (
                <div className={`flex items-center gap-1 text-xs justify-end ${recTrend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {recTrend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span>{Math.abs(recTrend).toFixed(0)}% tendência</span>
                </div>
              )}
            </div>
          </div>
          <MiniChart data={daily7} dataKey="received" color="bg-emerald-500" />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">Mensagens Lidas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Últimos 7 dias</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-slate-800 dark:text-white">
                {totalRead7d.toLocaleString('pt-BR')}
              </p>
              {readTrend !== 0 && (
                <div className={`flex items-center gap-1 text-xs justify-end ${readTrend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {readTrend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span>{Math.abs(readTrend).toFixed(0)}% tendência</span>
                </div>
              )}
            </div>
          </div>
          <MiniChart data={daily7} dataKey="read" color="bg-sky-500" />
        </div>
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
    </div>
  );
}
