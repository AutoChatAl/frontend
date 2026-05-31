import type {
  AbandonedCart,
  AbandonedCartsSummary,
  CartRecoveryIntegration,
  CreateIntegrationInput,
  ListCartsParams,
  PaginatedCarts,
  UpdateIntegrationInput,
} from '@/types/CartRecovery';
import { apiClient } from '@/utils/ApiClient';

class CartRecoveryService {
  public async listIntegrations(): Promise<CartRecoveryIntegration[]> {
    const response = await apiClient.get<{ data: CartRecoveryIntegration[] }>('/cart-recovery/integrations');
    if (!response.success || !response.data) throw new Error('Falha ao listar integrações.');
    return response.data.data ?? [];
  }

  public async getIntegration(id: string): Promise<CartRecoveryIntegration> {
    const response = await apiClient.get<CartRecoveryIntegration>(`/cart-recovery/integrations/${id}`);
    if (!response.success || !response.data) throw new Error('Falha ao buscar integração.');
    return response.data;
  }

  public async createIntegration(input: CreateIntegrationInput): Promise<CartRecoveryIntegration> {
    const response = await apiClient.post<CartRecoveryIntegration & { reason?: string }>('/cart-recovery/integrations', input);
    if (!response.success || !response.data) {
      const reason = (response.data as { reason?: string } | undefined)?.reason;
      if (reason === 'CART_RECOVERY_INTEGRATION_LIMIT_EXCEEDED') {
        throw new Error('Você atingiu o limite de integrações de recuperação do seu plano. Faça upgrade para criar mais.');
      }
      if (reason === 'CHANNEL_NOT_FOUND') {
        throw new Error('Canal selecionado não foi encontrado.');
      }
      if (reason === 'CHANNEL_TYPE_MISMATCH') {
        throw new Error('O canal selecionado não corresponde ao tipo escolhido.');
      }
      throw new Error('Falha ao criar integração.');
    }
    return response.data;
  }

  public async updateIntegration(id: string, input: UpdateIntegrationInput): Promise<CartRecoveryIntegration> {
    const response = await apiClient.put<CartRecoveryIntegration>(`/cart-recovery/integrations/${id}`, input);
    if (!response.success || !response.data) throw new Error('Falha ao atualizar integração.');
    return response.data;
  }

  public async deleteIntegration(id: string): Promise<void> {
    const response = await apiClient.delete(`/cart-recovery/integrations/${id}`);
    if (!response.success) throw new Error('Falha ao excluir integração.');
  }

  public async toggleIntegration(id: string): Promise<CartRecoveryIntegration> {
    const response = await apiClient.patch<CartRecoveryIntegration>(`/cart-recovery/integrations/${id}/toggle`);
    if (!response.success || !response.data) throw new Error('Falha ao alternar integração.');
    return response.data;
  }

  public async listCarts(params?: ListCartsParams): Promise<PaginatedCarts> {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.integrationId) qs.append('integrationId', params.integrationId);
    if (params?.platform) qs.append('platform', params.platform);
    if (params?.search) qs.append('search', params.search);
    if (params?.skip != null) qs.append('skip', String(params.skip));
    if (params?.limit != null) qs.append('limit', String(params.limit));

    const url = `/cart-recovery/carts${qs.toString() ? `?${qs.toString()}` : ''}`;
    const response = await apiClient.get<PaginatedCarts>(url);
    if (!response.success || !response.data) throw new Error('Falha ao listar carrinhos.');
    return response.data;
  }

  public async getCart(id: string): Promise<AbandonedCart> {
    const response = await apiClient.get<AbandonedCart>(`/cart-recovery/carts/${id}`);
    if (!response.success || !response.data) throw new Error('Falha ao buscar carrinho.');
    return response.data;
  }

  public async deleteCart(id: string): Promise<void> {
    const response = await apiClient.delete(`/cart-recovery/carts/${id}`);
    if (!response.success) throw new Error('Falha ao excluir carrinho.');
  }

  public async getSummary(sinceDays = 30): Promise<AbandonedCartsSummary> {
    const response = await apiClient.get<AbandonedCartsSummary>(
      `/cart-recovery/summary?sinceDays=${sinceDays}`,
    );
    if (!response.success || !response.data) throw new Error('Falha ao buscar resumo.');
    return response.data;
  }

  public async getContactsStats(contactIds: string[]): Promise<Array<{
    contactId: string;
    salesCount: number;
    salesValueCents: number;
    abandonedCount: number;
    abandonedValueCents: number;
    lastEventAt?: string;
  }>> {
    if (contactIds.length === 0) return [];
    const url = `/cart-recovery/contacts-stats?contactIds=${encodeURIComponent(contactIds.join(','))}`;
    const response = await apiClient.get<{ data: Array<{
      contactId: string;
      salesCount: number;
      salesValueCents: number;
      abandonedCount: number;
      abandonedValueCents: number;
      lastEventAt?: string;
    }> }>(url);
    if (!response.success || !response.data) return [];
    return response.data.data ?? [];
  }
}

export const cartRecoveryService = new CartRecoveryService();
