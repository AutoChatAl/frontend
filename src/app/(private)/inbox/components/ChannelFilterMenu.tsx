'use client';
import { Check, ChevronDown } from 'lucide-react';

import type { InboxChannelOption, InboxChannelType } from '@/types/Inbox';

import { CHANNEL_TYPE_GROUP_LABEL, channelOptionLabel } from '../inboxFilter';
import PopoverMenu from './PopoverMenu';

interface ChannelFilterMenuProps {
    /** Id do canal escolhido; null = todos os canais do tipo marcado nos botões. */
    value: string | null;
    /** Já recortado pelo tipo escolhido nos botões. */
    options: InboxChannelOption[];
    onChange: (channelId: string | null) => void;
}

const TYPE_ORDER: InboxChannelType[] = ['WHATSAPP', 'WHATSAPP_OFFICIAL', 'INSTAGRAM'];

/**
 * Número/conta específico, ao lado da busca. Complementa os botões por tipo logo abaixo:
 * o tipo escolhido lá limita as opções daqui. Agrupa por tipo só quando há mais de um.
 */
export default function ChannelFilterMenu({ value, options, onChange }: ChannelFilterMenuProps) {
  const groups = TYPE_ORDER
    .map((type) => ({ type, channels: options.filter((option) => option.type === type) }))
    .filter((group) => group.channels.length > 0);
  const showGroupLabels = groups.length > 1;
  const selected = options.find((option) => option.id === value) ?? null;
  const active = !!selected;

  const item = (id: string | null, label: string, close: () => void) => {
    const checked = value === id;
    return (
      <button
        key={id ?? 'all'}
        type="button"
        role="menuitemradio"
        aria-checked={checked}
        onClick={() => {
          onChange(id);
          close();
        }}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-[13px] text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50"
      >
        <span className="truncate">{label}</span>
        {checked && <Check size={14} className="shrink-0 text-indigo-600 dark:text-indigo-400"/>}
      </button>
    );
  };

  return (
    <PopoverMenu
      align="end"
      widthClassName="w-64"
      label="Filtrar por número ou conta"
      trigger={(open) => (
        <span className={`flex h-9 max-w-34 items-center gap-1 rounded-lg border px-2.5 text-[13px] transition-colors ${active || open
          ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300'
          : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:text-white'}`}
        >
          <span className="truncate">{selected ? selected.name?.trim() || channelOptionLabel(selected) : 'Canal'}</span>
          <ChevronDown size={14} className="shrink-0"/>
        </span>
      )}
    >
      {(close) => (
        <div className="max-h-80 overflow-y-auto py-1">
          {item(null, 'Todos os canais', close)}
          {groups.map((group) => (
            <div key={group.type} className="mt-1 border-t border-slate-100 pt-1 dark:border-slate-700">
              {showGroupLabels && (
                <p className="px-3 pb-0.5 pt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">{CHANNEL_TYPE_GROUP_LABEL[group.type]}</p>
              )}
              {group.channels.map((channel) => item(channel.id, channelOptionLabel(channel), close))}
            </div>
          ))}
        </div>
      )}
    </PopoverMenu>
  );
}
