import type { ClickBrowser, ClickDevice, ClickInApp, ClickOs, JourneyOrderEvent, SiteEventType } from '@/types/Journey';
import { formatBRLFromCents } from '@/utils/billing';

export const DEVICE_LABELS: Record<ClickDevice, string> = {
  MOBILE: 'Celular',
  TABLET: 'Tablet',
  DESKTOP: 'Computador',
  UNKNOWN: 'Não identificado',
};

export const OS_LABELS: Record<ClickOs, string> = {
  IOS: 'iOS',
  ANDROID: 'Android',
  WINDOWS: 'Windows',
  MACOS: 'macOS',
  LINUX: 'Linux',
  OTHER: 'Outro',
};

export const BROWSER_LABELS: Record<ClickBrowser, string> = {
  CHROME: 'Chrome',
  SAFARI: 'Safari',
  FIREFOX: 'Firefox',
  EDGE: 'Edge',
  SAMSUNG: 'Samsung Internet',
  OPERA: 'Opera',
  OTHER: 'Outro navegador',
};

export const IN_APP_LABELS: Record<ClickInApp, string> = {
  INSTAGRAM: 'Dentro do Instagram',
  FACEBOOK: 'Dentro do Facebook',
  TIKTOK: 'Dentro do TikTok',
  LINKEDIN: 'Dentro do LinkedIn',
};

const SOURCE_LABELS: Record<string, string> = {
  campaign: 'Campanha',
  auto_reply: 'Automação',
  scheduling: 'Agendamento',
  cart_recovery: 'Recuperação de vendas',
  ai: 'Atendente de IA',
  comment_automation: 'Automação de comentários',
  flow: 'Fluxo',
  manual: 'Envio manual',
  support: 'Suporte',
};

export const SITE_EVENT_LABELS: Record<SiteEventType, string> = {
  PAGE_VIEW: 'Página vista',
  CLICK: 'Clique no site',
  CUSTOM: 'Evento do site',
};

export type OrderTone = 'positive' | 'negative' | 'pending';

export const ORDER_EVENT_META: Record<JourneyOrderEvent, { label: string; tone: OrderTone }> = {
  CART_ABANDONED: { label: 'Abandonou o carrinho', tone: 'pending' },
  PAYMENT_PENDING: { label: 'Gerou o pagamento', tone: 'pending' },
  PAYMENT_DELAYED: { label: 'Pagamento atrasado', tone: 'pending' },
  APPROVED: { label: 'Pagamento aprovado', tone: 'positive' },
  COMPLETED: { label: 'Compra concluída', tone: 'positive' },
  CANCELED: { label: 'Pedido cancelado', tone: 'negative' },
  EXPIRED: { label: 'Pagamento expirou', tone: 'negative' },
  REFUND_REQUESTED: { label: 'Pediu reembolso', tone: 'negative' },
  REFUNDED: { label: 'Reembolsado', tone: 'negative' },
  CHARGEBACK: { label: 'Chargeback', tone: 'negative' },
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

export function formatLocation(city: string | null, region: string | null, country: string | null): string {
  const parts = [city, region].filter((part): part is string => !!part);
  if (parts.length > 0) return country && country !== 'BR' ? `${parts.join(', ')} · ${country}` : parts.join(', ');
  return country ?? 'Local não identificado';
}

export function formatMoney(cents: number, currency: string | null): string {
  try {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: currency || 'BRL' });
  } catch {
    return formatBRLFromCents(cents);
  }
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDayHeading(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

export function formatShortDate(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function formatCount(value: number): string {
  return value.toLocaleString('pt-BR');
}
