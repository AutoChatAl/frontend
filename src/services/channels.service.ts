
import type { InstagramAccount, WhatsAppInstance, WhatsappConnectResponse, WhatsAppStatusResponse, WhatsAppQRCodeRawResponse, WhatsAppCreateResponse } from '@/types/Channel';
import { apiClient } from '@/utils/ApiClient';

class ChannelsService {
  // WhatsApp
  public async getWhatsAppInstances(): Promise<WhatsAppInstance[]> {
    const data = await apiClient.get<WhatsAppInstance[]>('/channels/whatsapp');
    return data.map((inst) => ({
      ...inst,
      number: inst.number ?? inst.whatsapp?.phoneNumber ?? undefined,
    }));
  }

  public async createWhatsAppInstance(data: {
    name?: string;
    systemName?: string;
    baseUrl?: string;
    autoConnect?: boolean;
  }): Promise<WhatsAppCreateResponse> {
    return apiClient.post<WhatsAppCreateResponse>('/channels/whatsapp', data);
  }

  public async connectWhatsAppInstance(
    channelId: string,
    phone?: string,
  ): Promise<WhatsappConnectResponse> {
    return apiClient.post<WhatsappConnectResponse>(`/channels/whatsapp/${channelId}/connect`, {
      phone,
    });
  }

  public async getWhatsAppQRCode(channelId: string): Promise<WhatsAppQRCodeRawResponse> {
    return apiClient.get<WhatsAppQRCodeRawResponse>(`/channels/whatsapp/${channelId}/qrcode`);
  }

  public async getWhatsAppStatus(channelId: string): Promise<WhatsAppStatusResponse> {
    return apiClient.get<WhatsAppStatusResponse>(`/channels/whatsapp/${channelId}/status`);
  }

  public async deleteWhatsAppInstance(id: string): Promise<void> {
    return apiClient.delete(`/channels/whatsapp/${id}`);
  }

  // Instagram
  public async getInstagramAccounts(): Promise<InstagramAccount[]> {
    return apiClient.get<InstagramAccount[]>('/channels/instagram');
  }

  public async getInstagramOAuthUrl(): Promise<{ url: string }> {
    return apiClient.get<{ url: string }>('/channels/instagram/oauth/url');
  }

  public async connectInstagramAccount(code: string): Promise<InstagramAccount> {
    return apiClient.post<InstagramAccount>('/channels/instagram/callback', { code });
  }

  public async deleteInstagramAccount(id: string): Promise<void> {
    return apiClient.delete(`/channels/instagram/${id}`);
  }
}

export const channelsService = new ChannelsService();
