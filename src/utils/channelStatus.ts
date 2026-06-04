export type ChannelStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';

const CHANNEL_STATUS_LABELS: Record<ChannelStatus, string> = {
  CONNECTED: 'Conectado',
  CONNECTING: 'Conectando',
  DISCONNECTED: 'Desconectado',
};

const CHANNEL_STATUS_BADGE_CLASSES: Record<ChannelStatus, string> = {
  CONNECTED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  CONNECTING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  DISCONNECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
};

export function getChannelStatusLabel(status: string): string {
  return CHANNEL_STATUS_LABELS[status as ChannelStatus] ?? 'Desconectado';
}

export function getChannelStatusBadgeClasses(status: string): string {
  return CHANNEL_STATUS_BADGE_CLASSES[status as ChannelStatus] ?? CHANNEL_STATUS_BADGE_CLASSES.DISCONNECTED;
}
