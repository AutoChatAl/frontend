import type { LucideIcon } from 'lucide-react';

export interface AIChannel {
    id: string;
    name: string;
    type: 'whatsapp' | 'instagram' | 'whatsapp_official';
    active: boolean;
    identifier: string;
    createdBy?: string | null;
    ownerName?: string | null;
}
export interface AIRule {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
}
export interface AITab {
    id: string;
    label: string;
    icon: LucideIcon;
}
export interface AiTriggerSettings {
    qualifyLead: boolean;
    prioritizeScheduling: boolean;
    recoveryAfterNoReply: boolean;
    detectUrgency: boolean;
}
export const defaultAiTriggerSettings: AiTriggerSettings = {
  qualifyLead: false,
  prioritizeScheduling: false,
  recoveryAfterNoReply: false,
  detectUrgency: false,
};
export const tonesOptions = [
  { value: '', label: 'Selecione um tom...' },
  'Profissional e Formal',
  'Amigável e Casual',
  'Entusiasta e Vendedor',
  'Empático e Prestativo',
  'Direto e Objetivo',
];
export interface AiConfig {
    id: string;
    enabled: boolean;
    activeChannelId: string | null;
    segment: string;
    businessName: string;
    assistantName: string;
    tone: string;
    customRules: string;
    triggerSettings: AiTriggerSettings;
    schedulingQueryEnabled: boolean;
    schedulingBookingEnabled: boolean;
    funnelAutoMoveEnabled: boolean;
    crossSellEnabled: boolean;
}
export interface Product {
    id: string;
    workspaceId: string;
    name: string;
    priceCents: number;
    link: string;
    notes: string;
    keywords?: string;
    active?: boolean;
    featured?: boolean;
}
export interface ProductPayload {
    name?: string;
    priceCents?: number;
    link?: string;
    notes?: string;
    keywords?: string;
    active?: boolean;
    featured?: boolean;
}
export type ProductImportMode = 'merge' | 'replace';
export interface ProductImportIssue {
    line: number;
    reason: string;
    value?: string;
}
export interface ProductImportReport {
    detectedColumns: {
        name: string | null;
        price: string | null;
        notes: string | null;
        link: string | null;
    };
    totalRows: number;
    created: number;
    updated: number;
    skipped: number;
    duplicatesInFile: number;
    ignoredByLimit: number;
    maxProducts: number;
    totalAfterImport: number;
    issues: ProductImportIssue[];
}
