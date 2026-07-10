import { getErrorMessage } from '@/types/ErrorCode';
import type {
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
    return unwrap<WaSignupConfig>(response, 'A API Oficial ainda nao foi configurada no servidor.');
  }

  public async getInstances(): Promise<WhatsAppOfficialInstance[]> {
    const response = await apiClient.get('/channels/whatsapp-official');
    return unwrap<WhatsAppOfficialInstance[]>(response, 'Falha ao buscar canais da API Oficial.');
  }

  public async connect(payload: { code: string; wabaId?: string; phoneNumberId?: string }): Promise<WhatsAppOfficialInstance> {
    const response = await apiClient.post('/channels/whatsapp-official/connect', payload);
    return unwrap<WhatsAppOfficialInstance>(response, 'Falha ao conectar a conta oficial do WhatsApp.');
  }

  public async refreshHealth(channelId: string): Promise<WhatsAppOfficialInstance> {
    const response = await apiClient.post(`/channels/whatsapp-official/${channelId}/refresh`);
    return unwrap<WhatsAppOfficialInstance>(response, 'Falha ao atualizar as informacoes da conta.');
  }

  public async deleteInstance(channelId: string): Promise<void> {
    const response = await apiClient.delete(`/channels/whatsapp-official/${channelId}`);
    if (!response.success) throwApiError(response, 'Falha ao desconectar a conta oficial.');
  }

  public async getOverview(days = 30, channelId?: string): Promise<WaOfficialOverview> {
    const params = new URLSearchParams({ days: String(days) });
    if (channelId) params.set('channelId', channelId);
    const response = await apiClient.get(`/channels/whatsapp-official/overview?${params.toString()}`);
    return unwrap<WaOfficialOverview>(response, 'Falha ao carregar o painel da API Oficial.');
  }

  public async getUsageHistory(opts?: { channelId?: string; limit?: number; skip?: number }): Promise<WaUsageRecord[]> {
    const params = new URLSearchParams();
    if (opts?.channelId) params.set('channelId', opts.channelId);
    if (opts?.limit) params.set('limit', String(opts.limit));
    if (opts?.skip) params.set('skip', String(opts.skip));
    const query = params.toString();
    const response = await apiClient.get(`/channels/whatsapp-official/usage${query ? `?${query}` : ''}`);
    return unwrap<WaUsageRecord[]>(response, 'Falha ao carregar o historico de consumo.');
  }
}

export const whatsappOfficialService = new WhatsAppOfficialService();
