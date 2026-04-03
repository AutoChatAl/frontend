export interface ContactIdentity {
  id: string;
  contactId: string;
  channelId: string;
  type: 'WHATSAPP' | 'INSTAGRAM';
  phoneE164?: string | null;
  igUserId?: string | null;
  igUsername?: string | null;
}

export interface ContactTag {
  contactId: string;
  tagId: string;
  tag: {
    id: string;
    name: string;
  };
}

export interface Contact {
  id: string;
  workspaceId: string;
  displayName?: string | null;
  createdAt: string;
  lastInteractionAt?: string | null;
  awaitingHuman?: boolean;
  awaitingHumanSince?: string | null;
  identities?: ContactIdentity[];
  tags?: ContactTag[];
}

export interface ListContactsParams {
  search?: string;
  channelId?: string;
  tagName?: string;
  tagIds?: string;
  skip?: number;
  limit?: number;
}

export interface PaginatedContacts {
  data: Contact[];
  total: number;
}
