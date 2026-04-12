import { apiClient } from '@/utils/ApiClient';
import { extractSubscriptionError } from '@/utils/ErrorHandling';
import type {
  Plan,
  AiPlan,
  SubscriptionStatus_Full,
  UsageSummary,
  Invoice,
  EffectiveLimits,
} from '@/types/Subscription';

export interface SubResult {
  success: boolean;
  error?: string;
}

let cachedStatus: SubscriptionStatus_Full | null = null;

class SubscriptionService {
  async getStatus(): Promise<SubscriptionStatus_Full | null> {
    if (cachedStatus) return cachedStatus;
    try {
      const res = await apiClient.get<SubscriptionStatus_Full>('/subscription/status');
      if (res.success && res.data) {
        cachedStatus = res.data as SubscriptionStatus_Full;
        return cachedStatus;
      }
    } catch {}
    return null;
  }

  async getUsage(): Promise<UsageSummary | null> {
    try {
      const res = await apiClient.get<UsageSummary>('/subscription/usage');
      if (res.success && res.data) return res.data as UsageSummary;
    } catch {}
    return null;
  }

  async getLimits(): Promise<EffectiveLimits | null> {
    try {
      const res = await apiClient.get<EffectiveLimits>('/subscription/limits');
      if (res.success && res.data) return res.data as EffectiveLimits;
    } catch {}
    return null;
  }

  async getPlans(): Promise<Plan[]> {
    try {
      const res = await apiClient.get<Plan[]>('/subscription/plans');
      if (res.success && res.data) return res.data as Plan[];
    } catch {}
    return [];
  }

  async getAiPlans(): Promise<AiPlan[]> {
    try {
      const res = await apiClient.get<AiPlan[]>('/subscription/ai-plans');
      if (res.success && res.data) return res.data as AiPlan[];
    } catch {}
    return [];
  }

  async getInvoices(): Promise<Invoice[]> {
    try {
      const res = await apiClient.get<Invoice[]>('/subscription/invoices');
      if (res.success && res.data) return res.data as Invoice[];
    } catch {}
    return [];
  }

  async createCheckoutSession(planSlug: string, successUrl: string, cancelUrl: string): Promise<string | null> {
    try {
      const res = await apiClient.post<{ url: string }>('/subscription/checkout', { planSlug, successUrl, cancelUrl });
      if (res.success && res.data) return (res.data as { url: string }).url;
    } catch {}
    return null;
  }

  async changePlan(planSlug: string): Promise<SubResult> {
    const res = await apiClient.post('/subscription/change-plan', { planSlug });
    if (res.success) return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }

  async cancelSubscription(): Promise<SubResult> {
    const res = await apiClient.post('/subscription/cancel', {});
    if (res.success) return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }

  async reactivateSubscription(): Promise<SubResult> {
    const res = await apiClient.post('/subscription/reactivate', {});
    if (res.success) return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }

  async addOrChangeAiPlan(aiPlanSlug: string): Promise<SubResult> {
    const res = await apiClient.post('/subscription/ai-plan', { aiPlanSlug });
    if (res.success) return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }

  async removeAiPlan(): Promise<SubResult> {
    const res = await apiClient.delete('/subscription/ai-plan');
    if (res.success) return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }

  async addExtraInstance(): Promise<SubResult> {
    const res = await apiClient.post('/subscription/extra/instance', {});
    if (res.success) return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }

  async removeExtraInstance(): Promise<SubResult> {
    const res = await apiClient.delete('/subscription/extra/instance');
    if (res.success) return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }

  async addExtraCollaborator(): Promise<SubResult> {
    const res = await apiClient.post('/subscription/extra/collaborator', {});
    if (res.success) return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }

  async removeExtraCollaborator(): Promise<SubResult> {
    const res = await apiClient.delete('/subscription/extra/collaborator');
    if (res.success) return { success: true };
    return { success: false, error: extractSubscriptionError(res) };
  }

  async getPortalUrl(returnUrl?: string): Promise<{ url?: string; error?: string }> {
    const res = await apiClient.post<{ url: string }>('/subscription/portal', { returnUrl });
    if (res.success && res.data) return { url: (res.data as { url: string }).url };
    return { error: extractSubscriptionError(res) };
  }

  async subscribe(
    planSlug: string,
    paymentMethodId: string,
    personal: { name?: string; cpf?: string; phone?: string },
  ): Promise<{ success: boolean; requiresAction?: boolean; clientSecret?: string } | null> {
    try {
      const res = await apiClient.post<{ success: boolean; requiresAction?: boolean; clientSecret?: string }>(
        '/subscription/subscribe',
        { planSlug, paymentMethodId, ...personal },
      );
      if (res.success && res.data) return res.data as { success: boolean; requiresAction?: boolean; clientSecret?: string };
    } catch {}
    return null;
  }

  async createSetupIntent(): Promise<string | null> {
    try {
      const res = await apiClient.post<{ clientSecret: string }>('/subscription/setup-intent', {});
      if (res.success && res.data) return (res.data as { clientSecret: string }).clientSecret;
    } catch {}
    return null;
  }

  async savePaymentMethod(paymentMethodId: string): Promise<{ last4: string | null; brand: string | null } | null> {
    try {
      const res = await apiClient.post<{ last4: string | null; brand: string | null }>('/subscription/payment-method', { paymentMethodId });
      if (res.success && res.data) return res.data as { last4: string | null; brand: string | null };
    } catch {}
    return null;
  }

  async createPixIntentForExtra(type: 'instance' | 'collaborator'): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    qrCodeImageUrl: string | null;
    qrCodeString: string | null;
    expiresAt: string | null;
    amount: number;
    description: string;
  } | null> {
    try {
      const res = await apiClient.post<any>('/subscription/pix-extra', { type });
      if (res.success && res.data) return res.data;
    } catch {}
    return null;
  }

  async createPixIntent(planSlug: string): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    qrCodeImageUrl: string | null;
    qrCodeString: string | null;
    expiresAt: string | null;
    amount: number;
    planName: string;
  } | null> {
    try {
      const res = await apiClient.post<any>('/subscription/pix-intent', { planSlug });
      if (res.success && res.data) return res.data;
    } catch {}
    return null;
  }

  clearCache() {
    cachedStatus = null;
  }
}

export const subscriptionService = new SubscriptionService();
