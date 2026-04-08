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
  dmMessage: string;
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
  dmMessage: string;
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
  dmMessage?: string;
  dmLinkUrl?: string;
  dmLinkLabel?: string;
  dmLinkDescription?: string;
  postFilter?: 'ALL' | 'SPECIFIC';
  postIds?: string[];
  oncePerUser?: boolean;
  enabled?: boolean;
}
