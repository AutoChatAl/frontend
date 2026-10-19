import {
  BadgeCheck,
  FileUp,
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

import type {
  AttendanceStatus,
  ChannelType,
  ConversionConfidence,
  LeadOrigin,
  LeadTemperature,
  SourceChannelType,
  StageColor,
} from '@/types/Funnel';
// Reexportado: a versão que vivia aqui cortava emoji e letra decorativa no meio.
export { getInitials } from '@/utils/displayName';
// Reexportado: a conversa (inbox) desenha a etapa com as mesmas cores do quadro.
export { STAGE_COLOR_META, stageColorMeta, type StageColorMeta } from '@/utils/funnelStageColors';
import { formatPhoneNumber } from '@/utils/phone';
import { formatRelativeTime } from '@/utils/relativeTime';

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
  IMPORT: { label: 'Importação', icon: FileUp },
};

/** Quando a API manda origem nula ou um valor que o funil ainda não conhece. */
export const UNKNOWN_ORIGIN_LABEL = 'Não informada';

/**
 * A resposta do funil não é validada na borda: `null` (default do contato) ou
 * um código novo quebraria `ORIGIN_META[value].label` e derrubaria o painel.
 */
export function isKnownLeadOrigin(value: string | null | undefined): value is LeadOrigin {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ORIGIN_META, value);
}

export function leadOriginLabel(value: string | null | undefined): string {
  if (!isKnownLeadOrigin(value)) return UNKNOWN_ORIGIN_LABEL;
  return ORIGIN_META[value].label;
}

/**
 * Origens oferecidas no funil. O contato pode carregar outras (importação,
 * campanha, carrinho), mas essas três são as que fazem sentido escolher aqui —
 * é por elas que um lead entra em contato.
 */
export const FUNNEL_ORIGIN_OPTIONS: LeadOrigin[] = ['WHATSAPP', 'INSTAGRAM', 'COMMENT'];

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

/**
 * O canal do negócio por onde o lead entrou. O oficial ganha ícone próprio para
 * não ser confundido com o WhatsApp conectado por QR Code.
 */
export const SOURCE_CHANNEL_META: Record<SourceChannelType, { label: string; icon: LucideIcon; className: string }> = {
  WHATSAPP: {
    label: 'WhatsApp',
    icon: MessageCircle,
    className: 'text-emerald-600 dark:text-emerald-400',
  },
  WHATSAPP_OFFICIAL: {
    label: 'WhatsApp Oficial',
    icon: BadgeCheck,
    className: 'text-emerald-600 dark:text-emerald-400',
  },
  INSTAGRAM: {
    label: 'Instagram',
    icon: Instagram,
    className: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
};

export const CONFIDENCE_META: Record<ConversionConfidence, { label: string; short: string }> = {
  high: { label: 'amostra grande, taxa estável', short: 'alta confiança' },
  medium: { label: 'amostra média, taxa ainda oscila', short: 'confiança média' },
  low: { label: 'amostra pequena, trate como ordem de grandeza', short: 'baixa confiança' },
};

/**
 * `@usuario` passa direto; número brasileiro ganha máscara de leitura. Qualquer
 * outro formato volta como veio — melhor mostrar cru que mascarar errado.
 */
export function formatIdentifier(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith('@')) return value;
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) return formatPhoneNumber(digits);
  return value;
}

export const STAGE_COLOR_OPTIONS: StageColor[] = ['indigo', 'violet', 'blue', 'emerald', 'amber', 'rose', 'fuchsia', 'slate'];

export function formatRelative(iso: string | null): string {
  if (!iso) return 'Sem interação';
  return formatRelativeTime(iso);
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
