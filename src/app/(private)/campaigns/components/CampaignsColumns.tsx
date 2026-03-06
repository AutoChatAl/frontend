'use client';

import { MessageCircle, Smartphone } from 'lucide-react';
import React, { type ReactNode } from 'react';

import Badge from '@/components/Badge';
import { type Campaign } from '@/types/Campaign';

export const columns = [
  {
    header: 'Nome da Campanha',
    accessor: 'name' as keyof Campaign,
    render: (_value: unknown, row: Campaign) => (
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{row.name}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {new Date(row.createdAt).toLocaleDateString('pt-BR')}
        </p>
      </div>
    ),
  },
  {
    header: 'Canais',
    accessor: 'channels' as keyof Campaign,
    render: (_value: unknown, row: Campaign) => (
      <div className="flex gap-2">
        {row.channels && row.channels.length > 0 ? (
          row.channels.map((ch) => {
            if (!ch.channel) return null;
            return (
              <Badge
                key={ch.channelId}
                type={ch.channel.type.toLowerCase() || 'whatsapp'}
                text={ch.channel.type === 'WHATSAPP' ? 'WhatsApp' : 'Instagram'}
                icon={ch.channel.type === 'WHATSAPP' ? MessageCircle : Smartphone}
              />
            );
          })
        ) : (
          <span className="text-xs text-slate-400">Nenhum canal</span>
        )}
      </div>
    ),
  },
  {
    header: 'Execuções',
    accessor: 'runs' as keyof Campaign,
    className: 'text-slate-700 dark:text-slate-300 font-medium',
    render: (_value: unknown, row: Campaign) => (
      <span>{row.runs ? row.runs.length : 0}</span>
    ),
  },
  {
    header: 'Status',
    accessor: 'status' as keyof Campaign,
    render: (_value: unknown, row: Campaign) => (
      <Badge
        type={
          row.status === 'ACTIVE'
            ? 'success'
            : row.status === 'PAUSED'
              ? 'warning'
              : 'default'
        }
        text={
          row.status === 'ACTIVE'
            ? 'Ativa'
            : row.status === 'PAUSED'
              ? 'Pausada'
              : 'Concluída'
        }
      />
    ),
  },
  {
    header: 'Mensagem',
    accessor: 'message' as keyof Campaign,
    render: (value: unknown) => (
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
        {value as string}
      </p>
    ),
  },
] as const satisfies Array<{
  header: string;
  accessor: keyof Campaign;
  className?: string;
  render?: (value: unknown, row: Campaign) => ReactNode;
}>;
