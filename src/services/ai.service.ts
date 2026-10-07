import type { AiCatalogScope, AiProfile, AiSimulationPayload, AiSimulationResponse, AiTriggerSettings, InstagramProductLayout, ProductImportMode, ProductImportReport, ProductPayload } from '@/types/AI';
import { defaultAiTriggerSettings } from '@/types/AI';
import { getErrorMessage } from '@/types/ErrorCode';
import type { TransferExport, TransferImportResult } from '@/types/Transfer';
import { apiClient } from '@/utils/ApiClient';

const IMPORT_TIMEOUT_MS = 120000;
const SIMULATION_TIMEOUT_MS = 45000;
const SIMULATION_ERROR_MESSAGES: Record<string, string> = {
  AI_SIMULATION_NEEDS_CUSTOMER_MESSAGE: 'Escreva uma mensagem como se fosse o cliente para a IA responder.',
  AI_SIMULATION_UNAVAILABLE: 'A IA não conseguiu responder agora. Tente de novo em instantes.',
  AI_SIMULATION_RATE_LIMITED: 'Você fez muitos testes seguidos. Espere alguns minutos e tente de novo.',
  AI_PLAN_REQUIRED: 'Para testar a IA, você precisa de um plano de IA ativo.',
  VALIDATION_ERROR: 'A mensagem de teste é muito longa ou a conversa ficou grande demais. Reinicie a conversa e tente de novo.',
};
export interface AiConfig {
    id: string;
    profileName?: string;
    profileOrder?: number;
    catalogScope?: AiCatalogScope;
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
    crossSellEnabled: boolean;
    /** Se este perfil consulta a base de conhecimento do workspace. */
    knowledgeEnabled: boolean;
    /** Silêncio, em minutos, antes da retomada automática da IA. 0 = desligado. */
    followUpMinutes?: number;
    /** Texto da retomada. Vazio usa o padrão do backend. */
    followUpMessage?: string;
    instagramProductLayout: InstagramProductLayout;
}
export interface Product {
    id: string;
    workspaceId: string;
    name: string;
    priceCents: number;
    link: string;
    notes: string;
    keywords?: string;
    imageUrl?: string;
    imageUploadedAt?: string | null;
    imagePreviewUrl?: string;
    active?: boolean;
    featured?: boolean;
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
    profiles: AiProfile[];
    activeProfileId: string;
    maxProfiles: number;
    catalogScope: AiCatalogScope;
    products: Product[];
    productsTotal: number;
    productsPageSize: number;
    maxProducts: number;
    maxCustomRulesChars?: number;
    visibleTabs?: string[];
}
export interface AiProfilesResponse {
    profiles: AiProfile[];
    maxProfiles: number;
    catalogScope: AiCatalogScope;
}
class AiService {
  public async getConfig(profileId?: string | null): Promise<AiConfigResponse> {
    const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : '';
    const response = await apiClient.get<AiConfigResponse>(`/ai/config${query}`);
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
        crossSellEnabled: false,
        // Ligado no fallback pelo mesmo motivo do backend: com a base vazia,
        // ligado não faz nada, e desligado esconderia a feature de quem cadastrar.
        knowledgeEnabled: true,
        followUpMinutes: 0,
        followUpMessage: '',
        instagramProductLayout: 'QUICK_REPLY',
      },
      profiles: [],
      activeProfileId: '',
      maxProfiles: 1,
      catalogScope: 'shared',
      products: [],
      productsTotal: 0,
      productsPageSize: 50,
      maxProducts: 0,
    };
  }
  public async listProfiles(): Promise<AiProfilesResponse> {
    const response = await apiClient.get<AiProfilesResponse>('/ai/profiles');
    if (response.success && response.data) {
      return response.data as AiProfilesResponse;
    }
    return { profiles: [], maxProfiles: 1, catalogScope: 'shared' };
  }
  public async createProfile(name?: string): Promise<AiProfile> {
    const response = await apiClient.post<{ profile: AiProfile }>('/ai/profiles', name ? { name } : {});
    if (!response.success || !response.data) {
      const body = response.data as { reason?: string } | undefined;
      throw new Error(body?.reason ? getErrorMessage(body.reason) : 'Falha ao criar o perfil de IA.');
    }
    return (response.data as { profile: AiProfile }).profile;
  }
  public async updateProfile(profileId: string, data: { name?: string; catalogScope?: AiCatalogScope }): Promise<AiProfilesResponse> {
    const response = await apiClient.put<AiProfilesResponse>(`/ai/profiles/${profileId}`, data);
    if (!response.success || !response.data) {
      const body = response.data as { reason?: string } | undefined;
      throw new Error(body?.reason ? getErrorMessage(body.reason) : 'Falha ao atualizar o perfil de IA.');
    }
    return response.data as AiProfilesResponse;
  }
  public async deleteProfile(profileId: string): Promise<{ profiles: AiProfile[]; activeProfileId: string | null }> {
    const response = await apiClient.delete<{ profiles: AiProfile[]; activeProfileId: string | null }>(`/ai/profiles/${profileId}`);
    if (!response.success || !response.data) {
      const body = response.data as { reason?: string } | undefined;
      throw new Error(body?.reason ? getErrorMessage(body.reason) : 'Falha ao excluir o perfil de IA.');
    }
    return response.data as { profiles: AiProfile[]; activeProfileId: string | null };
  }
  public async updateConfig(data: Partial<Pick<AiConfig, 'segment' | 'businessName' | 'assistantName' | 'tone' | 'customRules' | 'triggerSettings' | 'schedulingQueryEnabled' | 'schedulingBookingEnabled' | 'funnelAutoMoveEnabled' | 'crossSellEnabled' | 'knowledgeEnabled' | 'followUpMinutes' | 'followUpMessage' | 'instagramProductLayout'>>, profileId?: string | null): Promise<void> {
    const response = await apiClient.put('/ai/config', profileId ? { ...data, profileId } : data);
    if (!response.success) {
      const body = response.data as { reason?: string } | undefined;
      throw new Error(body?.reason ? getErrorMessage(body.reason) : 'Falha ao salvar configurações da IA.');
    }
  }
  public async activateChannel(channelId: string, profileId?: string | null): Promise<void> {
    const response = await apiClient.post('/ai/config/activate', profileId ? { channelId, profileId } : { channelId });
    if (!response.success) {
      const body = response.data as { reason?: string } | undefined;
      throw new Error(body?.reason ? getErrorMessage(body.reason) : 'Falha ao ativar canal de IA.');
    }
  }
  public async deactivateAi(channelId?: string, profileId?: string | null): Promise<void> {
    const response = await apiClient.post('/ai/config/deactivate', {
      ...(channelId ? { channelId } : {}),
      ...(profileId ? { profileId } : {}),
    });
    if (!response.success)
      throw new Error('Falha ao desativar IA.');
  }
  public async listChannels(): Promise<Array<{
        id: string;
        name: string;
        type: string;
        status: string;
        createdBy: string | null;
        identifier: string;
        ownerName: string | null;
        ownerEmail: string | null;
        aiEnabled: boolean;
        aiProfileId: string | null;
        aiProfileName: string | null;
        aiProfileOwnerName: string | null;
    }>> {
    const response = await apiClient.get<Array<{
            id: string;
            name: string;
            type: string;
            status: string;
            createdBy: string | null;
            identifier: string;
            ownerName: string | null;
            ownerEmail: string | null;
            aiEnabled: boolean;
            aiProfileId: string | null;
            aiProfileName: string | null;
            aiProfileOwnerName: string | null;
        }>>('/ai/channels');
    if (response.success && response.data) {
      return response.data as Array<{
                id: string;
                name: string;
                type: string;
                status: string;
                createdBy: string | null;
                identifier: string;
                ownerName: string | null;
                ownerEmail: string | null;
                aiEnabled: boolean;
                aiProfileId: string | null;
                aiProfileName: string | null;
                aiProfileOwnerName: string | null;
            }>;
    }
    return [];
  }
  public async listProducts(params: { search?: string; page?: number; pageSize?: number; profileId?: string | null } = {}): Promise<ProductListResult> {
    const query = new URLSearchParams();
    if (params.search?.trim())
      query.set('search', params.search.trim());
    if (params.profileId)
      query.set('profileId', params.profileId);
    query.set('page', String(params.page ?? 1));
    query.set('pageSize', String(params.pageSize ?? 50));
    const response = await apiClient.get<ProductListResult>(`/ai/products?${query.toString()}`);
    if (response.success && response.data) {
      return response.data as ProductListResult;
    }
    throw new Error('Falha ao carregar os produtos do catálogo.');
  }
  public async createProduct(data: ProductPayload & { name: string }, profileId?: string | null): Promise<Product> {
    const response = await apiClient.post<Product>('/ai/products', profileId ? { ...data, profileId } : data);
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
  public async uploadProductImage(id: string, file: File): Promise<Product> {
    const imageBase64 = await this.readFileAsBase64(file);
    const response = await apiClient.put<Product>(`/ai/products/${id}/image`, {
      imageBase64,
      imageMimeType: file.type,
    });
    if (!response.success) {
      const body = response.data as { reason?: string } | undefined;
      throw new Error(body?.reason ? getErrorMessage(body.reason) : 'Falha ao enviar a imagem do produto.');
    }
    return response.data as Product;
  }
  public async removeProductImage(id: string): Promise<Product> {
    const response = await apiClient.delete<Product>(`/ai/products/${id}/image`);
    if (!response.success)
      throw new Error('Falha ao remover a imagem do produto.');
    return response.data as Product;
  }
  public async deleteProduct(id: string): Promise<{ layoutChanged: boolean }> {
    const response = await apiClient.delete<{ layoutChanged: boolean }>(`/ai/products/${id}`);
    if (!response.success)
      throw new Error('Falha ao remover produto.');
    return (response.data as { layoutChanged: boolean } | undefined) ?? { layoutChanged: false };
  }
  public async deleteAllProducts(profileId?: string | null): Promise<{ deleted: number; layoutChanged: boolean }> {
    const response = await apiClient.delete<{ deleted: number; layoutChanged: boolean }>(`/ai/products${profileId ? `?profileId=${encodeURIComponent(profileId)}` : ''}`);
    if (!response.success)
      throw new Error('Falha ao limpar o catálogo.');
    return (response.data as { deleted: number; layoutChanged: boolean } | undefined) ?? { deleted: 0, layoutChanged: false };
  }
  public async importProducts(file: File, mode: ProductImportMode, profileId?: string | null): Promise<ProductImportReport> {
    const fileBase64 = await this.readFileAsBase64(file);
    const response = await apiClient.post<ProductImportReport>('/ai/products/import', {
      fileName: file.name,
      fileBase64,
      mode,
      ...(profileId ? { profileId } : {}),
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

  public async simulate(payload: AiSimulationPayload): Promise<string> {
    const response = await apiClient.post<AiSimulationResponse>('/ai/simulate', payload, { timeoutMs: SIMULATION_TIMEOUT_MS });
    const data = response.data as (AiSimulationResponse & { reason?: string }) | undefined;
    if (!response.success || !data?.reply) {
      const reason = data?.reason;
      const knownMessage = reason ? SIMULATION_ERROR_MESSAGES[reason] : undefined;
      if (knownMessage) {
        throw new Error(knownMessage);
      }
      throw new Error(reason ? getErrorMessage(reason) : 'Não foi possível testar a IA agora. Tente de novo em instantes.');
    }
    return data.reply;
  }

  public async exportProfilesCsv(): Promise<TransferExport> {
    const response = await apiClient.get<TransferExport>('/ai/profiles/export');
    if (!response.success || !response.data) {
      throw new Error('Falha ao exportar os perfis de IA.');
    }
    return response.data;
  }

  public async importProfilesCsv(csv: string): Promise<TransferImportResult> {
    const response = await apiClient.post<TransferImportResult>('/ai/profiles/import', { csv }, { timeoutMs: 120000 });
    if (!response.success || !response.data) {
      throw new Error('Falha ao importar os perfis. Confira se o arquivo veio de uma exportação do Synq.');
    }
    return response.data;
  }
}
export const aiService = new AiService();
