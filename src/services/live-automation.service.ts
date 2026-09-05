import { getErrorMessage } from '@/types/ErrorCode';
import type { CreateLiveAutomationInput, LiveAutomation, UpdateLiveAutomationInput } from '@/types/LiveAutomation';
import { apiClient } from '@/utils/ApiClient';

function throwApiError(response: { data?: unknown }, fallback: string): never {
  const body = response.data as { reason?: string } | undefined;
  throw new Error(body?.reason ? getErrorMessage(body.reason) : fallback);
}

class LiveAutomationService {
  public async list(): Promise<LiveAutomation[]> {
    const response = await apiClient.get<{ data: LiveAutomation[] }>('/live-automations');
    if (!response.success || !response.data) {
      throwApiError(response, 'Não foi possível buscar as automações de live. Tente novamente.');
    }
    return (response.data as { data: LiveAutomation[] }).data;
  }
  public async getById(id: string): Promise<LiveAutomation> {
    const response = await apiClient.get<LiveAutomation>(`/live-automations/${id}`);
    if (!response.success || !response.data) {
      throwApiError(response, 'Não foi possível buscar a automação de live. Tente novamente.');
    }
    return response.data as LiveAutomation;
  }
  public async create(input: CreateLiveAutomationInput): Promise<LiveAutomation> {
    const response = await apiClient.post<LiveAutomation>('/live-automations', input);
    if (!response.success || !response.data) {
      throwApiError(response, 'Não foi possível criar a automação de live. Tente novamente.');
    }
    return response.data as LiveAutomation;
  }
  public async update(id: string, input: UpdateLiveAutomationInput): Promise<LiveAutomation> {
    const response = await apiClient.put<LiveAutomation>(`/live-automations/${id}`, input);
    if (!response.success || !response.data) {
      throwApiError(response, 'Não foi possível atualizar a automação de live. Tente novamente.');
    }
    return response.data as LiveAutomation;
  }
  public async delete(id: string): Promise<void> {
    const response = await apiClient.delete(`/live-automations/${id}`);
    if (!response.success) {
      throwApiError(response, 'Não foi possível deletar a automação de live. Tente novamente.');
    }
  }
  public async toggle(id: string): Promise<LiveAutomation> {
    const response = await apiClient.patch<LiveAutomation>(`/live-automations/${id}/toggle`);
    if (!response.success || !response.data) {
      throwApiError(response, 'Não foi possível alternar a automação de live. Tente novamente.');
    }
    return response.data as LiveAutomation;
  }
}

export const liveAutomationService = new LiveAutomationService();
