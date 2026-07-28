'use client';
import { Plus, RefreshCw, Search } from 'lucide-react';

import Button from '@/components/Button';
import Select from '@/components/Select';
import type { ChannelType, LeadOrigin, LeadTemperature } from '@/types/Funnel';

import { ORIGIN_META, TEMPERATURE_META, TEMPERATURE_ORDER } from './meta';

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

const ORIGIN_OPTIONS = (Object.keys(ORIGIN_META) as LeadOrigin[]).map((value) => ({
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
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por nome, telefone ou @usuário..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
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
        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
        title="Atualizar"
      >
        <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
      </button>

      <Button variant="secondary" size="sm" icon={<Plus size={15} />} onClick={onNewStage}>
        Nova etapa
      </Button>
    </div>
  );
}
