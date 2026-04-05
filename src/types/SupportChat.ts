export type SupportChatStatus = 'OPEN' | 'WAITING_USER' | 'WAITING_AGENT' | 'CLOSED';
export type SupportChatSenderType = 'VISITOR' | 'ADMIN' | 'SYSTEM';

export interface SupportChatConversation {
  id: string;
  workspaceId: string;
  visitorName: string;
  visitorEmail: string;
  status: SupportChatStatus;
  assignedUserId?: string | null;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  lastMessageSenderType?: SupportChatSenderType | null;
  unreadByAdminCount: number;
  unreadByVisitorCount: number;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportChatPublicConversation extends SupportChatConversation {
  visitorToken: string;
}

export interface SupportChatMessage {
  id: string;
  supportChatId: string;
  workspaceId: string;
  senderType: SupportChatSenderType;
  senderUserId?: string | null;
  body?: string | null;
  imageBase64?: string | null;
  imageMimeType?: string | null;
  readByAdminAt?: string | null;
  readByVisitorAt?: string | null;
  createdAt: string;
}

export interface SupportChatSummary {
  openCount: number;
  unreadCount: number;
}

export interface SupportChatSendMessageInput {
  body?: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface SupportChatListFilters {
  status?: SupportChatStatus | 'ALL';
  search?: string;
}
