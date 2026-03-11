export interface AutoReply {
  id: string;
  workspaceId: string;
  channelId: string;
  channelType: 'WHATSAPP' | 'INSTAGRAM';
  keyword: string;
  matchMode: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
  caseSensitive: boolean;
  replyMessage: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutoReplyInput {
  channelId: string;
  channelType: 'WHATSAPP' | 'INSTAGRAM';
  keyword: string;
  matchMode?: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
  caseSensitive?: boolean;
  replyMessage: string;
  enabled?: boolean;
}

export interface UpdateAutoReplyInput {
  channelId?: string;
  channelType?: 'WHATSAPP' | 'INSTAGRAM';
  keyword?: string;
  matchMode?: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
  caseSensitive?: boolean;
  replyMessage?: string;
  enabled?: boolean;
}
