import {
  Flame,
  Instagram,
  MessageCircle,
  MessageSquare,
  Music2,
  Send,
  ShoppingCart,
  Snowflake,
  Thermometer,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';

import type { AttendanceStatus, ChannelType, LeadOrigin, LeadTemperature, StageColor } from '@/types/Funnel';

export interface TemperatureMeta {
  label: string;
  chip: string;
  dot: string;
  ring: string;
  icon: LucideIcon;
}

export const TEMPERATURE_META: Record<LeadTemperature, TemperatureMeta> = {
  COLD: {
    label: 'Frio',
    chip: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
    dot: 'bg-blue-500',
    ring: 'text-blue-500',
    icon: Snowflake,
  },
  WARM: {
    label: 'Morno',
    chip: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
    dot: 'bg-amber-500',
    ring: 'text-amber-500',
    icon: Thermometer,
  },
  HOT: {
    label: 'Aquecido',
    chip: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20',
    dot: 'bg-orange-500',
    ring: 'text-orange-500',
    icon: Flame,
  },
  ON_FIRE: {
    label: 'Quente',
    chip: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
    dot: 'bg-red-500',
    ring: 'text-red-500',
    icon: Flame,
  },
};

export const TEMPERATURE_ORDER: LeadTemperature[] = ['ON_FIRE', 'HOT', 'WARM', 'COLD'];

export const ORIGIN_META: Record<LeadOrigin, { label: string; icon: LucideIcon }> = {
  WHATSAPP: { label: 'WhatsApp', icon: MessageCircle },
  INSTAGRAM: { label: 'Instagram', icon: Instagram },
  CART_RECOVERY: { label: 'Carrinho', icon: ShoppingCart },
  COMMENT: { label: 'Comentário', icon: MessageSquare },
  CAMPAIGN: { label: 'Campanha', icon: Send },
  MANUAL: { label: 'Manual', icon: UserPlus },
  TIKTOK: { label: 'TikTok', icon: Music2 },
  TELEGRAM: { label: 'Telegram', icon: Send },
};

export const ATTENDANCE_META: Record<AttendanceStatus, { label: string; dot: string }> = {
  OPEN: { label: 'Aberto', dot: 'bg-slate-400' },
  IN_PROGRESS: { label: 'Em andamento', dot: 'bg-blue-500' },
  WAITING: { label: 'Aguardando', dot: 'bg-amber-500' },
  RESOLVED: { label: 'Resolvido', dot: 'bg-emerald-500' },
};

export const CHANNEL_META: Record<ChannelType, { label: string; icon: LucideIcon; className: string }> = {
  WHATSAPP: {
    label: 'WhatsApp',
    icon: MessageCircle,
    className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  INSTAGRAM: {
    label: 'Instagram',
    icon: Instagram,
    className: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
  },
};

export interface StageColorMeta {
  dot: string;
  text: string;
  soft: string;
  bar: string;
}

export const STAGE_COLOR_META: Record<StageColor, StageColorMeta> = {
  indigo: { dot: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', soft: 'bg-indigo-50 dark:bg-indigo-500/10', bar: 'bg-indigo-500' },
  violet: { dot: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400', soft: 'bg-violet-50 dark:bg-violet-500/10', bar: 'bg-violet-500' },
  blue: { dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', soft: 'bg-blue-50 dark:bg-blue-500/10', bar: 'bg-blue-500' },
  emerald: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', soft: 'bg-emerald-50 dark:bg-emerald-500/10', bar: 'bg-emerald-500' },
  amber: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', soft: 'bg-amber-50 dark:bg-amber-500/10', bar: 'bg-amber-500' },
  rose: { dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', soft: 'bg-rose-50 dark:bg-rose-500/10', bar: 'bg-rose-500' },
  fuchsia: { dot: 'bg-fuchsia-500', text: 'text-fuchsia-600 dark:text-fuchsia-400', soft: 'bg-fuchsia-50 dark:bg-fuchsia-500/10', bar: 'bg-fuchsia-500' },
  slate: { dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-300', soft: 'bg-slate-100 dark:bg-slate-700/40', bar: 'bg-slate-400' },
};

export const STAGE_COLOR_OPTIONS: StageColor[] = ['indigo', 'violet', 'blue', 'emerald', 'amber', 'rose', 'fuchsia', 'slate'];

export function stageColorMeta(color: StageColor): StageColorMeta {
  return STAGE_COLOR_META[color] ?? STAGE_COLOR_META.indigo;
}

export function getInitials(name: string | null): string {
  if (!name) return '?';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return initials || '?';
}

export function formatRelative(iso: string | null): string {
  if (!iso) return 'Sem interação';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Agora mesmo';
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 30) return `há ${diffDays} dias`;
  return date.toLocaleDateString('pt-BR');
}

export function formatWaiting(iso: string | null): string | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'agora';
  if (diffMinutes < 60) return `${diffMinutes}min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
