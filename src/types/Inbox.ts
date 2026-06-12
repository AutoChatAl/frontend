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
  deliveryStatus?: MessageDeliveryStatus;
  readAt?: string | null;
  createdAt: string;
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
