export type PlanSlug = 'impulso' | 'crescimento' | 'dominio';
export type AiPlanSlug = 'ai-nivel-1' | 'ai-nivel-2' | 'ai-nivel-3';
export type SubscriptionStatus = 'active' | 'block' | 'failed_payment';

export interface PlanLimits {
  maxInstances: number;
  maxWhatsappInstances: number;
  maxInstagramInstances: number;
  maxCampaigns: number;
  maxContacts: number;
  maxSchedules: number;
  schedulesPerMember: boolean;
  maxCollaborators: number;
  maxAutoReplies: number;
  maxCommentAutomations: number;
  maxMessagesPerMonth: number;
  extraMessagePriceCents: number;
  extraAiMessagePriceCents: number;
  supportLevel: 'standard' | 'vip';
}

export interface Plan {
  id: string;
  slug: PlanSlug;
  name: string;
  description: string;
  priceCents: number;
  stripePriceId: string;
  limits: PlanLimits;
  aiIncluded: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface AiPlanLimits {
  maxChannels: number;
  maxAiMessagesPerMonth: number;
  schedulingQueryEnabled: boolean;
  schedulingBookingEnabled: boolean;
  maxProducts: number;
  maxCustomRulesChars: number;
}

export interface AiPlan {
  id: string;
  slug: AiPlanSlug;
  name: string;
  priceCents: number;
  stripePriceId: string;
  limits: AiPlanLimits;
  isActive: boolean;
  sortOrder: number;
}

export interface Subscription {
  id: string;
  workspaceId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  extraInstances: number;
  extraCollaborators: number;
  aiPlanId: string | null;
  stripeSubscriptionId: string | null;
  stripePaymentMethodId: string | null;
  stripePaymentMethodLast4: string | null;
  stripePaymentMethodBrand: string | null;
  customerName: string | null;
  customerCpf: string | null;
  customerPhone: string | null;
}

export interface SubscriptionStatus_Full {
  subscription: Subscription | null;
  plan: Plan | null;
  aiPlan: AiPlan | null;
  limits: EffectiveLimits;
  usage: MessageUsageData | null;
}

export interface EffectiveLimits {
  maxCampaignsPerWorkspace: number;
  maxAutoRepliesPerWorkspace: number;
  maxCommentAutomations: number;
  maxWhatsappInstances: number;
  maxInstagramInstances: number;
  maxTotalInstances: number;
  maxContacts: number;
  maxContactsPerCampaign: number;
  maxContactsPerGroup: number;
  maxCollaborators: number;
  maxSchedules: number;
  schedulesPerMember: boolean;
  maxMessagesPerMonth: number;
  manualDispatchCooldownHours: number;
  extraMessagePriceCents: number;
  extraAiMessagePriceCents: number;
  supportLevel: 'standard' | 'vip';
  aiEnabled: boolean;
  maxAiChannels: number;
  maxAiMessagesPerMonth: number;
  maxProducts: number;
  maxCustomRulesChars: number;
  schedulingQueryEnabled: boolean;
  schedulingBookingEnabled: boolean;
}

export interface MessageUsageData {
  general: number;
  ai: number;
  periodStart: string;
}

export interface UsageSummary {
  messages: { used: number; limit: number };
  aiMessages: { used: number; limit: number };
  campaigns: { used: number; limit: number };
  autoReplies: { used: number; limit: number };
  commentAutomations: { used: number; limit: number };
  instances: { used: number; limit: number };
  contacts: { used: number; limit: number };
  collaborators: { used: number; limit: number };
}

export interface Invoice {
  id: string;
  number: string | null;
  date: string | null;
  amountCents: number;
  status: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

export interface UpcomingInvoice {
  amountCents: number;
  date: string | null;
}
