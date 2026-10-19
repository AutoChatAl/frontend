'use client';
import { BadgeCheck, MessageCircle, Smartphone, Users } from 'lucide-react';
import React, { type ReactNode } from 'react';

import Badge from '@/components/Badge';
import { type Campaign } from '@/types/Campaign';

import RunProgress from './RunProgress';
import { latestRun } from './runSummary';

interface ColumnHandlers {
    /** Clique no progresso abre o histórico de execuções da campanha. */
    onOpenRuns: (campaign: Campaign) => void;
}
export const buildColumns = ({ onOpenRuns }: ColumnHandlers) => [
  {
    header: 'Nome da Campanha',
    accessor: 'name' as keyof Campaign,
    render: (_value: unknown, row: Campaign) => (<div>
      <p className="font-medium text-slate-900 dark:text-white">{row.name}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        {new Date(row.createdAt).toLocaleDateString('pt-BR')}
      </p>
    </div>),
  },
  {
    header: 'Canais',
    accessor: 'channels' as keyof Campaign,
    render: (_value: unknown, row: Campaign) => (<div className="flex gap-2 flex-wrap">
      {row.channels && row.channels.length > 0 ? (row.channels.map((ch) => {
        if (!ch.channel)
          return null;
        const isOfficial = ch.channel.type === 'WHATSAPP_OFFICIAL';
        const isWhatsApp = ch.channel.type === 'WHATSAPP';
        return (<Badge
          key={ch.channelId}
          type={isOfficial || isWhatsApp ? 'whatsapp' : 'instagram'}
          text={isOfficial ? 'WhatsApp Oficial' : isWhatsApp ? 'WhatsApp' : 'Instagram'}
          icon={isOfficial ? BadgeCheck : isWhatsApp ? MessageCircle : Smartphone}
        />);
      })) : (<span className="text-xs text-slate-400">—</span>)}
    </div>),
  },
  {
    header: 'Grupo',
    accessor: 'groups' as keyof Campaign,
    render: (_value: unknown, row: Campaign) => {
      const groups = row.groups ?? [];
      if (groups.length === 0)
        return <span className="text-xs text-slate-400">—</span>;
      return (<div className="flex gap-2 flex-wrap">
        {groups.map((g) => (<Badge key={g.groupId} type="group" text={g.group?.name ?? 'Grupo'} icon={Users}/>))}
      </div>);
    },
  },
  {
    header: 'Último Disparo',
    accessor: 'runs' as keyof Campaign,
    render: (_value: unknown, row: Campaign) => {
      const last = latestRun(row.runs);
      if (!last)
        return <span className="text-xs text-slate-400">Nunca</span>;
      return <RunProgress run={last} onClick={() => onOpenRuns(row)}/>;
    },
  },
  {
    header: 'Status',
    accessor: 'status' as keyof Campaign,
    render: (_value: unknown, row: Campaign) => (<Badge type={row.status === 'ACTIVE'
      ? 'success'
      : row.status === 'PAUSED'
        ? 'warning'
        : 'default'} text={row.status === 'ACTIVE'
      ? 'Ativa'
      : row.status === 'PAUSED'
        ? 'Pausada'
        : 'Concluída'}/>),
  },
  {
    header: 'Mensagem',
    accessor: 'message' as keyof Campaign,
    render: (value: unknown) => (<p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
      {value as string}
    </p>),
  },
] as const satisfies Array<{
    header: string;
    accessor: keyof Campaign;
    className?: string;
    render?: (value: unknown, row: Campaign) => ReactNode;
}>;
