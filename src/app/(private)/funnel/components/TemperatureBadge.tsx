import type { LeadTemperature } from '@/types/Funnel';

import { TEMPERATURE_META } from './meta';

interface TemperatureBadgeProps {
  temperature: LeadTemperature;
  size?: 'sm' | 'md';
}

export default function TemperatureBadge({ temperature, size = 'sm' }: TemperatureBadgeProps) {
  const meta = TEMPERATURE_META[temperature];
  const Icon = meta.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold ${padding} ${meta.chip}`}>
      <Icon size={size === 'sm' ? 11 : 13} />
      {meta.label}
    </span>
  );
}
