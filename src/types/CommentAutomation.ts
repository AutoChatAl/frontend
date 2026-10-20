export type DmReplyType = 'TEXT' | 'AUDIO' | 'TEXT_AND_AUDIO' | 'IMAGE' | 'TEXT_AND_IMAGE' | 'IMAGE_AND_AUDIO' | 'DOCUMENT' | 'TEXT_AND_DOCUMENT' | 'DOCUMENT_AND_AUDIO';
export interface CommentAutomation {
    id: string;
    workspaceId: string;
    channelId: string;
    keyword: string;
    /** Lista completa. Vazia nas regras antigas: aí vale só `keyword`. */
    keywords?: string[];
    keywordLogic?: 'ANY' | 'ALL';
    matchMode: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
    caseSensitive: boolean;
    triggerOnAnyComment: boolean;
    commentReplyEnabled: boolean;
    commentReplyMessage: string;
    /** Variações sorteadas a cada comentário. Vazia = usa `commentReplyMessage`. */
    commentReplyMessages?: string[];
    dmReplyType: DmReplyType;
    dmMessage: string;
    dmImageBase64?: string;
    dmImageMimeType?: string;
    dmDocumentBase64?: string;
    dmDocumentMimeType?: string;
    dmDocumentName?: string;
    dmAudioAttachmentId?: string;
    dmImageAttachmentId?: string;
    dmDocumentAttachmentId?: string;
    dmLinkUrl?: string;
    dmLinkLabel?: string;
    dmLinkDescription?: string;
    /** Mensagem curta com botão para quem não conversa no Direct; a DM sai no toque. Ausente = ligado. */
    openingDmEnabled?: boolean;
    openingDmMessage?: string;
    openingDmButtonLabel?: string;
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
    keywords?: string[];
    keywordLogic?: 'ANY' | 'ALL';
    matchMode?: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
    caseSensitive?: boolean;
    triggerOnAnyComment?: boolean;
    commentReplyEnabled?: boolean;
    commentReplyMessage?: string;
    commentReplyMessages?: string[];
    dmReplyType?: DmReplyType;
    dmMessage?: string;
    dmImageBase64?: string;
    dmImageMimeType?: string;
    dmDocumentBase64?: string;
    dmDocumentMimeType?: string;
    dmDocumentName?: string;
    dmLinkUrl?: string;
    dmLinkLabel?: string;
    dmLinkDescription?: string;
    openingDmEnabled?: boolean;
    openingDmMessage?: string;
    openingDmButtonLabel?: string;
    postFilter?: 'ALL' | 'SPECIFIC';
    postIds?: string[];
    oncePerUser?: boolean;
    enabled?: boolean;
}
export interface UpdateCommentAutomationInput {
    channelId?: string;
    keyword?: string;
    keywords?: string[];
    keywordLogic?: 'ANY' | 'ALL';
    matchMode?: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
    caseSensitive?: boolean;
    triggerOnAnyComment?: boolean;
    commentReplyEnabled?: boolean;
    commentReplyMessage?: string;
    commentReplyMessages?: string[];
    dmReplyType?: DmReplyType;
    dmMessage?: string;
    dmImageBase64?: string;
    dmImageMimeType?: string;
    dmDocumentBase64?: string;
    dmDocumentMimeType?: string;
    dmDocumentName?: string;
    dmLinkUrl?: string;
    dmLinkLabel?: string;
    dmLinkDescription?: string;
    openingDmEnabled?: boolean;
    openingDmMessage?: string;
    openingDmButtonLabel?: string;
    postFilter?: 'ALL' | 'SPECIFIC';
    postIds?: string[];
    oncePerUser?: boolean;
    enabled?: boolean;
}
