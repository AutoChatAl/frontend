export type SalesPlatform = 'HOTMART' | 'KIWIFY' | 'EDUZZ' | 'MONETIZZE' | 'PERFECTPAY';

export type IntegrationChannelType = 'WHATSAPP' | 'INSTAGRAM' | 'WHATSAPP_OFFICIAL';

export type AbandonedCartStatus = 'ABANDONED' | 'RECOVERED' | 'EXPIRED' | 'CANCELED' | 'PURCHASED';

export type CartAbandonReason = 'CART_ABANDONED' | 'PAYMENT_PENDING';

export type RecoveryAttemptStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';

export type WebhookRejectionReason = 'INVALID_SECRET' | 'MISSING_SECRET';

export interface RecoveryStep {
  delayMinutes: number;
  messageTemplate: string;
  enabled?: boolean;
}

export interface BuyerWelcome {
  enabled: boolean;
  message: string;
  delayMinutes: number;
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
  paymentPendingSteps?: RecoveryStep[];
  buyerWelcome?: BuyerWelcome;
  webhookUrl: string;
  lastEventAt?: string;
  lastRejectedAt?: string;
  lastRejectedReason?: WebhookRejectionReason;
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

export interface BuyerWelcomeDelivery {
  status: RecoveryAttemptStatus;
  scheduledFor: string;
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
  reason?: CartAbandonReason;
  utmParameters?: UtmParameters;
  abandonedAt: string;
  recoveredAt?: string;
  recoveryAttempts: RecoveryAttempt[];
  buyerWelcome?: BuyerWelcomeDelivery;
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
  periodRecovered?: number;
  periodRecoveredValueCents?: number;
  periodStart?: string;
}

export interface CreateIntegrationInput {
  platform: SalesPlatform;
  name: string;
  secret: string;
  channelId?: string | undefined;
  channelType?: IntegrationChannelType;
  enabled?: boolean;
  recoverySteps?: RecoveryStep[];
  paymentPendingSteps?: RecoveryStep[];
  buyerWelcome?: BuyerWelcome;
}

export interface UpdateIntegrationInput {
  name?: string;
  secret?: string;
  channelId?: string | undefined;
  channelType?: IntegrationChannelType;
  enabled?: boolean;
  recoverySteps?: RecoveryStep[];
  paymentPendingSteps?: RecoveryStep[];
  buyerWelcome?: BuyerWelcome;
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
  PURCHASED: 'Compra direta',
};

export const REASON_LABELS: Record<CartAbandonReason, string> = {
  CART_ABANDONED: 'Carrinho abandonado',
  PAYMENT_PENDING: 'Pix ou boleto pendente',
};

export const ATTEMPT_STATUS_LABELS: Record<RecoveryAttemptStatus, string> = {
  PENDING: 'Pendente',
  SENT: 'Enviada',
  FAILED: 'Falhou',
  SKIPPED: 'Pulada',
};

export const DELIVERY_ERROR_LABELS: Record<string, string> = {
  WA_OUTSIDE_SERVICE_WINDOW: 'Não enviada: este cliente não fala com você há mais de 24h. Para chamar de novo, use um modelo aprovado.',
  NO_IG_SCOPED_ID: 'Não enviada: a pessoa ainda não conversou com seu Instagram, então não dá para mandar mensagem para ela.',
  INSTAGRAM_NOT_CONFIGURED: 'Não enviada: o Instagram escolhido precisa ser conectado de novo em Canais.',
  NO_PHONE: 'Não enviada: a plataforma não mandou o telefone do comprador.',
  NO_CHANNEL: 'Não enviada: nenhum número ou conta foi escolhido para enviar.',
  INVALID_CHANNEL: 'Não enviada: o número ou conta escolhido não existe mais ou não combina com o tipo de envio.',
  INTEGRATION_DISABLED: 'Não enviada: a integração estava desligada.',
  STEP_DISABLED: 'Não enviada: esta mensagem foi desligada ou removida.',
  WELCOME_DISABLED: 'Não enviada: a boas-vindas foi desligada antes do envio.',
  ORDER_CANCELED: 'Não enviada: o pedido foi cancelado ou reembolsado antes do envio.',
};

export function describeDeliveryError(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return DELIVERY_ERROR_LABELS[code] ?? 'Não foi possível enviar esta mensagem.';
}
