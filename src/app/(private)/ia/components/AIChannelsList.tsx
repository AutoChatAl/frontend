'use client';

import { Bot } from 'lucide-react';

import AIChannelCard from './AIChannelCard';

import Card from '@/components/Card';
import type { AIChannel } from '@/types/AI';

interface AIChannelsListProps {
  channels: AIChannel[];
  onToggleChannel: (id: string) => void;
}

export default function AIChannelsList({ channels, onToggleChannel }: AIChannelsListProps) {
  const activeCount = channels.filter((c) => c.active).length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Canais Ativos</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie onde a IA deve responder automaticamente.</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-medium border border-indigo-100 dark:border-indigo-800 flex items-center gap-1">
          <Bot size={12} />
          {activeCount} Ativos
        </div>
      </div>

      <div className="space-y-4">
        {channels.map((channel) => (
          <AIChannelCard key={channel.id} channel={channel} onToggle={onToggleChannel} />
        ))}
      </div>
    </Card>
  );
}
