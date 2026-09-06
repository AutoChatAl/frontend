import type { GuardrailPreview, GuardrailsResponse, UpdateGuardrailsPayload, AiGuardrails } from '@/types/Guardrails';
import { apiClient } from '@/utils/ApiClient';

class GuardrailsService {
  public async get(): Promise<GuardrailsResponse> {
    const response = await apiClient.get<GuardrailsResponse>('/ai/guardrails');
    if (!response.success || !response.data) {
      throw new Error('Não foi possível carregar os limites da IA.');
    }
    return response.data;
  }

  public async update(payload: UpdateGuardrailsPayload): Promise<AiGuardrails> {
    const response = await apiClient.patch<AiGuardrails>('/ai/guardrails', payload);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível salvar os limites da IA.');
    }
    return response.data;
  }

  /** Testa um texto contra as regras. Não envia nada ao cliente nem à IA. */
  public async preview(input: { inbound?: string; outbound?: string }): Promise<GuardrailPreview> {
    const response = await apiClient.post<GuardrailPreview>('/ai/guardrails/preview', input);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível testar as regras.');
    }
    return response.data;
  }
}

export const guardrailsService = new GuardrailsService();
