import { getErrorMessage } from '@/types/ErrorCode';
import type {
  WaMetaBilledPoint,
  WaOfficialOverview,
  WaSignupConfig,
  WaUsageRecord,
  WhatsAppOfficialInstance,
} from '@/types/WhatsAppOfficial';
import { apiClient } from '@/utils/ApiClient';

function throwApiError(response: { data?: unknown }, fallback: string): never {
  const body = response.data as { reason?: string } | undefined;
  throw new Error(body?.reason ? getErrorMessage(body.reason) : fallback);
}

function unwrap<T>(response: { success: boolean; data?: unknown }, fallback: string): T {
  if (!response.success || !response.data) throwApiError(response, fallback);
  const body = response.data as { data?: T };
  if (body.data === undefined) throwApiError(response, fallback);
  return body.data;
}

class WhatsAppOfficialService {
  public async getSignupConfig(): Promise<WaSignupConfig> {
    const response = await apiClient.get('/channels/whatsapp-official/signup-config');
    return unwrap<WaSignupConfig>(response, 'O WhatsApp Oficial ainda não está disponível na sua conta. Fale com o suporte para liberar.');
  }

  public async getInstances(): Promise<WhatsAppOfficialInstance[]> {
    const response = await apiClient.get('/channels/whatsapp-official');
    return unwrap<WhatsAppOfficialInstance[]>(response, 'Não foi possível carregar os números do WhatsApp Oficial. Atualize a página e tente de novo.');
  }

  public async connect(payload: { code: string; wabaId?: string; phoneNumberId?: string }): Promise<WhatsAppOfficialInstance> {
    const response = await apiClient.post('/channels/whatsapp-official/connect', payload, { timeoutMs: 90000 });
    return unwrap<WhatsAppOfficialInstance>(response, 'Não foi possível conectar o número ao WhatsApp Oficial. Tente de novo.');
  }

  public async refreshHealth(channelId: string): Promise<WhatsAppOfficialInstance> {
    const response = await apiClient.post(`/channels/whatsapp-official/${channelId}/refresh`);
    return unwrap<WhatsAppOfficialInstance>(response, 'Não foi possível atualizar as informações do número. Tente de novo.');
  }

  public async renameInstance(channelId: string, name: string): Promise<void> {
    const response = await apiClient.patch(`/channels/whatsapp-official/${channelId}`, { name });
    if (!response.success) throwApiError(response, 'Não foi possível mudar o nome do número. Tente de novo.');
  }

  public async deleteInstance(channelId: string): Promise<void> {
    const response = await apiClient.delete(`/channels/whatsapp-official/${channelId}`);
    if (!response.success) throwApiError(response, 'Não foi possível desconectar o número. Tente de novo.');
  }

  public async getOverview(days = 30, channelId?: string): Promise<WaOfficialOverview> {
    const params = new URLSearchParams({ days: String(days) });
    if (channelId) params.set('channelId', channelId);
    const response = await apiClient.get(`/channels/whatsapp-official/overview?${params.toString()}`);
    return unwrap<WaOfficialOverview>(response, 'Não foi possível carregar o resumo do WhatsApp Oficial. Atualize a página e tente de novo.');
  }

  public async getUsageHistory(opts?: { channelId?: string; limit?: number; skip?: number }): Promise<{ data: WaUsageRecord[]; total: number }> {
    const params = new URLSearchParams();
    if (opts?.channelId) params.set('channelId', opts.channelId);
    if (opts?.limit) params.set('limit', String(opts.limit));
    if (opts?.skip) params.set('skip', String(opts.skip));
    const query = params.toString();
    const response = await apiClient.get(`/channels/whatsapp-official/usage${query ? `?${query}` : ''}`);
    if (!response.success || !response.data) throwApiError(response, 'Não foi possível carregar o histórico de gastos. Tente de novo.');
    const body = response.data as { data?: WaUsageRecord[]; total?: number };
    return { data: body.data ?? [], total: body.total ?? body.data?.length ?? 0 };
  }

  public async getMetaBilling(channelId: string, days = 30): Promise<WaMetaBilledPoint[]> {
    const response = await apiClient.get(`/channels/whatsapp-official/${channelId}/meta-billing?days=${days}`);
    return unwrap<WaMetaBilledPoint[]>(response, 'Não foi possível consultar os gastos na Meta. Tente de novo em alguns instantes.');
  }
}

export const whatsappOfficialService = new WhatsAppOfficialService();
