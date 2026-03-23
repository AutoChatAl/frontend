'use client';

import { Clock, MessageCircle, Smartphone, Users } from 'lucide-react';
import React, { type ReactNode } from 'react';

import Badge from '@/components/Badge';
import { type Campaign } from '@/types/Campaign';

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
      <div className="flex gap-2 flex-wrap">
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
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>
    ),
  },
  {
    header: 'Grupo',
    accessor: 'groups' as keyof Campaign,
    render: (_value: unknown, row: Campaign) => {
      const groups = row.groups ?? [];
      if (groups.length === 0) return <span className="text-xs text-slate-400">—</span>;
      return (
        <div className="flex gap-2 flex-wrap">
          {groups.map((g) => (
            <Badge
              key={g.groupId}
              type="group"
              text={g.group?.name ?? 'Grupo'}
              icon={Users}
            />
          ))}
        </div>
      );
    },
  },
  {
    header: 'Último Disparo',
    accessor: 'runs' as keyof Campaign,
    render: (_value: unknown, row: Campaign) => {
      const runs = row.runs ?? [];
      if (runs.length === 0) return <span className="text-xs text-slate-400">Nunca</span>;
      const sorted = [...runs].sort((a, b) => {
        const dateA = a.startedAt ?? a.scheduledFor;
        const dateB = b.startedAt ?? b.scheduledFor;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      const [last] = sorted;
      if (!last) return <span className="text-xs text-slate-400">Nunca</span>;
      const displayDate = last.startedAt ?? last.scheduledFor;
      return (
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-slate-400" />
          <span className="text-xs text-slate-600 dark:text-slate-400">{formatDate(displayDate)}</span>
        </div>
      );
    },
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
