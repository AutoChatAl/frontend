import { apiClient } from '@/utils/ApiClient';

export interface AiConfig {
  id: string;
  enabled: boolean;
  activeChannelId: string | null;
  segment: string;
  tone: string;
  customRules: string;
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
}

class AiService {
  async getConfig(): Promise<AiConfigResponse> {
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
        tone: 'Amigável e Casual',
        customRules: '',
      },
      products: [],
    };
  }

  async updateConfig(data: Partial<Pick<AiConfig, 'segment' | 'tone' | 'customRules'>>): Promise<void> {
    await apiClient.put('/ai/config', data);
  }

  async activateChannel(channelId: string): Promise<void> {
    const response = await apiClient.post('/ai/config/activate', { channelId });
    if (!response.success) throw new Error('Falha ao ativar canal de IA.');
  }

  async deactivateAi(): Promise<void> {
    const response = await apiClient.post('/ai/config/deactivate', {});
    if (!response.success) throw new Error('Falha ao desativar IA.');
  }

  async listProducts(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/ai/products');
    if (response.success && response.data) {
      return response.data as Product[];
    }
    return [];
  }

  async createProduct(data: { name: string; priceCents?: number; link?: string }): Promise<Product> {
    const response = await apiClient.post<Product>('/ai/products', data);
    return response.data as Product;
  }

  async updateProduct(id: string, data: { name?: string; priceCents?: number; link?: string }): Promise<Product> {
    const response = await apiClient.put<Product>(`/ai/products/${id}`, data);
    return response.data as Product;
  }

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/ai/products/${id}`);
  }
}

export const aiService = new AiService();
