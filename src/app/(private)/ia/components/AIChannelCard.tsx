'use client';
import { BadgeCheck, Instagram, MessageCircle } from 'lucide-react';

import Badge from '@/components/Badge';
import ToggleSwitch from '@/components/ToggleSwitch';
import type { AIChannel } from '@/types/AI';

interface AIChannelCardProps {
    channel: AIChannel;
    active: boolean;
    onToggle: (id: string) => void;
    /** Verdadeiro quando o plano já está no limite e este canal está desligado. */
    blocked?: boolean;
    blockedReason?: string | undefined;
    /** Perfil que já atende este canal, quando não é o perfil aberto. */
    heldByProfileName?: string;
}
export default function AIChannelCard({ channel, active, onToggle, blocked = false, blockedReason, heldByProfileName }: AIChannelCardProps) {
  const isOfficial = channel.type === 'whatsapp_official';
  const isWhatsApp = channel.type === 'whatsapp' || isOfficial;
  const Icon = isOfficial ? BadgeCheck : isWhatsApp ? MessageCircle : Instagram;
  const meta = [channel.identifier, channel.ownerName ? `Colaborador: ${channel.ownerName}` : ''].filter(Boolean).join(' · ');
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${
        active
          ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-500/30 dark:bg-indigo-500/5'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
      } ${blocked ? 'opacity-60' : ''}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            isWhatsApp
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-400'
          }`}
        >
          <Icon size={18}/>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">{channel.name}</p>
            <Badge
              type={isWhatsApp ? 'whatsapp' : 'instagram'}
              text={isOfficial ? 'WhatsApp oficial' : isWhatsApp ? 'WhatsApp' : 'Instagram'}
              pill
            />
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {heldByProfileName
              ? `Atendido pelo ${heldByProfileName}`
              : meta || (active ? 'IA respondendo neste canal' : 'IA desligada neste canal')}
          </p>
        </div>
      </div>

      <div className="shrink-0" {...(blocked && blockedReason ? { title: blockedReason } : {})}>
        <ToggleSwitch checked={active} onChange={() => onToggle(channel.id)} disabled={blocked} ariaLabel={`IA no canal ${channel.name}`}/>
      </div>
    </div>
  );
}
