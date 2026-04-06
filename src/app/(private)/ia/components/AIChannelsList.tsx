'use client';

import { Bot } from 'lucide-react';

import Card from '@/components/Card';
import type { AIChannel } from '@/types/AI';

import AIChannelCard from './AIChannelCard';

interface AIChannelsListProps {
  channels: AIChannel[];
  onToggle: (id: string) => Promise<void>;
}

export default function AIChannelsList({ channels, onToggle }: AIChannelsListProps) {
  const activeCount = channels.filter((ch) => ch.active).length;

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Canais Ativos</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Selecione o canal onde a IA deve responder automaticamente.</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-medium border border-indigo-100 dark:border-indigo-800 flex items-center gap-1 self-start sm:self-auto shrink-0">
          <Bot size={12} />
          {activeCount > 0 ? `${activeCount} Ativo${activeCount > 1 ? 's' : ''}` : '0 Ativos'}
        </div>
      </div>

      {channels.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
          Nenhum canal conectado. Conecte um canal de WhatsApp ou Instagram primeiro.
        </p>
      ) : (
        <div className="space-y-4">
          {channels.map((channel) => (
            <AIChannelCard
              key={channel.id}
              channel={channel}
              active={channel.active}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
