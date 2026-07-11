export type SalesPlatform = 'HOTMART' | 'KIWIFY' | 'EDUZZ' | 'MONETIZZE' | 'PERFECTPAY';

export type IntegrationChannelType = 'WHATSAPP' | 'INSTAGRAM' | 'WHATSAPP_OFFICIAL';

export type AbandonedCartStatus = 'ABANDONED' | 'RECOVERED' | 'EXPIRED' | 'CANCELED';

export type RecoveryAttemptStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';

export interface RecoveryStep {
  delayMinutes: number;
  messageTemplate: string;
  enabled?: boolean;
}

export interface UtmParameters {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  sck?: string;
  src?: string;
}

export interface CartRecoveryIntegration {
  id: string;
  workspaceId: string;
  platform: SalesPlatform;
  name: string;
  secret: string;
  channelId?: string;
  channelType?: IntegrationChannelType;
  enabled: boolean;
  recoverySteps: RecoveryStep[];
  webhookUrl: string;
  lastEventAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryAttempt {
  stepIndex: number;
  scheduledFor: string;
  status: RecoveryAttemptStatus;
  channelType?: IntegrationChannelType;
  sentAt?: string;
  error?: string;
}

export interface AbandonedCart {
  id: string;
  workspaceId: string;
  integrationId: string;
  platform: SalesPlatform;
  externalCartId: string;
  contactId?: string;
  matchedChannelId?: string;
  matchedChannelType?: IntegrationChannelType;
  matchReason?: 'SCK' | 'PHONE' | 'EMAIL' | 'IG_USERNAME' | 'NONE';
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerPhoneE164?: string;
  customerIgUsername?: string;
  customerIgUserId?: string;
  productName?: string;
  productValueCents?: number;
  currency?: string;
  checkoutUrl?: string;
  status: AbandonedCartStatus;
  utmParameters?: UtmParameters;
  abandonedAt: string;
  recoveredAt?: string;
  recoveryAttempts: RecoveryAttempt[];
  createdAt: string;
  updatedAt: string;
}

export interface AbandonedCartsSummary {
  total: number;
  abandoned: number;
  recovered: number;
  expired: number;
  totalValueCents: number;
  recoveredValueCents: number;
}

export interface CreateIntegrationInput {
  platform: SalesPlatform;
  name: string;
  secret: string;
  channelId?: string | undefined;
  channelType?: IntegrationChannelType;
  enabled?: boolean;
  recoverySteps?: RecoveryStep[];
}

export interface UpdateIntegrationInput {
  name?: string;
  secret?: string;
  channelId?: string | undefined;
  channelType?: IntegrationChannelType;
  enabled?: boolean;
  recoverySteps?: RecoveryStep[];
}

export interface ListCartsParams {
  status?: AbandonedCartStatus | undefined;
  integrationId?: string | undefined;
  platform?: SalesPlatform | undefined;
  contactId?: string | undefined;
  search?: string | undefined;
  skip?: number;
  limit?: number;
}

export interface PaginatedCarts {
  data: AbandonedCart[];
  total: number;
}

export const PLATFORM_LABELS: Record<SalesPlatform, string> = {
  HOTMART: 'Hotmart',
  KIWIFY: 'Kiwify',
  EDUZZ: 'Eduzz',
  MONETIZZE: 'Monetizze',
  PERFECTPAY: 'PerfectPay',
};

export const STATUS_LABELS: Record<AbandonedCartStatus, string> = {
  ABANDONED: 'Abandonado',
  RECOVERED: 'Recuperado',
  EXPIRED: 'Expirado',
  CANCELED: 'Cancelado',
};

export const ATTEMPT_STATUS_LABELS: Record<RecoveryAttemptStatus, string> = {
  PENDING: 'Pendente',
  SENT: 'Enviada',
  FAILED: 'Falhou',
  SKIPPED: 'Pulada',
};
