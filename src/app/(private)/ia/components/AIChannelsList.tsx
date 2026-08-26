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
    /** Perfil aberto: o toggle liga o canal neste perfil, e só nele. */
    activeProfileId: string | null;
}
export default function AIChannelsList({ channels, onToggle, activeProfileId }: AIChannelsListProps) {
  const { status } = useSubscription();
  const maxAiChannels = status?.limits?.maxAiChannels ?? 0;
  // A cota do plano é do workspace inteiro, então conta canais ligados em qualquer perfil.
  const activeCount = channels.filter((ch) => ch.active || !!ch.aiProfileId).length;
  // Sem cota sobrando, ligar mais um canal só devolveria erro do backend — melhor travar antes.
  const limitReached = maxAiChannels > 0 && activeCount >= maxAiChannels;
  return (
    <Card className="p-4">
      <SectionHeader
        title="Canais atendidos pela IA"
        hint={maxAiChannels > 1
          ? `Escolha até ${maxAiChannels} canais onde a IA responde sozinha, somando todos os perfis. Um canal só pode pertencer a um perfil.`
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
          {channels.map((channel) => {
            // Canal atendido por outro perfil aparece LIGADO, porque é a verdade: a
            // IA está respondendo por ali. O toque desliga, e só depois disso ele
            // fica livre para ser ativado no perfil aberto — é o caminho de troca.
            const inOtherProfile = !channel.active && !!channel.aiProfileId && channel.aiProfileId !== activeProfileId;
            const showAsActive = channel.active || inOtherProfile;
            // Só a cota do plano trava o botão; desligar nunca é bloqueado.
            const blocked = limitReached && !showAsActive;
            // Dizer de quem é o perfil importa: com o time todo enxergando os
            // mesmos canais, "outro perfil" sem dono não diz a quem pedir.
            const heldBy = channel.aiProfileOwnerName
              ? `${channel.aiProfileName ?? 'outro perfil'} (de ${channel.aiProfileOwnerName})`
              : (channel.aiProfileName ?? 'outro perfil');
            const blockedReason = `Seu plano de IA permite ${maxAiChannels} ${maxAiChannels === 1 ? 'canal ativo' : 'canais ativos'}. Desligue outro canal para liberar este.`;
            return (
              <AIChannelCard
                key={channel.id}
                channel={channel}
                active={showAsActive}
                onToggle={onToggle}
                blocked={blocked}
                blockedReason={blockedReason}
                {...(inOtherProfile && channel.aiProfileName ? { heldByProfileName: heldBy } : {})}
              />
            );
          })}
        </div>
      )}
    </Card>
  );
}
