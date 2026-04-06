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

const LINE_COLORS = {
  sent: '#6366f1', // indigo
  received: '#10b981', // emerald
  read: '#0ea5e9', // sky
};

const LINE_LABELS: Record<string, string> = {
  sent: 'Mensagens Enviadas',
  received: 'Mensagens Recebidas',
  read: 'Mensagens Lidas',
};

function formatAxisValue(val: number): string {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  return String(val);
}

function CombinedLineChart({
  data,
}: {
  data: { date: string; sent: number; received: number; read: number }[];
}) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    day: string;
    sent: number;
    received: number;
    read: number;
  } | null>(null);

  if (!data.length) return null;

  const weekday = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  };

  const fullDay = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  };

  const allValues = data.flatMap((d) => [d.sent, d.received, d.read ?? 0]);
  const max = Math.max(...allValues, 1);

  const CHART_W = 460;
  const CHART_H = 170;
  const PAD_L = 32;
  const PAD_R = 8;
  const PAD_T = 10;
  const PAD_B = 18;
  const plotW = CHART_W - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;

  const getX = (i: number) => PAD_L + (i / (data.length - 1 || 1)) * plotW;
  const getY = (val: number) => PAD_T + plotH - (val / max) * plotH;

  const makePath = (key: 'sent' | 'received' | 'read') => {
    return data
      .map((d, i) => {
        const x = getX(i);
        const y = getY(d[key] ?? 0);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const gridLines = 4;
  const gridYs = Array.from({ length: gridLines + 1 }, (_, i) => ({
    y: PAD_T + (i / gridLines) * plotH,
    val: Math.round(max - (i / gridLines) * max),
  }));

  return (
    <div>
      {/* Chart */}
      <div className="relative w-full" style={{ aspectRatio: `${CHART_W}/${CHART_H}` }}>
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Grid */}
          {gridYs.map((g, i) => (
            <g key={i}>
              <line
                x1={PAD_L}
                y1={g.y}
                x2={CHART_W - PAD_R}
                y2={g.y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700"
                strokeWidth={0.5}
              />
              <text
                x={PAD_L - 4}
                y={g.y + 3}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500"
                fontSize={8}
              >
                {formatAxisValue(g.val)}
              </text>
            </g>
          ))}

          {/* X axis labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={getX(i)}
              y={CHART_H - 3}
              textAnchor="middle"
              className="fill-slate-400 dark:fill-slate-500"
              fontSize={8}
            >
              {weekday(d.date)}
            </text>
          ))}

          {/* Lines */}
          {(['sent', 'received', 'read'] as const).map((key) => (
            <path
              key={key}
              d={makePath(key)}
              fill="none"
              stroke={LINE_COLORS[key]}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Dots */}
          {(['sent', 'received', 'read'] as const).map((key) =>
            data.map((d, i) => (
              <circle
                key={`${key}-${i}`}
                cx={getX(i)}
                cy={getY(d[key] ?? 0)}
                r={2.5}
                fill={LINE_COLORS[key]}
                stroke="white"
                strokeWidth={1}
              />
            )),
          )}

          {/* Invisible hover zones */}
          {data.map((d, i) => {
            const x = getX(i);
            const hitW = plotW / data.length;
            return (
              <rect
                key={i}
                x={x - hitW / 2}
                y={PAD_T}
                width={hitW}
                height={plotH}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() =>
                  setTooltip({
                    x,
                    y: PAD_T,
                    day: fullDay(d.date),
                    sent: d.sent,
                    received: d.received,
                    read: d.read ?? 0,
                  })
                }
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}

          {/* Vertical hover indicator */}
          {tooltip && (
            <line
              x1={tooltip.x}
              y1={PAD_T}
              x2={tooltip.x}
              y2={PAD_T + plotH}
              stroke="currentColor"
              className="text-slate-300 dark:text-slate-600"
              strokeWidth={1}
              strokeDasharray="4 2"
              pointerEvents="none"
            />
          )}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-20 bg-slate-800 dark:bg-slate-900 text-white rounded-lg shadow-lg px-3 py-2 pointer-events-none"
            style={{
              left: `${(tooltip.x / CHART_W) * 100}%`,
              top: '0',
              transform: 'translateX(-50%)',
              minWidth: '170px',
            }}
          >
            <p className="text-[10px] font-semibold text-slate-300 mb-1 capitalize">{tooltip.day}</p>
            {(['sent', 'received', 'read'] as const).map((key) => (
              <div key={key} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: LINE_COLORS[key] }}
                  />
                  <span className="text-slate-300">{LINE_LABELS[key]}</span>
                </div>
                <span className="font-bold">{tooltip[key].toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend — abaixo do gráfico, centralizada */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mt-3">
        {(['sent', 'received', 'read'] as const).map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: LINE_COLORS[key] }}
            />
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {LINE_LABELS[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Pie Chart: Mensagens por Colaborador ── */

const PIE_PALETTE = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#e11d48', '#7c3aed', '#0ea5e9', '#d946ef', '#22d3ee',
];

interface CollabSlice {
  name: string;
  value: number;
  color: string;
}

function CollaboratorsPieChart({ slices }: { slices: CollabSlice[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-400 dark:text-slate-500">
        Nenhuma mensagem enviada por colaboradores
      </div>
    );
  }

  const VB = 220;
  const CX = VB / 2;
  const CY = VB / 2;
  const R = 90;
  const R_HOVER = 98;

  type ArcData = { startAngle: number; endAngle: number; slice: CollabSlice; idx: number };
  const arcs: ArcData[] = [];
  let angle = -Math.PI / 2;
  slices.forEach((sl, idx) => {
    const sweep = (sl.value / total) * Math.PI * 2;
    arcs.push({ startAngle: angle, endAngle: angle + sweep, slice: sl, idx });
    angle += sweep;
  });

  const arcPath = (startAngle: number, endAngle: number, r: number) => {
    const sweep = endAngle - startAngle;
    if (sweep >= Math.PI * 2 - 0.001) {
      const midAngle = startAngle + Math.PI;
      const x1 = CX + r * Math.cos(startAngle);
      const y1 = CY + r * Math.sin(startAngle);
      const xm = CX + r * Math.cos(midAngle);
      const ym = CY + r * Math.sin(midAngle);
      return `M ${x1} ${y1} A ${r} ${r} 0 1 1 ${xm} ${ym} A ${r} ${r} 0 1 1 ${x1} ${y1} Z`;
    }
    const x1 = CX + r * Math.cos(startAngle);
    const y1 = CY + r * Math.sin(startAngle);
    const x2 = CX + r * Math.cos(endAngle);
    const y2 = CY + r * Math.sin(endAngle);
    const largeArc = sweep > Math.PI ? 1 : 0;
    return `M ${CX} ${CY} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const hovered = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div>
      {/* Pie — tamanho fixo por max-w, centralizado */}
      <div className="flex justify-center">
        <div
          className="relative"
          style={{ width: '60%', maxWidth: 220, minWidth: 120, aspectRatio: '1/1' }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <svg viewBox={`0 0 ${VB} ${VB}`} className="w-full h-full">
            {arcs.map((a) => {
              const isHover = hoveredIdx === a.idx;
              return (
                <path
                  key={a.idx}
                  d={arcPath(a.startAngle, a.endAngle, isHover ? R_HOVER : R)}
                  fill={a.slice.color}
                  opacity={hoveredIdx !== null && !isHover ? 0.5 : 1}
                  stroke="white"
                  strokeWidth={1.5}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredIdx(a.idx)}
                />
              );
            })}
          </svg>

          {hovered && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-slate-800 dark:bg-slate-900 text-white rounded-lg shadow-lg px-3 py-2 text-center max-w-[150px]">
                <p className="text-[10px] text-slate-300 truncate">{hovered.name}</p>
                <p className="text-sm font-bold">{hovered.value.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-slate-400">{((hovered.value / total) * 100).toFixed(1)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend — colada abaixo da pizza, centralizada, scroll se muitos */}
      <div className="mt-3 max-h-[72px] overflow-y-auto">
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
          {slices.map((sl, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 cursor-pointer rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sl.color }} />
              <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[110px]">{sl.name}</span>
            </div>
          ))}
        </div>
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
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Visão Geral</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Métricas dos últimos 7 dias do seu workspace
        </p>
      </div>

      {(() => {
        const showPie = isOwner && collabMetrics && collabMetrics.length > 0;
        return showPie ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <MetricCard title="Mensagens Enviadas" value={metrics.messagesSent} icon={Send} color="text-indigo-600 dark:text-indigo-400" bgColor="bg-indigo-50 dark:bg-indigo-900/30" />
            <MetricCard title="Mensagens Recebidas" value={metrics.messagesReceived} icon={MessageSquare} color="text-emerald-600 dark:text-emerald-400" bgColor="bg-emerald-50 dark:bg-emerald-900/30" />
            <MetricCard title="Mensagens Lidas" value={metrics.messagesRead ?? 0} icon={CheckCheck} color="text-sky-600 dark:text-sky-400" bgColor="bg-sky-50 dark:bg-sky-900/30" />
            <MetricCard title="Contatos" value={metrics.totalContacts} icon={Users} color="text-violet-600 dark:text-violet-400" bgColor="bg-violet-50 dark:bg-violet-900/30" />
            <MetricCard title="Canais Ativos" value={metrics.activeChannels} icon={Wifi} color="text-sky-600 dark:text-sky-400" bgColor="bg-sky-50 dark:bg-sky-900/30" />
            <MetricCard title="Campanhas" value={metrics.totalCampaigns} icon={Megaphone} color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-50 dark:bg-amber-900/30" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard title="Mensagens Enviadas" value={metrics.messagesSent} icon={Send} color="text-indigo-600 dark:text-indigo-400" bgColor="bg-indigo-50 dark:bg-indigo-900/30" />
            <MetricCard title="Mensagens Recebidas" value={metrics.messagesReceived} icon={MessageSquare} color="text-emerald-600 dark:text-emerald-400" bgColor="bg-emerald-50 dark:bg-emerald-900/30" />
            <MetricCard title="Mensagens Lidas" value={metrics.messagesRead ?? 0} icon={CheckCheck} color="text-sky-600 dark:text-sky-400" bgColor="bg-sky-50 dark:bg-sky-900/30" />
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico de Linha */}
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

        {/* Coluna direita: pizza (owner) ou 3 métricas empilhadas */}
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
          <div className="flex flex-col gap-3 w-full">
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
