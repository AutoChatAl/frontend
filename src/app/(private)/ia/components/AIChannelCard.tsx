'use client';

import { MessageCircle, Smartphone } from 'lucide-react';

import type { AIChannel } from '@/types/AI';

interface AIChannelCardProps {
  channel: AIChannel;
  active: boolean;
  onToggle: (id: string) => void;
}

export default function AIChannelCard({ channel, active, onToggle }: AIChannelCardProps) {
  const isWhatsApp = channel.type === 'whatsapp';

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 p-3 sm:p-4 border rounded-xl transition-all ${
        active
          ? 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-900 shadow-sm'
          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 opacity-75'
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm ${
            isWhatsApp
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400'
          }`}
        >
          {isWhatsApp ? <MessageCircle size={22} /> : <Smartphone size={22} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-800 dark:text-white">{channel.name}</p>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase ${
                isWhatsApp
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                  : 'bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-100 dark:border-fuchsia-800'
              }`}
            >
              {channel.type}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{channel.identifier}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <span className={`text-xs font-medium ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
          {active ? 'IA Ativa' : 'Desativada'}
        </span>
        <button
          type="button"
          onClick={() => onToggle(channel.id)}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            active
              ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-600 dark:bg-indigo-500'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600'
          }`}
        >
          {active && <div className="w-2 h-2 rounded-full bg-white" />}
        </button>
      </div>
    </div>
  );
}
