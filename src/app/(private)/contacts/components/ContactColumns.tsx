'use client';

import { MessageCircle, Smartphone } from 'lucide-react';
import React, { type ReactNode } from 'react';

import Badge from '@/components/Badge';
import type { Contact } from '@/types/Contact';

export const columns = [
  {
    header: 'Nome / Identificação',
    accessor: 'name' as keyof Contact,
    render: (value: unknown) => {
      const v = value as string;
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs border border-slate-200 dark:border-slate-600">
            {v.charAt(0)}
          </div>
          <span className="font-medium text-slate-900 dark:text-white">{v}</span>
        </div>
      );
    },
  },
  {
    header: 'Contato',
    accessor: 'contact' as keyof Contact,
    className: 'text-slate-600 dark:text-slate-300 font-mono text-xs',
  },
  {
    header: 'Canais',
    accessor: 'channels' as keyof Contact,
    render: (value: unknown) => {
      const channels = value as string[];
      return (
        <div className="flex gap-1">
          {channels.includes('whatsapp') && (
            <div
              className="p-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              title="WhatsApp"
            >
              <MessageCircle size={14} />
            </div>
          )}
          {channels.includes('instagram') && (
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
    render: (value: unknown) => {
      const tags = value as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {tags.length > 0 ? (
            tags.map((tag, i) => <Badge key={i} type="tag" text={tag} />)
          ) : (
            <span className="text-slate-400 text-xs italic">Sem tags</span>
          )}
        </div>
      );
    },
  },
  {
    header: 'Última Interação',
    accessor: 'lastInteraction' as keyof Contact,
    className: 'text-slate-500 dark:text-slate-400 text-xs',
  },
] as const satisfies Array<{
  header: string;
  accessor: keyof Contact;
  className?: string;
  render?: (value: unknown, row: Contact) => ReactNode;
}>;
