'use client';
import Select from '@/components/Select';
import type { WorkspaceChannel } from '@/hooks/WorkspaceChannelsHook';

import { CHANNEL_TYPE_META, KIND_META, type AutomationKind } from './automationMeta';

export type KindFilter = AutomationKind | 'ALL';

interface AutomationFiltersProps {
  kind: KindFilter;
  onKindChange: (kind: KindFilter) => void;
  channelId: string;
  onChannelChange: (channelId: string) => void;
  channels: WorkspaceChannel[];
  counts: Record<KindFilter, number>;
}

const KIND_TABS: { value: KindFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'DM', label: KIND_META.DM.plural },
  { value: 'COMMENT', label: KIND_META.COMMENT.plural },
];

export default function AutomationFilters({
  kind,
  onKindChange,
  channelId,
  onChannelChange,
  channels,
  counts,
}: AutomationFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
        {KIND_TABS.map((tab) => {
          const active = tab.value === kind;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onKindChange(tab.value)}
              aria-pressed={active}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
              <span className={`tabular-nums ${active ? '' : 'text-slate-400 dark:text-slate-500'}`}>
                {counts[tab.value]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="w-56">
        <Select
          size="sm"
          placeholder="Todos os canais"
          clearable
          value={channelId}
          onChange={(value) => onChannelChange(value)}
          onClear={() => onChannelChange('')}
          options={channels.map((channel) => ({
            value: channel.id,
            label: channel.name,
            description: CHANNEL_TYPE_META[channel.type].label,
          }))}
        />
      </div>
    </div>
  );
}
