import type { InboxChannelOption, InboxChannelType } from '@/types/Inbox';

/** Nome do grupo de cada tipo no seletor de canal. */
export const CHANNEL_TYPE_GROUP_LABEL: Record<InboxChannelType, string> = {
  WHATSAPP: 'WhatsApp',
  WHATSAPP_OFFICIAL: 'WhatsApp Oficial',
  INSTAGRAM: 'Instagram',
};

/** "Loja Centro · …9901" para número; "@minhaloja" quando o nome não acrescenta nada. */
export function channelOptionLabel(option: InboxChannelOption): string {
  const name = option.name?.trim() || null;
  const identifier = option.identifier?.trim() || null;
  if (option.type === 'INSTAGRAM') {
    if (name && identifier) return `${name} · ${identifier}`;
    return identifier ?? name ?? CHANNEL_TYPE_GROUP_LABEL.INSTAGRAM;
  }
  const digits = identifier?.replace(/\D/g, '') ?? '';
  const tail = digits.length >= 4 ? `…${digits.slice(-4)}` : identifier;
  if (name && tail) return `${name} · ${tail}`;
  return name ?? tail ?? CHANNEL_TYPE_GROUP_LABEL[option.type];
}
