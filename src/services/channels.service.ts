import type { InstagramAccount, WhatsAppInstance, WhatsappConnectResponse, WhatsAppStatusResponse, WhatsAppQRCodeRawResponse, WhatsAppCreateResponse } from '@/types/Channel';
import { apiClient } from '@/utils/ApiClient';

class ChannelsService {
  public async getWhatsAppInstances(): Promise<WhatsAppInstance[]> {
    const response = await apiClient.get<WhatsAppInstance[]>('/channels/whatsapp');
    if (!response.success || !response.data) throw new Error('Falha ao buscar instâncias do WhatsApp. Tente novamente.');
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
    if (!response.success || !response.data) throw new Error('Não foi possível criar a instância do WhatsApp. Tente novamente.');
    return response.data as WhatsAppCreateResponse;
  }

  public async connectWhatsAppInstance(
    channelId: string,
    phone?: string,
  ): Promise<WhatsappConnectResponse> {
    const response = await apiClient.post<WhatsappConnectResponse>(`/channels/whatsapp/${channelId}/connect`, {
      phone,
    });
    if (!response.success || !response.data) throw new Error('Não foi possível conectar a instância do WhatsApp. Tente novamente.');
    return response.data as WhatsappConnectResponse;
  }

  public async getWhatsAppQRCode(channelId: string): Promise<WhatsAppQRCodeRawResponse> {
    const response = await apiClient.get<WhatsAppQRCodeRawResponse>(`/channels/whatsapp/${channelId}/qrcode`);
    if (!response.success || !response.data) throw new Error('Não foi possível obter o QR code. Tente novamente.');
    return response.data as WhatsAppQRCodeRawResponse;
  }

  public async getWhatsAppStatus(channelId: string): Promise<WhatsAppStatusResponse> {
    const response = await apiClient.get<WhatsAppStatusResponse>(`/channels/whatsapp/${channelId}/status`);
    if (!response.success || !response.data) throw new Error('Não foi possível obter o status do WhatsApp. Tente novamente.');
    return response.data as WhatsAppStatusResponse;
  }

  public async deleteWhatsAppInstance(id: string): Promise<void> {
    const response = await apiClient.delete(`/channels/whatsapp/${id}`);
    if (!response.success) throw new Error('Não foi possível deletar a instância do WhatsApp. Tente novamente.');
  }

  public async getInstagramAccounts(): Promise<InstagramAccount[]> {
    const response = await apiClient.get<InstagramAccount[]>('/channels/instagram');
    if (!response.success || !response.data) throw new Error('Não foi possível buscar contas do Instagram. Tente novamente.');
    return response.data as InstagramAccount[];
  }

  public async getInstagramOAuthUrl(): Promise<{ url: string }> {
    const response = await apiClient.get<{ url: string }>('/channels/instagram/oauth/url');
    if (!response.success || !response.data) throw new Error('Não foi possível obter a URL de OAuth do Instagram. Tente novamente.');
    return response.data as { url: string };
  }

  public async connectInstagramAccount(code: string): Promise<InstagramAccount> {
    const response = await apiClient.post<InstagramAccount>('/channels/instagram/callback', { code });
    if (!response.success || !response.data) throw new Error('Não foi possível conectar a conta do Instagram. Tente novamente.');
    return response.data as InstagramAccount;
  }

  public async deleteInstagramAccount(id: string): Promise<void> {
    const response = await apiClient.delete(`/channels/instagram/${id}`);
    if (!response.success) throw new Error('Não foi possível deletar a conta do Instagram. Tente novamente.');
  }
}

export const channelsService = new ChannelsService();
