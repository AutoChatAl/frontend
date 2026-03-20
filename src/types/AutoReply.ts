export interface AutoReply {
  id: string;
  workspaceId: string;
  channelId: string;
  channelType: 'WHATSAPP' | 'INSTAGRAM';
  keyword: string;
  matchMode: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
  caseSensitive: boolean;
  replyType: 'TEXT' | 'AUDIO' | 'TEXT_AND_AUDIO';
  replyMessage: string;
  replyAudioBase64?: string;
  replyAudioMimeType?: string;
  replyLinkUrl?: string;
  replyLinkLabel?: string;
  replyLinkDescription?: string;
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
  replyType?: 'TEXT' | 'AUDIO' | 'TEXT_AND_AUDIO';
  replyMessage?: string;
  replyAudioBase64?: string;
  replyAudioMimeType?: string;
  replyLinkUrl?: string;
  replyLinkLabel?: string;
  replyLinkDescription?: string;
  enabled?: boolean;
}

export interface UpdateAutoReplyInput {
  channelId?: string;
  channelType?: 'WHATSAPP' | 'INSTAGRAM';
  keyword?: string;
  matchMode?: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
  caseSensitive?: boolean;
  replyType?: 'TEXT' | 'AUDIO' | 'TEXT_AND_AUDIO';
  replyMessage?: string;
  replyAudioBase64?: string;
  replyAudioMimeType?: string;
  replyLinkUrl?: string;
  replyLinkLabel?: string;
  replyLinkDescription?: string;
  enabled?: boolean;
}
