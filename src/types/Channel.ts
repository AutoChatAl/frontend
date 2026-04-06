export type WhatsAppInstance = {
  id: string;
  name: string;
  number?: string;
  status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
  type: 'WHATSAPP';
  workspaceId: string;
  createdBy?: string;
  ownerName?: string | null;
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

export type InstagramAccount = {
  id: string;
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  type: 'INSTAGRAM';
  workspaceId: string;
  createdBy?: string;
  ownerName?: string | null;
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
