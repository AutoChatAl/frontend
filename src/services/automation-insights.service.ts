import type { AutomationDraftSuggestion, AutomationResult } from '@/types/AutomationInsights';
import { ERROR_MESSAGES, getErrorMessage } from '@/types/ErrorCode';
import { apiClient } from '@/utils/ApiClient';

const DRAFT_ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Descreva a automação com 10 a 600 caracteres.',
  PERMISSION_DENIED: 'Você não tem permissão para criar automações. Peça ao administrador da conta para liberar.',
};

function draftErrorMessage(reason: string | undefined): string {
  const specific = reason ? DRAFT_ERROR_MESSAGES[reason] : undefined;
  if (specific) return specific;
  if (reason && reason in ERROR_MESSAGES) return getErrorMessage(reason);
  return getErrorMessage('AUTOMATION_DRAFT_FAILED');
}

class AutomationInsightsService {
  public async getResults(): Promise<AutomationResult[]> {
    const response = await apiClient.get<{ results: AutomationResult[] }>('/automation-insights/results');
    if (!response.success || !response.data)
      throw new Error('Não foi possível carregar os resultados das automações.');
    return response.data.results;
  }

  public async draftFromText(description: string): Promise<AutomationDraftSuggestion> {
    const response = await apiClient.post<{ draft: AutomationDraftSuggestion }>('/automation-insights/draft', { description });
    if (!response.success || !response.data) {
      const body = response.data as { reason?: string; code?: string } | undefined;
      throw new Error(draftErrorMessage(body?.reason ?? body?.code));
    }
    return response.data.draft;
  }
}

export const automationInsightsService = new AutomationInsightsService();
