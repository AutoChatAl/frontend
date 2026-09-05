import type { DmReplyType } from './CommentAutomation';

export type { DmReplyType };

/**
 * Regra de resposta automática para comentários de transmissão ao vivo.
 *
 * Espelha a automação de comentários sem o filtro de post: numa live não existe
 * publicação para escolher.
 */
export interface LiveAutomation {
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
    dmLinkUrl?: string;
    dmLinkLabel?: string;
    dmLinkDescription?: string;
    oncePerUser: boolean;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateLiveAutomationInput {
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
    oncePerUser?: boolean;
    enabled?: boolean;
}

export type UpdateLiveAutomationInput = Partial<CreateLiveAutomationInput>;
