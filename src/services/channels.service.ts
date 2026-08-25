import type { ChannelMessageStats, InstagramAccount, InstagramMedia, WhatsAppInstance, WhatsappConnectResponse, WhatsAppStatusResponse, WhatsAppQRCodeRawResponse, WhatsAppCreateResponse } from '@/types/Channel';
import { getErrorMessage } from '@/types/ErrorCode';
import { apiClient } from '@/utils/ApiClient';

function throwApiError(response: {
    data?: unknown;
}, fallback: string): never {
  const body = response.data as {
        reason?: string;
    } | undefined;
  throw new Error(body?.reason ? getErrorMessage(body.reason) : fallback);
}
class ChannelsService {
  /** Enviadas por tipo de canal — alimenta o resumo da página de Canais. */
  public async getMessageStats(days = 7): Promise<ChannelMessageStats> {
    const response = await apiClient.get<{
            data: ChannelMessageStats;
        }>(`/channels/message-stats?days=${days}`);
    if (!response.success || !response.data)
      throwApiError(response, 'Nao foi possivel carregar as mensagens por canal. Tente novamente.');
    return (response.data as {
            data: ChannelMessageStats;
        }).data;
  }
  public async getWhatsAppInstances(): Promise<WhatsAppInstance[]> {
    const response = await apiClient.get<WhatsAppInstance[]>('/channels/whatsapp');
    if (!response.success || !response.data)
      throwApiError(response, 'Falha ao buscar instancias do WhatsApp. Tente novamente.');
    const instances = response.data as WhatsAppInstance[];
    return instances.map((inst) => {
      const phoneNumber = inst.number ?? inst.whatsapp?.phoneNumber;
      return {
        ...inst,
        number: phoneNumber ?? '',
      };
    });
  }
  public async createWhatsAppInstance(data: {
        name?: string;
        systemName?: string;
        baseUrl?: string;
        autoConnect?: boolean;
    }): Promise<WhatsAppCreateResponse> {
    const response = await apiClient.post<WhatsAppCreateResponse>('/channels/whatsapp', data);
    if (!response.success || !response.data)
      throwApiError(response, 'Nao foi possivel criar a instancia do WhatsApp. Tente novamente.');
    return response.data as WhatsAppCreateResponse;
  }
  public async connectWhatsAppInstance(channelId: string, phone?: string): Promise<WhatsappConnectResponse> {
    const response = await apiClient.post<WhatsappConnectResponse>(`/channels/whatsapp/${channelId}/connect`, {
      phone,
    });
    if (!response.success || !response.data)
      throwApiError(response, 'Nao foi possivel conectar a instancia do WhatsApp. Tente novamente.');
    return response.data as WhatsappConnectResponse;
  }
  public async getWhatsAppQRCode(channelId: string): Promise<WhatsAppQRCodeRawResponse> {
    const response = await apiClient.get<WhatsAppQRCodeRawResponse>(`/channels/whatsapp/${channelId}/qrcode`);
    if (!response.success || !response.data)
      throwApiError(response, 'Nao foi possivel obter o QR code. Tente novamente.');
    return response.data as WhatsAppQRCodeRawResponse;
  }
  public async getWhatsAppStatus(channelId: string): Promise<WhatsAppStatusResponse> {
    const response = await apiClient.get<WhatsAppStatusResponse>(`/channels/whatsapp/${channelId}/status`);
    if (!response.success || !response.data)
      throwApiError(response, 'Nao foi possivel obter o status do WhatsApp. Tente novamente.');
    return response.data as WhatsAppStatusResponse;
  }
  /** Desliga o canal sem apagar nada: o backend marca a desconexao como manual. */
  public async disconnectWhatsAppInstance(id: string): Promise<void> {
    const response = await apiClient.post(`/channels/whatsapp/${id}/disconnect`);
    if (!response.success)
      throwApiError(response, 'Nao foi possivel desativar a instancia do WhatsApp. Tente novamente.');
  }
  public async renameWhatsAppInstance(id: string, name: string): Promise<void> {
    const response = await apiClient.patch(`/channels/whatsapp/${id}`, { name });
    if (!response.success)
      throwApiError(response, 'Nao foi possivel renomear a instancia do WhatsApp. Tente novamente.');
  }
  public async deleteWhatsAppInstance(id: string): Promise<void> {
    const response = await apiClient.delete(`/channels/whatsapp/${id}`);
    if (!response.success)
      throwApiError(response, 'Nao foi possivel deletar a instancia do WhatsApp. Tente novamente.');
  }
  public async getInstagramAccounts(): Promise<InstagramAccount[]> {
    const response = await apiClient.get<InstagramAccount[]>('/channels/instagram');
    if (!response.success || !response.data)
      throwApiError(response, 'Nao foi possivel buscar contas do Instagram. Tente novamente.');
    return response.data as InstagramAccount[];
  }
  public async getInstagramMedia(channelId: string, limit = 24): Promise<InstagramMedia[]> {
    const response = await apiClient.get<{
            data: InstagramMedia[];
        }>(`/channels/instagram/${channelId}/media?limit=${limit}`);
    if (!response.success || !response.data)
      throwApiError(response, 'Nao foi possivel carregar as publicacoes do Instagram. Tente novamente.');
    return (response.data as { data: InstagramMedia[] }).data;
  }
  public async getInstagramOAuthUrl(): Promise<{
        url: string;
    }> {
    const response = await apiClient.get<{
            url: string;
        }>('/channels/instagram/oauth/url');
    if (!response.success || !response.data)
      throwApiError(response, 'Nao foi possivel obter a URL de OAuth do Instagram. Tente novamente.');
    return response.data as {
            url: string;
        };
  }
  public async connectInstagramAccount(code: string): Promise<InstagramAccount> {
    const response = await apiClient.post<InstagramAccount>('/channels/instagram/callback', { code });
    if (!response.success || !response.data)
      throwApiError(response, 'Nao foi possivel conectar a conta do Instagram. Tente novamente.');
    return response.data as InstagramAccount;
  }
  public async renameInstagramAccount(id: string, name: string): Promise<void> {
    const response = await apiClient.patch(`/channels/instagram/${id}`, { name });
    if (!response.success)
      throwApiError(response, 'Nao foi possivel renomear a conta do Instagram. Tente novamente.');
  }
  public async deleteInstagramAccount(id: string): Promise<void> {
    const response = await apiClient.delete(`/channels/instagram/${id}`);
    if (!response.success)
      throwApiError(response, 'Nao foi possivel deletar a conta do Instagram. Tente novamente.');
  }
}
export const channelsService = new ChannelsService();
