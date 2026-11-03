import Badge from '@/components/Badge';
import Card from '@/components/Card';
import Illustration from '@/components/Illustration';
import type { ReferralListItem, ReferralStats } from '@/types/Referral';

import { statusBadge, statusDetail } from '../referralStatus';

interface ReferralListProps {
  referrals: ReferralListItem[];
  stats: ReferralStats;
}

export default function ReferralList({ referrals, stats }: ReferralListProps) {
  const summary = [
    { label: 'cadastros', value: stats.registered },
    { label: 'em carência', value: stats.inGrace },
    { label: 'confirmadas', value: stats.qualified },
  ];
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Suas indicações</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Quem criou a conta com o seu código e em que pé está.</p>
        </div>
        {referrals.length > 0 && (
          <p className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
            {summary.map((item) => `${item.value} ${item.label}`).join(' · ')}
          </p>
        )}
      </div>

      {referrals.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center">
            <Illustration src="/referral/empty.png" width={48} height={48} className="max-h-12 w-auto"/>
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            Ninguém usou seu link ainda. Cada negócio que assinar com ele rende 10% de desconto para você.
          </p>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-700">
          {referrals.map((item) => {
            const badge = statusBadge(item);
            return (
              <li key={item.id} className="flex flex-col gap-1.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-slate-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{statusDetail(item)}</p>
                </div>
                <Badge type={badge.type} text={badge.text}/>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
