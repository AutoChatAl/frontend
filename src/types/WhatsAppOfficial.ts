export type WaQualityRating = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';

export type WhatsAppOfficialInstance = {
  id: string;
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  type: 'WHATSAPP_OFFICIAL';
  workspaceId: string;
  createdBy?: string;
  ownerName?: string | null;
  createdAt: string;
  whatsappOfficial: {
    wabaId: string;
    phoneNumberId: string;
    businessId?: string;
    displayPhoneNumber?: string;
    verifiedName?: string;
    wabaName?: string;
    qualityRating?: WaQualityRating;
    messagingLimitTier?: string;
    nameStatus?: string;
    codeVerificationStatus?: string;
    accountMode?: string;
    accountReviewStatus?: string;
    businessVerificationStatus?: string;
    registered?: boolean;
    autoReadMessage?: boolean;
    lastHealthSyncAt?: string;
  };
};

export type WaSignupConfig = {
  appId: string;
  configId: string;
  graphVersion: string;
};

export type WaTemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type WaTemplateStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAUSED'
  | 'DISABLED'
  | 'IN_APPEAL'
  | 'PENDING_DELETION'
  | 'LIMIT_EXCEEDED'
  | 'ARCHIVED';
export type WaTemplateHeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
export type WaTemplateButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';

export type WaTemplateButton = {
  type: WaTemplateButtonType;
  text?: string;
  url?: string;
  phone_number?: string;
  example?: string[];
};

export type WaTemplateComponent = {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: WaTemplateHeaderFormat;
  text?: string;
  buttons?: WaTemplateButton[];
  example?: {
    header_text?: string[];
    header_handle?: string[];
    body_text?: string[][];
  };
};

export type WhatsAppTemplate = {
  id: string;
  workspaceId: string;
  channelId: string;
  wabaId: string;
  metaTemplateId?: string;
  name: string;
  language: string;
  category: WaTemplateCategory;
  parameterFormat: 'POSITIONAL' | 'NAMED';
  components: WaTemplateComponent[];
  status: WaTemplateStatus;
  rejectionReason?: string;
  qualityScore?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateTemplatePayload = {
  channelId: string;
  name: string;
  language: string;
  category: WaTemplateCategory;
  allowCategoryChange?: boolean;
  components: WaTemplateComponent[];
  variableExamples?: Record<string, string>;
  headerMediaBase64?: string;
  headerMediaMimeType?: string;
};

export type WaUsageCategorySummary = {
  category: string;
  count: number;
  billableCount: number;
  estimatedCostMicros: number;
};

export type WaUsageDailyPoint = {
  date: string;
  count: number;
  billableCount: number;
  estimatedCostMicros: number;
};

export type WaOfficialOverview = {
  periodDays: number;
  channels: WhatsAppOfficialInstance[];
  templates: Record<string, number>;
  usage: {
    totalMessages: number;
    totalBillable: number;
    totalEstimatedCostMicros: number;
    totalEstimatedCostFormatted: string;
    byCategory: WaUsageCategorySummary[];
    delivery: { sent: number; delivered: number; read: number; failed: number };
    daily: WaUsageDailyPoint[];
  };
};

export type WaUsageRecord = {
  id: string;
  channelId: string;
  wamid: string;
  contactId?: string;
  campaignId?: string;
  kind: 'FREE_FORM' | 'TEMPLATE';
  templateName?: string;
  category: string;
  pricingType?: string;
  billable?: boolean;
  estimatedCostMicros: number;
  currency: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  sentAt: string;
};

export type WaCampaignEstimate = {
  templateId: string;
  templateName: string;
  category: WaTemplateCategory;
  contactCount: number;
  unitCostMicros: number;
  totalCostMicros: number;
  unitCostFormatted: string;
  totalCostFormatted: string;
  currency: string;
  note: string;
};

export function formatBrlFromMicros(micros: number): string {
  return (micros / 1_000_000).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
