export interface AutoReply {
  id: string;
  workspaceId: string;
  channelId: string;
  channelType: 'WHATSAPP' | 'INSTAGRAM';
  keyword: string;
  matchMode: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
  caseSensitive: boolean;
  replyType: 'TEXT' | 'AUDIO' | 'TEXT_AND_AUDIO' | 'IMAGE' | 'TEXT_AND_IMAGE' | 'IMAGE_AND_AUDIO' | 'DOCUMENT' | 'TEXT_AND_DOCUMENT' | 'DOCUMENT_AND_AUDIO';
  replyMessage: string;
  replyAudioBase64?: string;
  replyAudioMimeType?: string;
  replyImageBase64?: string;
  replyImageMimeType?: string;
  replyDocumentBase64?: string;
  replyDocumentMimeType?: string;
  replyDocumentName?: string;
  replyLinkUrl?: string;
  replyLinkLabel?: string;
  replyLinkDescription?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ReplyType = 'TEXT' | 'AUDIO' | 'TEXT_AND_AUDIO' | 'IMAGE' | 'TEXT_AND_IMAGE' | 'IMAGE_AND_AUDIO' | 'DOCUMENT' | 'TEXT_AND_DOCUMENT' | 'DOCUMENT_AND_AUDIO';

export interface CreateAutoReplyInput {
  channelId: string;
  channelType: 'WHATSAPP' | 'INSTAGRAM';
  keyword: string;
  matchMode?: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
  caseSensitive?: boolean;
  replyType?: ReplyType;
  replyMessage?: string;
  replyAudioBase64?: string;
  replyAudioMimeType?: string;
  replyImageBase64?: string;
  replyImageMimeType?: string;
  replyDocumentBase64?: string;
  replyDocumentMimeType?: string;
  replyDocumentName?: string;
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
  replyType?: ReplyType;
  replyMessage?: string;
  replyAudioBase64?: string;
  replyAudioMimeType?: string;
  replyImageBase64?: string;
  replyImageMimeType?: string;
  replyDocumentBase64?: string;
  replyDocumentMimeType?: string;
  replyDocumentName?: string;
  replyLinkUrl?: string;
  replyLinkLabel?: string;
  replyLinkDescription?: string;
  enabled?: boolean;
}
