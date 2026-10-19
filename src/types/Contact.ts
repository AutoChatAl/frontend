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
/** Grupo manual em que o contato está — vem com a listagem de contatos. */
export interface ContactGroupRef {
    id: string;
    name: string;
}
export type ContactOrigin = 'WHATSAPP' | 'INSTAGRAM' | 'CART_RECOVERY' | 'COMMENT' | 'CAMPAIGN' | 'MANUAL' | 'TIKTOK' | 'TELEGRAM' | 'IMPORT';
export interface Contact {
    id: string;
    workspaceId: string;
    displayName?: string | null;
    phoneE164?: string | null;
    origin?: ContactOrigin | null;
    importedAt?: string | null;
    createdAt: string;
    lastInteractionAt?: string | null;
    awaitingHuman?: boolean;
    awaitingHumanSince?: string | null;
    identities?: ContactIdentity[];
    tags?: ContactTag[];
    groups?: ContactGroupRef[];
    salesCount?: number;
    salesValueCents?: number;
    abandonedCount?: number;
    abandonedValueCents?: number;
}
export interface ListContactsParams {
    search?: string;
    channelId?: string;
    includeUnlinked?: boolean;
    unlinkedOnly?: boolean;
    /** Só contatos com telefone (WhatsApp ou planilha) — deixa de fora quem só existe no Instagram. */
    hasPhone?: boolean;
    /** `name` ordena A→Z; sem valor, a API devolve fila de atendimento e última interação primeiro. */
    sortBy?: 'name';
    /** Só os membros deste grupo. */
    groupId?: string;
    tagName?: string;
    tagIds?: string;
    skip?: number;
    limit?: number;
}
export interface PaginatedContacts {
    data: Contact[];
    total: number;
}
export interface ContactImportIssue {
    line: number;
    reason: string;
    value?: string;
}
export interface ContactImportReport {
    detectedColumns: {
        phone: string | null;
        name: string | null;
    };
    totalRows: number;
    created: number;
    updated: number;
    skipped: number;
    duplicatesInFile: number;
    ignoredByLimit: number;
    maxContacts: number;
    totalAfterImport: number;
    issues: ContactImportIssue[];
}
export function isUnlinkedContact(contact: Contact): boolean {
  return !!contact.phoneE164 && (contact.identities?.length ?? 0) === 0;
}
export function contactPhone(contact: Contact): string | null {
  return contact.identities?.find((i) => i.phoneE164)?.phoneE164 ?? contact.phoneE164 ?? null;
}
