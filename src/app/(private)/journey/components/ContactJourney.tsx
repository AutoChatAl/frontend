'use client';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useJourneyContacts, useJourneyTimeline } from '@/app/(private)/journey/hooks';
import Card from '@/components/Card';
import CardEmptyState from '@/components/CardEmptyState';
import Input from '@/components/Input';
import { SkeletonRows } from '@/components/Skeleton';
import { getInitials } from '@/utils/displayName';
import { formatRelativeTime } from '@/utils/relativeTime';

import JourneyTimelineView from './JourneyTimelineView';
import { formatCount } from './meta';

interface ContactJourneyProps {
  selectedContactId: string | null;
  onSelectContact: (contactId: string) => void;
}

const SEARCH_DEBOUNCE_MS = 350;

export default function ContactJourney({ selectedContactId, onSelectContact }: ContactJourneyProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { contacts, loading: contactsLoading, error: contactsError } = useJourneyContacts(debouncedSearch);
  const { timeline, loading: timelineLoading, error: timelineError, reload } = useJourneyTimeline(selectedContactId);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <Card className="flex flex-col p-3 lg:col-span-1">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome ou telefone"
          leftIcon={<Search size={16} />}
          aria-label="Buscar contato"
        />
        <p className="mt-3 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {debouncedSearch ? 'Resultado da busca' : 'Atividade nos últimos 7 dias'}
        </p>
        <div className="mt-1 max-h-128 flex-1 overflow-y-auto">
          {contactsLoading && contacts.length === 0 && <SkeletonRows count={5} />}
          {contactsError && <p className="px-1 py-4 text-[13px] text-red-500">{contactsError}</p>}
          {!contactsLoading && !contactsError && contacts.length === 0 && (
            <CardEmptyState message={debouncedSearch ? 'Nenhum contato encontrado' : 'Nenhum contato com atividade nos últimos 7 dias'} />
          )}
          <ul className="space-y-0.5">
            {contacts.map((contact) => {
              const selected = contact.id === selectedContactId;
              const name = contact.displayName || contact.identifier || 'Sem nome';
              return (
                <li key={contact.id}>
                  <button
                    type="button"
                    onClick={() => onSelectContact(contact.id)}
                    aria-current={selected ? 'true' : undefined}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
                      selected ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {getInitials(name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[13px] font-medium ${selected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>
                        {name}
                      </span>
                      <span className="block truncate text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {formatCount(contact.linkClicks)} {contact.linkClicks === 1 ? 'clique' : 'cliques'} · {formatCount(contact.siteEvents)} no site
                      </span>
                    </span>
                    {contact.lastActivityAt && (
                      <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                        {formatRelativeTime(contact.lastActivityAt)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </Card>

      <Card className="p-4 lg:col-span-2">
        <JourneyTimelineView timeline={timeline} loading={timelineLoading} error={timelineError} onRetry={reload} />
      </Card>
    </div>
  );
}
