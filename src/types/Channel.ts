export type WhatsAppInstance = {
    id: string;
    name: string;
    number?: string;
    status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
    type: 'WHATSAPP';
    workspaceId: string;
    createdBy?: string;
    ownerName?: string | null;
    /** Direito de gerenciar este canal — resolvido no backend (criador ou dono/admin). */
    canManage?: boolean;
    createdAt: string;
    whatsapp?: {
        id: string;
        channelId: string;
        provider: string;
        phoneNumber?: string;
        uazapiInstanceId?: string;
        uazapiBaseUrl?: string;
        createdAt: string;
        updatedAt: string;
    };
};
export type WhatsappConnectResponse = {
    ok: boolean;
    result?: {
        raw?: {
            connected?: boolean;
            instance?: {
                qrcode?: string;
                paircode?: string;
                status?: string;
                [key: string]: unknown;
            };
            [key: string]: unknown;
        };
        qr?: string | null;
        pairCode?: string | null;
        [key: string]: unknown;
    };
};
export type WhatsAppQRCodeRawResponse = {
    ok: boolean;
    qr?: string | null;
    raw?: {
        connected?: boolean;
        instance?: {
            qrcode?: string;
            paircode?: string;
            status?: string;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
};
export type WhatsAppCreateResponse = {
    ok: boolean;
    channel: WhatsAppInstance;
    connect?: {
        qrcode?: string;
        paircode?: string;
        instance?: {
            qrcode?: string;
            paircode?: string;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
    created?: unknown;
};
export type WhatsAppStatusResponse = {
    ok: boolean;
    connected?: boolean;
    phoneNumber?: string | null;
    status?: {
        state?: string;
        jid?: string;
        owner?: string;
        [key: string]: unknown;
    };
};
/** Mensagens enviadas (direcao OUT) por tipo de canal no periodo. */
export type ChannelMessageStats = {
    days: number;
    WHATSAPP: number;
    WHATSAPP_OFFICIAL: number;
    INSTAGRAM: number;
};
/**
 * Publicação do Instagram, no formato enxuto que o backend devolve em
 * `/channels/instagram/:id/media` — só o que o seletor de post precisa.
 */
export type InstagramMedia = {
    id: string;
    caption: string | null;
    mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | null;
    /** Capa. Em vídeo o backend já troca pelo thumbnail, nunca pelo arquivo. */
    thumbnailUrl: string | null;
    permalink: string | null;
    timestamp: string | null;
};

export type InstagramAccount = {
    id: string;
    name: string;
    status: 'CONNECTED' | 'DISCONNECTED';
    type: 'INSTAGRAM';
    workspaceId: string;
    createdBy?: string;
    ownerName?: string | null;
    /** Direito de gerenciar este canal — resolvido no backend (criador ou dono/admin). */
    canManage?: boolean;
    createdAt: string;
    instagram: {
        id: string;
        channelId: string;
        igUserId: string;
        username: string | null;
        profilePictureUrl: string | null;
        tokenExpiresAt: string | null;
        createdAt: string;
        updatedAt: string;
    };
};
