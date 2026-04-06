
import type { AiTriggerSettings } from '@/types/AI';
import { defaultAiTriggerSettings } from '@/types/AI';
import { apiClient } from '@/utils/ApiClient';

export interface AiConfig {
  id: string;
  enabled: boolean;
  activeChannelId: string | null;
  segment: string;
  businessName: string;
  assistantName: string;
  tone: string;
  customRules: string;
  triggerSettings: AiTriggerSettings;
  schedulingQueryEnabled: boolean;
  schedulingBookingEnabled: boolean;
}

export interface Product {
  id: string;
  workspaceId: string;
  name: string;
  priceCents: number;
  link: string;
}

export interface AiConfigResponse {
  aiConfig: AiConfig;
  products: Product[];
  visibleTabs?: string[];
}

class AiService {
  public async getConfig(): Promise<AiConfigResponse> {
    const response = await apiClient.get<AiConfigResponse>('/ai/config');
    if (response.success && response.data) {
      return response.data as AiConfigResponse;
    }
    return {
      aiConfig: {
        id: '',
        enabled: false,
        activeChannelId: null,
        segment: '',
        businessName: '',
        assistantName: '',
        tone: 'Amigável e Casual',
        customRules: '',
        triggerSettings: defaultAiTriggerSettings,
        schedulingQueryEnabled: false,
        schedulingBookingEnabled: false,
      },
      products: [],
    };
  }

  public async updateConfig(data: Partial<Pick<AiConfig, 'segment' | 'businessName' | 'assistantName' | 'tone' | 'customRules' | 'triggerSettings' | 'schedulingQueryEnabled' | 'schedulingBookingEnabled'>>): Promise<void> {
    await apiClient.put('/ai/config', data);
  }

  public async activateChannel(channelId: string): Promise<void> {
    const response = await apiClient.post('/ai/config/activate', { channelId });
    if (!response.success) throw new Error('Falha ao ativar canal de IA.');
  }

  public async deactivateAi(channelId?: string): Promise<void> {
    const response = await apiClient.post('/ai/config/deactivate', channelId ? { channelId } : {});
    if (!response.success) throw new Error('Falha ao desativar IA.');
  }

  public async listChannels(): Promise<Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    createdBy: string | null;
    ownerName: string | null;
    ownerEmail: string | null;
    aiEnabled: boolean;
  }>> {
    const response = await apiClient.get<Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      createdBy: string | null;
      ownerName: string | null;
      ownerEmail: string | null;
      aiEnabled: boolean;
    }>>('/ai/channels');
    if (response.success && response.data) {
      return response.data as Array<{
        id: string;
        name: string;
        type: string;
        status: string;
        createdBy: string | null;
        ownerName: string | null;
        ownerEmail: string | null;
        aiEnabled: boolean;
      }>;
    }
    return [];
  }

  public async listProducts(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/ai/products');
    if (response.success && response.data) {
      return response.data as Product[];
    }
    return [];
  }

  public async createProduct(data: { name: string; priceCents?: number; link?: string }): Promise<Product> {
    const response = await apiClient.post<Product>('/ai/products', data);
    return response.data as Product;
  }

  public async updateProduct(id: string, data: { name?: string; priceCents?: number; link?: string }): Promise<Product> {
    const response = await apiClient.put<Product>(`/ai/products/${id}`, data);
    return response.data as Product;
  }

  public async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/ai/products/${id}`);
  }
}

export const aiService = new AiService();
