import { apiClient } from '@/utils/ApiClient';

export interface SetupOnboardingState {
  completedSteps: string[];
  skippedSteps: string[];
  startedAt: string | null;
  finishedAt: string | null;
}

interface UpdatePayload {
  completeStep?: string;
  skipStep?: string;
  started?: boolean;
  finished?: boolean;
}

const EMPTY_STATE: SetupOnboardingState = {
  completedSteps: [],
  skippedSteps: [],
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
      startedAt: state.startedAt ?? null,
      finishedAt: state.finishedAt ?? null,
    };
  }
}

export const setupOnboardingService = new SetupOnboardingService();
