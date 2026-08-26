'use client';
import { Plus, RefreshCw, Search } from 'lucide-react';

import Select from '@/components/Select';
import type { ChannelType, LeadOrigin, LeadTemperature } from '@/types/Funnel';

import { FUNNEL_ORIGIN_OPTIONS, ORIGIN_META, TEMPERATURE_META, TEMPERATURE_ORDER } from './meta';

interface FunnelFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  channelType: ChannelType | undefined;
  onChannelChange: (value: ChannelType | undefined) => void;
  origin: LeadOrigin | undefined;
  onOriginChange: (value: LeadOrigin | undefined) => void;
  temperature: LeadTemperature | undefined;
  onTemperatureChange: (value: LeadTemperature | undefined) => void;
  onNewStage: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const CHANNEL_OPTIONS: { value: ChannelType; label: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'INSTAGRAM', label: 'Instagram' },
];

const ORIGIN_OPTIONS = FUNNEL_ORIGIN_OPTIONS.map((value) => ({
  value,
  label: ORIGIN_META[value].label,
}));

const TEMPERATURE_OPTIONS = TEMPERATURE_ORDER.map((value) => ({
  value,
  label: TEMPERATURE_META[value].label,
}));

export default function FunnelFilters({
  search,
  onSearchChange,
  channelType,
  onChannelChange,
  origin,
  onOriginChange,
  temperature,
  onTemperatureChange,
  onNewStage,
  onRefresh,
  refreshing,
}: FunnelFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1 sm:max-w-xs">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por nome, telefone ou @usuário..."
          className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-600"
        />
      </div>

      <div className="w-36">
        <Select<ChannelType>
          size="sm"
          placeholder="Canal"
          clearable
          value={channelType ?? ''}
          onChange={(value) => onChannelChange((value || undefined) as ChannelType | undefined)}
          options={CHANNEL_OPTIONS}
        />
      </div>

      <div className="w-40">
        <Select<LeadOrigin>
          size="sm"
          placeholder="Origem"
          clearable
          value={origin ?? ''}
          onChange={(value) => onOriginChange((value || undefined) as LeadOrigin | undefined)}
          options={ORIGIN_OPTIONS}
        />
      </div>

      <div className="w-40">
        <Select<LeadTemperature>
          size="sm"
          placeholder="Temperatura"
          clearable
          value={temperature ?? ''}
          onChange={(value) => onTemperatureChange((value || undefined) as LeadTemperature | undefined)}
          options={TEMPERATURE_OPTIONS}
        />
      </div>

      <button
        type="button"
        onClick={onRefresh}
        title="Atualizar"
        aria-label="Atualizar o funil"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:hover:text-slate-300"
      >
        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
      </button>

      <button
        type="button"
        onClick={onNewStage}
        className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-200 px-2.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
      >
        <Plus size={13} />
        Nova etapa
      </button>
    </div>
  );
}
