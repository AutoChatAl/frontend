import { isBusinessType, type BusinessType } from '@/types/BusinessType';
import { apiClient } from '@/utils/ApiClient';

export interface SetupOnboardingState {
  completedSteps: string[];
  skippedSteps: string[];
  stepCompletedAt: Record<string, string>;
  businessType: BusinessType | null;
  startedAt: string | null;
  finishedAt: string | null;
}

interface UpdatePayload {
  completeStep?: string;
  skipStep?: string;
  started?: boolean;
  finished?: boolean;
  businessType?: BusinessType;
}

const EMPTY_STATE: SetupOnboardingState = {
  completedSteps: [],
  skippedSteps: [],
  stepCompletedAt: {},
  businessType: null,
  startedAt: null,
  finishedAt: null,
};

class SetupOnboardingService {
  public async fetch(): Promise<SetupOnboardingState> {
    const response = await apiClient.get<SetupOnboardingState>('/auth/setup-onboarding');
    if (!response.success || !response.data) return { ...EMPTY_STATE };
    return this.normalize(response.data as SetupOnboardingState);
  }

  public async update(payload: UpdatePayload): Promise<SetupOnboardingState> {
    const response = await apiClient.patch<SetupOnboardingState>('/auth/setup-onboarding', payload);
    if (!response.success || !response.data) return { ...EMPTY_STATE };
    return this.normalize(response.data as SetupOnboardingState);
  }

  public async reset(): Promise<SetupOnboardingState> {
    const response = await apiClient.post<SetupOnboardingState>('/auth/setup-onboarding/reset');
    if (!response.success || !response.data) return { ...EMPTY_STATE };
    return this.normalize(response.data as SetupOnboardingState);
  }

  private normalize(state: SetupOnboardingState): SetupOnboardingState {
    return {
      completedSteps: Array.isArray(state.completedSteps) ? state.completedSteps : [],
      skippedSteps: Array.isArray(state.skippedSteps) ? state.skippedSteps : [],
      stepCompletedAt: state.stepCompletedAt && typeof state.stepCompletedAt === 'object' ? state.stepCompletedAt : {},
      businessType: isBusinessType(state.businessType) ? state.businessType : null,
      startedAt: state.startedAt ?? null,
      finishedAt: state.finishedAt ?? null,
    };
  }
}

export const setupOnboardingService = new SetupOnboardingService();
