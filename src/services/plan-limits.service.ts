import { apiClient } from '@/utils/ApiClient';

export interface PlanLimits {
  maxCampaignsPerWorkspace: number;
  maxAutoRepliesPerWorkspace: number;
  maxInstancesPerChannelType: number;
  maxContactsPerCampaign: number;
  maxContactsPerGroup: number;
  manualDispatchCooldownHours: number;
  maxMessagesPerMonth: number;
}

export interface MessageUsage {
  count: number;
  periodStart: string;
  limit: number;
}

const DEFAULT_LIMITS: PlanLimits = {
  maxCampaignsPerWorkspace: 3,
  maxAutoRepliesPerWorkspace: 3,
  maxInstancesPerChannelType: 3,
  maxContactsPerCampaign: 250,
  maxContactsPerGroup: 250,
  manualDispatchCooldownHours: 2,
  maxMessagesPerMonth: 1000,
};

let cachedLimits: PlanLimits | null = null;

class PlanLimitsService {
  public async getLimits(): Promise<PlanLimits> {
    if (cachedLimits) return cachedLimits;
    try {
      const response = await apiClient.get<PlanLimits>('/plan-limits');
      if (response.success && response.data) {
        cachedLimits = response.data as PlanLimits;
        return cachedLimits;
      }
    } catch {
    }
    return DEFAULT_LIMITS;
  }

  public clearCache() {
    cachedLimits = null;
  }

  public async getMessageUsage(): Promise<MessageUsage> {
    try {
      const response = await apiClient.get<MessageUsage>('/auth/workspace/message-usage');
      if (response.success && response.data) {
        return response.data as MessageUsage;
      }
    } catch {
    }
    return { count: 0, periodStart: new Date().toISOString(), limit: DEFAULT_LIMITS.maxMessagesPerMonth };
  }
}

export const planLimitsService = new PlanLimitsService();
