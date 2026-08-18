import type { AiTriggerSettings, ProductImportMode, ProductImportReport, ProductPayload } from '@/types/AI';
import { defaultAiTriggerSettings } from '@/types/AI';
import { getErrorMessage } from '@/types/ErrorCode';
import { apiClient } from '@/utils/ApiClient';

const IMPORT_TIMEOUT_MS = 120000;
export interface AiConfig {
    id: string;
    enabled: boolean;
    activeChannelId: string | null;
    activeChannelIds?: string[];
    segment: string;
    businessName: string;
    assistantName: string;
    tone: string;
    customRules: string;
    triggerSettings: AiTriggerSettings;
    schedulingQueryEnabled: boolean;
    schedulingBookingEnabled: boolean;
    funnelAutoMoveEnabled: boolean;
}
export interface Product {
    id: string;
    workspaceId: string;
    name: string;
    priceCents: number;
    link: string;
    notes: string;
}
export interface ProductListResult {
    products: Product[];
    total: number;
    page: number;
    pageSize: number;
    maxProducts: number;
}
export interface AiConfigResponse {
    aiConfig: AiConfig;
    products: Product[];
    productsTotal: number;
    productsPageSize: number;
    maxProducts: number;
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
        funnelAutoMoveEnabled: false,
      },
      products: [],
      productsTotal: 0,
      productsPageSize: 50,
      maxProducts: 0,
    };
  }
  public async updateConfig(data: Partial<Pick<AiConfig, 'segment' | 'businessName' | 'assistantName' | 'tone' | 'customRules' | 'triggerSettings' | 'schedulingQueryEnabled' | 'schedulingBookingEnabled' | 'funnelAutoMoveEnabled'>>): Promise<void> {
    const response = await apiClient.put('/ai/config', data);
    if (!response.success) {
      const body = response.data as { reason?: string } | undefined;
      throw new Error(body?.reason ? getErrorMessage(body.reason) : 'Falha ao salvar configurações da IA.');
    }
  }
  public async activateChannel(channelId: string): Promise<void> {
    const response = await apiClient.post('/ai/config/activate', { channelId });
    if (!response.success) {
      const body = response.data as { reason?: string } | undefined;
      throw new Error(body?.reason ? getErrorMessage(body.reason) : 'Falha ao ativar canal de IA.');
    }
  }
  public async deactivateAi(channelId?: string): Promise<void> {
    const response = await apiClient.post('/ai/config/deactivate', channelId ? { channelId } : {});
    if (!response.success)
      throw new Error('Falha ao desativar IA.');
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
  public async listProducts(params: { search?: string; page?: number; pageSize?: number } = {}): Promise<ProductListResult> {
    const query = new URLSearchParams();
    if (params.search?.trim())
      query.set('search', params.search.trim());
    query.set('page', String(params.page ?? 1));
    query.set('pageSize', String(params.pageSize ?? 50));
    const response = await apiClient.get<ProductListResult>(`/ai/products?${query.toString()}`);
    if (response.success && response.data) {
      return response.data as ProductListResult;
    }
    throw new Error('Falha ao carregar os produtos do catálogo.');
  }
  public async createProduct(data: ProductPayload & { name: string }): Promise<Product> {
    const response = await apiClient.post<Product>('/ai/products', data);
    if (!response.success) {
      const body = response.data as { reason?: string } | undefined;
      throw new Error(body?.reason ? getErrorMessage(body.reason) : 'Falha ao adicionar produto.');
    }
    return response.data as Product;
  }
  public async updateProduct(id: string, data: ProductPayload): Promise<Product> {
    const response = await apiClient.put<Product>(`/ai/products/${id}`, data);
    if (!response.success) {
      const body = response.data as { reason?: string } | undefined;
      throw new Error(body?.reason ? getErrorMessage(body.reason) : 'Falha ao atualizar produto.');
    }
    return response.data as Product;
  }
  public async deleteProduct(id: string): Promise<void> {
    const response = await apiClient.delete(`/ai/products/${id}`);
    if (!response.success)
      throw new Error('Falha ao remover produto.');
  }
  public async deleteAllProducts(): Promise<number> {
    const response = await apiClient.delete<{ deleted: number }>('/ai/products');
    if (!response.success)
      throw new Error('Falha ao limpar o catálogo.');
    return (response.data as { deleted: number } | undefined)?.deleted ?? 0;
  }
  public async importProducts(file: File, mode: ProductImportMode): Promise<ProductImportReport> {
    const fileBase64 = await this.readFileAsBase64(file);
    const response = await apiClient.post<ProductImportReport>('/ai/products/import', {
      fileName: file.name,
      fileBase64,
      mode,
    }, { timeoutMs: IMPORT_TIMEOUT_MS });
    if (!response.success || !response.data) {
      const body = response.data as { reason?: string } | undefined;
      throw new Error(body?.reason ? getErrorMessage(body.reason) : 'Falha ao importar a planilha.');
    }
    return response.data as ProductImportReport;
  }
  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const separatorIndex = result.indexOf(',');
        resolve(separatorIndex >= 0 ? result.slice(separatorIndex + 1) : result);
      };
      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo selecionado.'));
      reader.readAsDataURL(file);
    });
  }
}
export const aiService = new AiService();
