import type { DmReplyType } from './CommentAutomation';

export type { DmReplyType };

/**
 * Regra de resposta automática para comentários de transmissão ao vivo.
 *
 * Espelha a automação de comentários sem o filtro de post (numa live não existe
 * publicação para escolher) e sem resposta pública: o Instagram não aceita reply em
 * comentário de live, então a única resposta possível na transmissão é a DM.
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
    /** Legado: sempre `false` nas regras novas e nunca enviado. Fica só pelas regras antigas. */
    commentReplyEnabled: boolean;
    /** Legado, ver `commentReplyEnabled`. */
    commentReplyMessage: string;
    /** Legado, ver `commentReplyEnabled`. */
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
