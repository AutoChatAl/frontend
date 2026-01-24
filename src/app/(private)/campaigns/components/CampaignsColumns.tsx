'use client';

import { MessageCircle, Smartphone } from 'lucide-react';
import React, { type ReactNode } from 'react';

import Badge from '@/components/Badge';
import { CampaignStatus, type Campaign } from '@/types/Campaign';

export const columns = [
  {
    header: 'Nome da Campanha',
    accessor: 'name' as keyof Campaign,
    render: (_value: unknown, row: Campaign) => (
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{row.name}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{row.date}</p>
      </div>
    ),
  },
  {
    header: 'Canal',
    accessor: 'channel' as keyof Campaign,
    render: (_value: unknown, row: Campaign) => (
      <Badge
        type={row.channel as string}
        text={row.channel === 'whatsapp' ? 'WhatsApp' : 'Instagram'}
        icon={row.channel === 'whatsapp' ? MessageCircle : Smartphone}
      />
    ),
  },
  {
    header: 'Enviados',
    accessor: 'sent' as keyof Campaign,
    className: 'text-slate-700 dark:text-slate-300 font-medium',
    render: (value: unknown) => (value as number).toLocaleString(),
  },
  {
    header: 'Abertura',
    accessor: 'opened' as keyof Campaign,
    render: (value: unknown) => (
      <div className="flex items-center gap-2">
        <span className="text-slate-700 dark:text-slate-300 font-medium">{value as string}</span>
        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: value as string }}></div>
        </div>
      </div>
    ),
  },
  {
    header: 'Status',
    accessor: 'status' as keyof Campaign,
    render: (_value: unknown, row: Campaign) => (
      <Badge
        type={row.status as CampaignStatus}
        text={
          row.status === CampaignStatus.SUCCESS
            ? 'Concluído'
            : row.status === CampaignStatus.PROCESSING
              ? 'Em processamento'
              : 'Pausado'
        }
      />
    ),
  },
] as const satisfies Array<{
	header: string;
	accessor: keyof Campaign;
	className?: string;
	render?: (value: unknown, row: Campaign) => ReactNode;
}>;
