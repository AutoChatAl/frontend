'use client';
import Card from '@/components/Card';
import CardEmptyState from '@/components/CardEmptyState';
import SectionHeader from '@/components/SectionHeader';
import type { RecentClick } from '@/types/Journey';
import { getInitials } from '@/utils/displayName';
import { formatRelativeTime } from '@/utils/relativeTime';

import { sourceLabel } from './meta';

interface RecentClicksListProps {
  clicks: RecentClick[];
  onOpenContact: (contactId: string) => void;
}

export default function RecentClicksList({ clicks, onOpenContact }: RecentClicksListProps) {
  return (
    <Card className="p-4">
      <SectionHeader title="Últimos cliques" hint="Quem clicou por último e em qual link" />
      {clicks.length === 0 ? (
        <CardEmptyState message="Nenhum clique ainda" />
      ) : (
        <ul className="-mx-2 divide-y divide-slate-100 dark:divide-slate-700/60">
          {clicks.map((click) => {
            const { contactId } = click;
            const name = click.contactName || (contactId ? 'Sem nome' : 'Contato removido');
            const content = (
              <>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {getInitials(name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-slate-900 dark:text-white">{name}</span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                    {click.target ?? 'Link sem destino'} · {sourceLabel(click.source)}
                    {click.campaign ? ` · ${click.campaign}` : ''}
                  </span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-slate-400 dark:text-slate-500">
                  {formatRelativeTime(click.at)}
                </span>
              </>
            );
            return (
              <li key={click.id}>
                {contactId ? (
                  <button
                    type="button"
                    onClick={() => onOpenContact(contactId)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 px-2 py-2.5">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
