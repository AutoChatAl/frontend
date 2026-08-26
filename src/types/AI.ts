import type { LucideIcon } from 'lucide-react';

export interface AIChannel {
    id: string;
    name: string;
    type: 'whatsapp' | 'instagram' | 'whatsapp_official';
    active: boolean;
    identifier: string;
    createdBy?: string | null;
    ownerName?: string | null;
    /** Perfil de IA que hoje responde por este canal — null quando a IA está desligada nele. */
    aiProfileId?: string | null;
    aiProfileName?: string | null;
}
/** Um canal só pode responder por um perfil, então cada perfil tem seus próprios canais. */
export interface AiProfile {
    id: string;
    /** Rótulo pronto para exibir: nome dado pelo usuário ou "Perfil N". */
    name: string;
    /** Nome digitado pelo usuário, vazio quando ele nunca renomeou. */
    customName: string;
    order: number;
    enabled: boolean;
    activeChannelIds: string[];
}
/** Catálogo unificado entre os perfis ou um catálogo por perfil. */
export type AiCatalogScope = 'shared' | 'profile';
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
/** Formato das opções de produto no Instagram. Carrossel exige imagem em todo item ativo. */
export type InstagramProductLayout = 'QUICK_REPLY' | 'CAROUSEL';
export interface AiConfig {
    id: string;
    profileName: string;
    profileOrder: number;
    catalogScope: AiCatalogScope;
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
    instagramProductLayout: InstagramProductLayout;
}
export interface Product {
    id: string;
    workspaceId: string;
    name: string;
    priceCents: number;
    link: string;
    notes: string;
    keywords?: string;
    /** URL externa da imagem, quando veio da planilha. */
    imageUrl?: string;
    /** Data do upload próprio; presente significa que a imagem é um arquivo nosso. */
    imageUploadedAt?: string | null;
    /** URL pronta para exibir, montada pelo backend seja qual for a origem da imagem. */
    imagePreviewUrl?: string;
    active?: boolean;
    featured?: boolean;
}
export interface ProductPayload {
    name?: string;
    priceCents?: number;
    link?: string;
    notes?: string;
    keywords?: string;
    imageUrl?: string;
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
        keywords: string | null;
        image: string | null;
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
