export type WhatsAppInstance = {
  id: string;
  name: string;
  number: string;
  status: 'connected' | 'disconnected';
  battery?: number;
};

export type InstagramAccount = {
  id: string;
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  type: 'INSTAGRAM';
  workspaceId: string;
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
