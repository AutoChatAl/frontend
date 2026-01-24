
import type { InstagramAccount, WhatsAppInstance } from '@/types/Channel';
import { apiClient } from '@/utils/ApiClient';

class ChannelsService {
  // WhatsApp
  public async getWhatsAppInstances(): Promise<WhatsAppInstance[]> {
    return apiClient.get<WhatsAppInstance[]>('/channels/whatsapp');
  }

  public async createWhatsAppInstance(data: {
    name: string;
    evolutionInstance: string;
  }): Promise<WhatsAppInstance> {
    return apiClient.post<WhatsAppInstance>('/channels/whatsapp', data);
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
