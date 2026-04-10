export type DmReplyType = 'TEXT' | 'AUDIO' | 'TEXT_AND_AUDIO' | 'IMAGE' | 'TEXT_AND_IMAGE' | 'IMAGE_AND_AUDIO' | 'DOCUMENT' | 'TEXT_AND_DOCUMENT' | 'DOCUMENT_AND_AUDIO';

export interface CommentAutomation {
  id: string;
  workspaceId: string;
  channelId: string;
  keyword: string;
  matchMode: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
  caseSensitive: boolean;
  triggerOnAnyComment: boolean;
  commentReplyEnabled: boolean;
  commentReplyMessage: string;
  dmReplyType: DmReplyType;
  dmMessage: string;
  dmAudioBase64?: string;
  dmAudioMimeType?: string;
  dmImageBase64?: string;
  dmImageMimeType?: string;
  dmDocumentBase64?: string;
  dmDocumentMimeType?: string;
  dmDocumentName?: string;
  dmLinkUrl?: string;
  dmLinkLabel?: string;
  dmLinkDescription?: string;
  postFilter: 'ALL' | 'SPECIFIC';
  postIds?: string[];
  oncePerUser: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentAutomationInput {
  channelId: string;
  keyword?: string;
  matchMode?: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
  caseSensitive?: boolean;
  triggerOnAnyComment?: boolean;
  commentReplyEnabled?: boolean;
  commentReplyMessage?: string;
  dmReplyType?: DmReplyType;
  dmMessage?: string;
  dmAudioBase64?: string;
  dmAudioMimeType?: string;
  dmImageBase64?: string;
  dmImageMimeType?: string;
  dmDocumentBase64?: string;
  dmDocumentMimeType?: string;
  dmDocumentName?: string;
  dmLinkUrl?: string;
  dmLinkLabel?: string;
  dmLinkDescription?: string;
  postFilter?: 'ALL' | 'SPECIFIC';
  postIds?: string[];
  oncePerUser?: boolean;
  enabled?: boolean;
}

export interface UpdateCommentAutomationInput {
  channelId?: string;
  keyword?: string;
  matchMode?: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
  caseSensitive?: boolean;
  triggerOnAnyComment?: boolean;
  commentReplyEnabled?: boolean;
  commentReplyMessage?: string;
  dmReplyType?: DmReplyType;
  dmMessage?: string;
  dmAudioBase64?: string;
  dmAudioMimeType?: string;
  dmImageBase64?: string;
  dmImageMimeType?: string;
  dmDocumentBase64?: string;
  dmDocumentMimeType?: string;
  dmDocumentName?: string;
  dmLinkUrl?: string;
  dmLinkLabel?: string;
  dmLinkDescription?: string;
  postFilter?: 'ALL' | 'SPECIFIC';
  postIds?: string[];
  oncePerUser?: boolean;
  enabled?: boolean;
}
