export interface AutoReply {
  id: string;
  workspaceId: string;
  channelId: string;
  channelType: 'WHATSAPP' | 'INSTAGRAM';
  keyword: string;
  matchMode: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
  caseSensitive: boolean;
  replyType: 'TEXT' | 'AUDIO' | 'TEXT_AND_AUDIO' | 'IMAGE' | 'TEXT_AND_IMAGE' | 'IMAGE_AND_AUDIO';
  replyMessage: string;
  replyAudioBase64?: string;
  replyAudioMimeType?: string;
  replyImageBase64?: string;
  replyImageMimeType?: string;
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
  replyType?: 'TEXT' | 'AUDIO' | 'TEXT_AND_AUDIO' | 'IMAGE' | 'TEXT_AND_IMAGE' | 'IMAGE_AND_AUDIO';
  replyMessage?: string;
  replyAudioBase64?: string;
  replyAudioMimeType?: string;
  replyImageBase64?: string;
  replyImageMimeType?: string;
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
  replyType?: 'TEXT' | 'AUDIO' | 'TEXT_AND_AUDIO' | 'IMAGE' | 'TEXT_AND_IMAGE' | 'IMAGE_AND_AUDIO';
  replyMessage?: string;
  replyAudioBase64?: string;
  replyAudioMimeType?: string;
  replyImageBase64?: string;
  replyImageMimeType?: string;
  replyLinkUrl?: string;
  replyLinkLabel?: string;
  replyLinkDescription?: string;
  enabled?: boolean;
}
