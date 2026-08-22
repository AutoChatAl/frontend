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
