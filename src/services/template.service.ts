import { getErrorMessage } from '@/types/ErrorCode';
import type { CreateTemplatePayload, WaTemplateComponent, WhatsAppTemplate } from '@/types/WhatsAppOfficial';
import { apiClient } from '@/utils/ApiClient';

function throwApiError(response: { data?: unknown }, fallback: string): never {
  const body = response.data as { reason?: string } | undefined;
  throw new Error(body?.reason ? getErrorMessage(body.reason.split(':')[0] ?? body.reason) : fallback);
}

function unwrap<T>(response: { success: boolean; data?: unknown }, fallback: string): T {
  if (!response.success || !response.data) throwApiError(response, fallback);
  const body = response.data as { data?: T };
  if (body.data === undefined) throwApiError(response, fallback);
  return body.data;
}

class TemplateService {
  public async list(channelId?: string): Promise<WhatsAppTemplate[]> {
    const query = channelId ? `?channelId=${encodeURIComponent(channelId)}` : '';
    const response = await apiClient.get(`/templates${query}`);
    return unwrap<WhatsAppTemplate[]>(response, 'Falha ao buscar templates.');
  }

  public async get(templateId: string): Promise<WhatsAppTemplate> {
    const response = await apiClient.get(`/templates/${templateId}`);
    return unwrap<WhatsAppTemplate>(response, 'Falha ao buscar template.');
  }

  public async create(payload: CreateTemplatePayload): Promise<WhatsAppTemplate> {
    const response = await apiClient.post('/templates', payload);
    return unwrap<WhatsAppTemplate>(response, 'Falha ao criar template.');
  }

  public async update(templateId: string, payload: {
    category?: string;
    components?: WaTemplateComponent[];
    variableExamples?: Record<string, string>;
  }): Promise<WhatsAppTemplate> {
    const response = await apiClient.put(`/templates/${templateId}`, payload);
    return unwrap<WhatsAppTemplate>(response, 'Falha ao atualizar template.');
  }

  public async remove(templateId: string): Promise<void> {
    const response = await apiClient.delete(`/templates/${templateId}`);
    if (!response.success) throwApiError(response, 'Falha ao excluir template.');
  }

  public async sync(channelId: string): Promise<{ synced: number }> {
    const response = await apiClient.post(`/templates/sync?channelId=${encodeURIComponent(channelId)}`);
    return unwrap<{ synced: number }>(response, 'Falha ao sincronizar templates com a Meta.');
  }
}

export const templateService = new TemplateService();
