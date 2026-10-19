'use client';
import Card from '@/components/Card';
import CardEmptyState from '@/components/CardEmptyState';
import SectionHeader from '@/components/SectionHeader';

import { formatCount } from './meta';

export interface BreakdownItem {
  key: string;
  label: string;
  count: number;
}

interface BreakdownCardProps {
  title: string;
  hint?: string;
  items: BreakdownItem[];
  total: number;
}

export default function BreakdownCard({ title, hint, items, total }: BreakdownCardProps) {
  return (
    <Card className="flex flex-col p-4">
      <SectionHeader title={title} hint={hint} />
      {items.length === 0 ? (
        <CardEmptyState message="Sem cliques no período" />
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const share = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <li key={item.key}>
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="truncate text-slate-700 dark:text-slate-300" title={item.label}>
                    {item.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
                    {formatCount(item.count)}
                    <span className="text-slate-400 dark:text-slate-500"> · {share}%</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(share, 1)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
