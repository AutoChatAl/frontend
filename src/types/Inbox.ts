export type InboxChannelType = 'WHATSAPP' | 'INSTAGRAM';
export type InboxDirection = 'IN' | 'OUT';
export type MessageDeliveryStatus = 'SENT' | 'DELIVERED' | 'READ';
export type MessageMediaType = 'image' | 'audio' | 'video' | 'document';

export interface InboxConversation {
  id: string;
  workspaceId: string;
  contactId: string;
  channelId: string;
  channelType: InboxChannelType;
  contactName?: string | null;
  contactIdentifier?: string | null;
  avatarUrl?: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
  lastMessageDirection: InboxDirection;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InboxMessage {
  id: string;
  conversationId: string;
  contactId: string;
  channelId: string;
  channelType: InboxChannelType;
  direction: InboxDirection;
  body: string;
  mediaType?: MessageMediaType | null;
  mediaUrl?: string | null;
  mediaBase64?: string | null;
  mediaMimeType?: string | null;
  mediaFileName?: string | null;
  sentByAi?: boolean;
  sentByAutomation?: boolean;
  /** Transcrição do áudio, exibida sob demanda — o balão continua mostrando o áudio. */
  transcription?: string | null;
  deliveryStatus?: MessageDeliveryStatus;
  replyToMessageId?: string | null;
  replyToPreview?: string | null;
  replyToDirection?: InboxDirection | null;
  readAt?: string | null;
  createdAt: string;
  /** Somente no cliente: mensagem otimista aguardando confirmação do envio. */
  pending?: boolean;
}

export interface InboxOutgoingMedia {
  mediaType: MessageMediaType;
  base64: string;
  mimeType: string;
  fileName?: string;
}

export interface InboxListFilters {
  channelType?: InboxChannelType;
  search?: string;
}
