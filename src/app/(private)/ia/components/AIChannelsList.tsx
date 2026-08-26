'use client';
import Link from 'next/link';

import Card from '@/components/Card';
import CardEmptyState from '@/components/CardEmptyState';
import SectionHeader from '@/components/SectionHeader';
import { useSubscription } from '@/contexts/SubscriptionContext';
import type { AIChannel } from '@/types/AI';

import AIChannelCard from './AIChannelCard';

interface AIChannelsListProps {
    channels: AIChannel[];
    onToggle: (id: string) => Promise<void>;
}
export default function AIChannelsList({ channels, onToggle }: AIChannelsListProps) {
  const { status } = useSubscription();
  const maxAiChannels = status?.limits?.maxAiChannels ?? 0;
  const activeCount = channels.filter((ch) => ch.active).length;
  // Sem cota sobrando, ligar mais um canal só devolveria erro do backend — melhor travar antes.
  const limitReached = maxAiChannels > 0 && activeCount >= maxAiChannels;
  return (
    <Card className="p-4">
      <SectionHeader
        title="Canais atendidos pela IA"
        hint={maxAiChannels > 1
          ? `Escolha até ${maxAiChannels} canais onde a IA responde sozinha. Nos demais, as mensagens continuam só com você.`
          : 'Escolha o canal onde a IA responde sozinha. Nos demais, as mensagens continuam só com você.'}
        action={
          <span className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold tabular-nums text-slate-600 dark:border-slate-700 dark:text-slate-300">
            {maxAiChannels > 0 ? `${activeCount}/${maxAiChannels} ativos` : `${activeCount} ativos`}
          </span>
        }
      />

      {channels.length === 0 ? (
        <CardEmptyState
          message="Nenhum canal conectado ainda."
          action={
            <Link href="/channels" className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
              Conectar WhatsApp ou Instagram
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {channels.map((channel) => (
            <AIChannelCard
              key={channel.id}
              channel={channel}
              active={channel.active}
              onToggle={onToggle}
              blocked={limitReached && !channel.active}
              blockedReason={`Seu plano de IA permite ${maxAiChannels} ${maxAiChannels === 1 ? 'canal ativo' : 'canais ativos'}. Desligue outro canal para liberar este.`}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
