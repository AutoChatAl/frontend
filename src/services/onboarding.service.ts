import { apiClient } from '@/utils/ApiClient';

export interface OnboardingState {
  completedSteps: string[];
  skippedTours: string[];
  welcomeCompletedAt: string | null;
  finishedAt: string | null;
  version: string | null;
}

interface UpdatePayload {
  completeStep?: string;
  completeSteps?: string[];
  skipTour?: string;
  welcomeCompleted?: boolean;
  finished?: boolean;
  version?: string;
}

const EMPTY_STATE: OnboardingState = {
  completedSteps: [],
  skippedTours: [],
  welcomeCompletedAt: null,
  finishedAt: null,
  version: null,
};

class OnboardingService {
  public async fetch(): Promise<OnboardingState> {
    const response = await apiClient.get<OnboardingState>('/auth/onboarding');
    if (!response.success || !response.data) return { ...EMPTY_STATE };
    return this.normalize(response.data as OnboardingState);
  }

  public async update(payload: UpdatePayload): Promise<OnboardingState> {
    const response = await apiClient.patch<OnboardingState>('/auth/onboarding', payload);
    if (!response.success || !response.data) return { ...EMPTY_STATE };
    return this.normalize(response.data as OnboardingState);
  }

  public async reset(): Promise<OnboardingState> {
    const response = await apiClient.post<OnboardingState>('/auth/onboarding/reset');
    if (!response.success || !response.data) return { ...EMPTY_STATE };
    return this.normalize(response.data as OnboardingState);
  }

  private normalize(state: OnboardingState): OnboardingState {
    return {
      completedSteps: Array.isArray(state.completedSteps) ? state.completedSteps : [],
      skippedTours: Array.isArray(state.skippedTours) ? state.skippedTours : [],
      welcomeCompletedAt: state.welcomeCompletedAt ?? null,
      finishedAt: state.finishedAt ?? null,
      version: state.version ?? null,
    };
  }
}

export const onboardingService = new OnboardingService();
