'use client';

import { MessageCircle, Smartphone } from 'lucide-react';

import type { AIChannel } from '@/types/AI';

interface AIChannelCardProps {
  channel: AIChannel;
  onToggle: (id: string) => void;
}

export default function AIChannelCard({ channel, onToggle }: AIChannelCardProps) {
  const isWhatsApp = channel.type === 'whatsapp';

  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-xl transition-all ${
        channel.active
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

      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium ${channel.active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
          {channel.active ? 'IA Ativa' : 'Desativada'}
        </span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={channel.active} onChange={() => onToggle(channel.id)} className="sr-only peer" />
          <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500"></div>
        </label>
      </div>
    </div>
  );
}
