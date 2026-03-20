import { apiClient } from '@/utils/ApiClient';

export interface PlanLimits {
  maxCampaignsPerWorkspace: number;
  maxAutoRepliesPerWorkspace: number;
  maxInstancesPerChannelType: number;
  maxContactsPerCampaign: number;
  maxContactsPerGroup: number;
  manualDispatchCooldownHours: number;
}

const DEFAULT_LIMITS: PlanLimits = {
  maxCampaignsPerWorkspace: 3,
  maxAutoRepliesPerWorkspace: 3,
  maxInstancesPerChannelType: 3,
  maxContactsPerCampaign: 250,
  maxContactsPerGroup: 250,
  manualDispatchCooldownHours: 2,
};

let cachedLimits: PlanLimits | null = null;

class PlanLimitsService {
  async getLimits(): Promise<PlanLimits> {
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

  clearCache() {
    cachedLimits = null;
  }
}

export const planLimitsService = new PlanLimitsService();
