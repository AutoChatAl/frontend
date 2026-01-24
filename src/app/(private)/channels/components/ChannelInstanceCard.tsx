'use client';

import { RefreshCw, Trash2, Wifi } from 'lucide-react';
import { type ReactNode } from 'react';

import Card from '@/components/Card';

interface ChannelInstanceCardProps {
  id: string | number;
  icon: ReactNode;
  title: string;
  subtitle: string;
  status: 'connected' | 'disconnected';
  statusLabel?: string;
  colorClass: 'emerald' | 'fuchsia';
  onRefresh?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
}

export default function ChannelInstanceCard({
  id,
  icon,
  title,
  subtitle,
  status,
  statusLabel,
  colorClass,
  onRefresh,
  onDelete,
}: ChannelInstanceCardProps) {
  const colorStyles = {
    emerald: {
      refresh: 'hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50',
    },
    fuchsia: {
      refresh: 'hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:bg-fuchsia-50',
    },
  };

  const styles = colorStyles[colorClass];

  return (
    <Card className="p-6 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4 pt-2">
        {icon}
        <div
          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
            status === 'connected'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800'
          }`}
        >
          {status === 'connected' ? 'Online' : 'Desconectado'}
        </div>
      </div>
      <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{subtitle}</p>

      <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-50 dark:border-slate-700 pt-4">
        <span className="flex items-center gap-1">
          <Wifi
            size={14}
            className={
              status === 'connected'
                ? 'text-emerald-500 dark:text-emerald-400'
                : 'text-rose-400 dark:text-rose-400'
            }
          />
          {statusLabel || (status === 'connected' ? 'Sincronizado' : 'Dessincronizado')}
        </span>
      </div>

      <div className="absolute top-0.5 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={() => onRefresh?.(id)}
          className={`p-1.5 text-slate-400 dark:text-slate-500 ${styles.refresh} dark:hover:bg-slate-700 rounded-lg`}
        >
          <RefreshCw size={16} />
        </button>
        <button
          onClick={() => onDelete?.(id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </Card>
  );
}
