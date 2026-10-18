import type { Contact, ContactImportReport } from './Contact';

export interface DynamicRule {
    channelIds?: string[];
    tagNames?: string[];
    lastInteractionWithinDays?: number;
}
export interface Group {
    id: string;
    workspaceId: string;
    name: string;
    type: 'MANUAL' | 'DYNAMIC';
    ruleJson?: DynamicRule;
    memberContactIds: string[];
    memberCount: number;
    channelTypes?: string[];
    createdAt: string;
}
export interface GroupWithContacts extends Group {
    contacts: Contact[];
}
export interface CreateGroupInput {
    name: string;
    type: 'MANUAL' | 'DYNAMIC';
    rule?: DynamicRule;
}
export interface UpdateGroupInput {
    name?: string;
    rule?: DynamicRule;
}
/** Corpo de `POST /groups/import`. `consentConfirmed` só segue como `true`. */
export interface ImportGroupPayload {
    name: string;
    fileName: string;
    fileBase64: string;
    consentConfirmed: true;
}
/** Grupo devolvido por `POST /groups/import` — o mesmo formato de `POST /groups`. */
export interface ImportedGroup {
    id: string;
    workspaceId: string;
    createdBy: string;
    name: string;
    type: 'MANUAL';
    memberContactIds: string[];
    createdAt: string;
}
/** Relatório de `POST /contacts/import` mais os campos do grupo. */
export interface GroupImportReport extends ContactImportReport {
    membersAdded: number;
    maxContactsPerGroup: number;
}
export interface ImportGroupResult {
    group: ImportedGroup;
    report: GroupImportReport;
}
