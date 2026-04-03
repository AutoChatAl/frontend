'use client';

import { MessageCircle, Smartphone } from 'lucide-react';
import React, { type ReactNode } from 'react';

import Badge from '@/components/Badge';
import type { Contact } from '@/types/Contact';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0)
    return 'Hoje, ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return d.toLocaleDateString('pt-BR');
}

export const columns = [
  {
    header: 'Nome',
    accessor: 'displayName' as keyof Contact,
    render: (_value: unknown, row: Contact) => {
      const name = row.displayName || 'Sem nome';
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-xs shrink-0">
            {getInitials(name) || '?'}
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="font-medium text-slate-900 dark:text-white">{name}</span>
            {row.awaitingHuman && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-[10px] font-semibold text-red-700 dark:text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                Aguardando atendimento
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    header: 'Identificador',
    accessor: 'identities' as keyof Contact,
    render: (_value: unknown, row: Contact) => {
      const identities = row.identities ?? [];
      if (identities.length === 0)
        return <span className="text-xs text-slate-400 italic">Sem identificador</span>;
      return (
        <div className="flex flex-col gap-0.5">
          {identities.map((identity, i) => (
            <span key={i} className="text-xs font-mono text-slate-600 dark:text-slate-300">
              {identity.phoneE164 ?? identity.igUsername ?? '—'}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    header: 'Canais',
    accessor: 'identities' as keyof Contact,
    render: (_value: unknown, row: Contact) => {
      const identities = row.identities ?? [];
      const hasWA = identities.some((i) => i.type === 'WHATSAPP');
      const hasIG = identities.some((i) => i.type === 'INSTAGRAM');
      if (!hasWA && !hasIG)
        return <span className="text-xs text-slate-400 italic">Nenhum</span>;
      return (
        <div className="flex gap-1.5">
          {hasWA && (
            <div
              className="p-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              title="WhatsApp"
            >
              <MessageCircle size={14} />
            </div>
          )}
          {hasIG && (
            <div
              className="p-1.5 rounded-full bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400"
              title="Instagram"
            >
              <Smartphone size={14} />
            </div>
          )}
        </div>
      );
    },
  },
  {
    header: 'Tags',
    accessor: 'tags' as keyof Contact,
    render: (_value: unknown, row: Contact) => {
      const tags = row.tags ?? [];
      return (
        <div className="flex flex-wrap gap-1">
          {tags.length > 0 ? (
            tags.map((t) =>
              t.tag.name === 'Aguardando atendimento' ? (
                <Badge key={t.tagId} type="error" text={t.tag.name} />
              ) : (
                <Badge key={t.tagId} type="tag" text={t.tag.name} />
              ),
            )
          ) : (
            <span className="text-slate-400 text-xs italic">Sem tags</span>
          )}
        </div>
      );
    },
  },
  {
    header: 'Última Interação',
    accessor: 'lastInteractionAt' as keyof Contact,
    className: 'text-slate-500 dark:text-slate-400 text-xs',
    render: (_value: unknown, row: Contact) => <span>{formatDate(row.lastInteractionAt)}</span>,
  },
] as const satisfies Array<{
  header: string;
  accessor: keyof Contact;
  className?: string;
  render?: (value: unknown, row: Contact) => ReactNode;
}>;
