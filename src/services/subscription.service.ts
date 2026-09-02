import type { AiPlan, BillingCycle, EffectiveLimits, Invoice, Plan, SubscriptionStatus_Full, UpcomingInvoice, UsageSummary } from '@/types/Subscription';
import { apiClient } from '@/utils/ApiClient';
import { extractSubscriptionError } from '@/utils/ErrorHandling';

export interface SubResult {
    success: boolean;
    error?: string;
}
export interface CancelResult extends SubResult {
    /** true quando o encerramento foi agendado para o fim do período já pago. */
    scheduled?: boolean;
    /** Data até quando o acesso continua, quando agendado. */
    accessUntil?: string;
}
interface PixIntentResponse {
    paymentIntentId: string;
    clientSecret: string;
    qrCodeImageUrl: string | null;
    qrCodeString: string | null;
    expiresAt: string | null;
    amount: number;
    description: string;
}
interface PixPlanIntentResponse {
    paymentIntentId: string;
    clientSecret: string;
    qrCodeImageUrl: string | null;
    qrCodeString: string | null;
    expiresAt: string | null;
    amount: number;
    planName: string;
}
let cachedStatus: SubscriptionStatus_Full | null = null;
class SubscriptionService {
  public async getStatus(): Promise<SubscriptionStatus_Full | null> {
    if (cachedStatus)
      return cachedStatus;
    try {
      const res = await apiClient.get<SubscriptionStatus_Full>('/subscription/status');
      if (res.success && res.data) {
        cachedStatus = res.data as SubscriptionStatus_Full;
        return cachedStatus;
      }
    }
    catch { }
    return null;
  }
  public async getUsage(): Promise<UsageSummary | null> {
    try {
      const res = await apiClient.get<UsageSummary>('/subscription/usage');
      if (res.success && res.data)
        return res.data as UsageSummary;
    }
    catch { }
    return null;
  }
  public async getLimits(): Promise<EffectiveLimits | null> {
    try {
      const res = await apiClient.get<EffectiveLimits>('/subscription/limits');
      if (res.success && res.data)
        return res.data as EffectiveLimits;
    }
    catch { }
    return null;
  }
  public async getPlans(): Promise<Plan[]> {
    try {
      const res = await apiClient.get<Plan[]>('/subscription/plans');
      if (res.success && res.data)
        return res.data as Plan[];
    }
    catch { }
    return [];
  }
  public async getAiPlans(): Promise<AiPlan[]> {
    try {
      const res = await apiClient.get<AiPlan[]>('/subscription/ai-plans');
      if (res.success && res.data)
        return res.data as AiPlan[];
    }
    catch { }
    return [];
  }
  public async getInvoices(): Promise<Invoice[]> {
    try {
      const res = await apiClient.get<Invoice[]>('/subscription/invoices');
      if (res.success && res.data)
        return res.data as Invoice[];
    }
    catch { }
    return [];
  }
  public async getUpcomingInvoice(): Promise<UpcomingInvoice | null> {
    try {
      const res = await apiClient.get<UpcomingInvoice>('/subscription/upcoming-invoice');
      if (res.success && res.data)
        return res.data as UpcomingInvoice;
    }
    catch { }
    return null;
  }
  public async createCheckoutSession(planSlug: string, successUrl: string, cancelUrl: string, billingCycle?: BillingCycle): Promise<string | null> {
    try {
      const res = await apiClient.post<{
                url: string;
            }>('/subscription/checkout', { planSlug, successUrl, cancelUrl, ...(billingCycle ? { billingCycle } : {}) });
      if (res.success && res.data)
        return (res.data as {
                    url: string;
                }).url;
    }
    catch { }
    return null;
  }
  public async changePlan(planSlug: string, billingCycle?: BillingCycle): Promise<SubResult> {
    const res = await apiClient.post('/subscription/change-plan', { planSlug, ...(billingCycle ? { billingCycle } : {}) });
    if (res.success)
      return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }
  /**
   * Cancela pela regra do backend: agenda para o fim do período pago em ciclo
   * trimestral/anual, encerra na hora no mensal.
   */
  public async cancelSubscription(): Promise<CancelResult> {
    const res = await apiClient.post<{ scheduled?: boolean; accessUntil?: string }>('/subscription/cancel', {});
    if (res.success) {
      const data = (res.data ?? {}) as { scheduled?: boolean; accessUntil?: string };
      return { success: true, ...(data.scheduled ? { scheduled: true } : {}), ...(data.accessUntil ? { accessUntil: data.accessUntil } : {}) };
    }
    return { success: false, error: extractSubscriptionError(res) };
  }
  /** Desfaz um cancelamento agendado, enquanto o período pago não terminou. */
  public async reactivateSubscription(): Promise<SubResult> {
    const res = await apiClient.post('/subscription/reactivate', {});
    if (res.success)
      return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }
  public async cancelSubscriptionImmediately(): Promise<SubResult> {
    const res = await apiClient.post('/subscription/cancel-immediately', {});
    if (res.success)
      return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }
  public async addOrChangeAiPlan(aiPlanSlug: string): Promise<SubResult> {
    const res = await apiClient.post('/subscription/ai-plan', { aiPlanSlug });
    if (res.success)
      return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }
  public async removeAiPlan(): Promise<SubResult> {
    const res = await apiClient.delete('/subscription/ai-plan');
    if (res.success)
      return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }
  public async addExtraInstance(): Promise<SubResult> {
    const res = await apiClient.post('/subscription/extra/instance', {});
    if (res.success)
      return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }
  public async removeExtraInstance(): Promise<SubResult> {
    const res = await apiClient.delete('/subscription/extra/instance');
    if (res.success)
      return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }
  public async addExtraCollaborator(): Promise<SubResult> {
    const res = await apiClient.post('/subscription/extra/collaborator', {});
    if (res.success)
      return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }
  public async removeExtraCollaborator(): Promise<SubResult> {
    const res = await apiClient.delete('/subscription/extra/collaborator');
    if (res.success)
      return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }
  public async getPortalUrl(returnUrl?: string): Promise<{
        url?: string;
        error?: string;
    }> {
    const res = await apiClient.post<{
            url: string;
        }>('/subscription/portal', { returnUrl });
    if (res.success && res.data)
      return { url: (res.data as {
                    url: string;
                }).url };
    return { error: extractSubscriptionError(res) };
  }
  public async subscribe(planSlug: string, paymentMethodId: string, personal: {
        name?: string;
        cpf?: string;
        phone?: string;
    }, couponCode?: string, billingCycle?: BillingCycle): Promise<{
        success: boolean;
        requiresAction?: boolean;
        clientSecret?: string;
        error?: string;
    } | null> {
    try {
      const res = await apiClient.post<{
                success: boolean;
                requiresAction?: boolean;
                clientSecret?: string;
            }>('/subscription/subscribe', { planSlug, paymentMethodId, ...personal, ...(couponCode ? { couponCode } : {}), ...(billingCycle ? { billingCycle } : {}) });
      if (res.success && res.data)
        return res.data as {
                    success: boolean;
                    requiresAction?: boolean;
                    clientSecret?: string;
                };
      return { success: false, error: extractSubscriptionError(res) };
    }
    catch { }
    return null;
  }
  public async createSetupIntent(): Promise<string | null> {
    try {
      const res = await apiClient.post<{
                clientSecret: string;
            }>('/subscription/setup-intent', {});
      if (res.success && res.data)
        return (res.data as {
                    clientSecret: string;
                }).clientSecret;
    }
    catch { }
    return null;
  }
  public async savePaymentMethod(paymentMethodId: string): Promise<{
        last4: string | null;
        brand: string | null;
        paymentRecovered?: boolean;
    } | null> {
    try {
      const res = await apiClient.post<{
                last4: string | null;
                brand: string | null;
                paymentRecovered?: boolean;
            }>('/subscription/payment-method', { paymentMethodId });
      if (res.success && res.data)
        return res.data as {
                    last4: string | null;
                    brand: string | null;
                    paymentRecovered?: boolean;
                };
    }
    catch { }
    return null;
  }
  public async createPixIntentForExtra(type: 'instance' | 'collaborator'): Promise<PixIntentResponse | null> {
    try {
      const res = await apiClient.post<PixIntentResponse>('/subscription/pix-extra', { type });
      if (res.success && res.data)
        return res.data as PixIntentResponse;
    }
    catch { }
    return null;
  }
  public async createPixIntent(planSlug: string, billingCycle?: BillingCycle): Promise<PixPlanIntentResponse | null> {
    try {
      const res = await apiClient.post<PixPlanIntentResponse>('/subscription/pix-intent', { planSlug, ...(billingCycle ? { billingCycle } : {}) });
      if (res.success && res.data)
        return res.data as PixPlanIntentResponse;
    }
    catch { }
    return null;
  }
  public clearCache(): void {
    cachedStatus = null;
  }
}
export const subscriptionService = new SubscriptionService();
