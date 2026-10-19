'use client';
import { useMemo } from 'react';

import { useClickOverview } from '@/app/(private)/journey/hooks';
import Button from '@/components/Button';
import Card from '@/components/Card';
import CardEmptyState from '@/components/CardEmptyState';
import MetricCard from '@/components/MetricCard';
import SectionHeader from '@/components/SectionHeader';
import { SkeletonCards, SkeletonStats } from '@/components/Skeleton';

import BreakdownCard, { type BreakdownItem } from './BreakdownCard';
import DailyClicksChart from './DailyClicksChart';
import { formatCount, sourceLabel } from './meta';
import RecentClicksList from './RecentClicksList';

interface ClicksOverviewProps {
  onOpenContact: (contactId: string) => void;
}

function toItems(rows: { key: string; count: number }[], label: (key: string) => string): BreakdownItem[] {
  return rows.map((row) => ({ key: row.key, label: label(row.key), count: row.count }));
}

export default function ClicksOverview({ onOpenContact }: ClicksOverviewProps) {
  const { summary, recent, loading, error, reload } = useClickOverview();

  const breakdowns = useMemo(() => {
    if (!summary) return null;
    return {
      sources: toItems(summary.sources, sourceLabel),
      targets: toItems(summary.targets, (key) => key),
    };
  }, [summary]);

  return (
    <div className="space-y-3">
      {loading && !summary && (
        <div className="space-y-3">
          <SkeletonStats count={4} />
          <SkeletonCards count={3} />
        </div>
      )}

      {error && !summary && (
        <div className="flex h-48 flex-col items-center justify-center gap-4">
          <p className="text-sm font-medium text-red-500">{error}</p>
          <Button size="sm" onClick={reload}>
            Tentar novamente
          </Button>
        </div>
      )}

      {summary && breakdowns && (
        <div className={`space-y-3 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            <MetricCard title="Links enviados" value={formatCount(summary.linksSent)} hint={`nos últimos ${summary.days} dias`} />
            <MetricCard title="Cliques" value={formatCount(summary.humanClicks)} hint="feitos por pessoas" />
            <MetricCard title="Contatos que clicaram" value={formatCount(summary.uniqueContacts)} hint="pessoas diferentes" />
            <MetricCard title="Robôs filtrados" value={formatCount(summary.botClicks)} hint="prévias de link e robôs" />
          </div>

          <Card className="p-4">
            <SectionHeader title="Cliques por dia" hint="Só acessos de pessoas — prévias de link não entram na conta" />
            {summary.humanClicks === 0 ? (
              <CardEmptyState message="Nenhum clique no período" />
            ) : (
              <DailyClicksChart data={summary.daily} />
            )}
          </Card>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            <BreakdownCard title="Origem do envio" items={breakdowns.sources} total={summary.humanClicks} />
            <BreakdownCard title="Destinos mais clicados" items={breakdowns.targets} total={summary.humanClicks} />
          </div>

          <RecentClicksList clicks={recent} onOpenContact={onOpenContact} />
        </div>
      )}
    </div>
  );
}
