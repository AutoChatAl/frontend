import type { KnowledgeEntry, KnowledgeEntryPayload, KnowledgePage, KnowledgePreview } from '@/types/Knowledge';
import { apiClient } from '@/utils/ApiClient';

class KnowledgeService {
  public async list(params: { page?: number; pageSize?: number; search?: string } = {}): Promise<KnowledgePage> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.search?.trim()) query.set('search', params.search.trim());
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await apiClient.get<KnowledgePage>(`/ai/knowledge${suffix}`);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível carregar a base de conhecimento.');
    }
    return response.data;
  }

  public async create(payload: KnowledgeEntryPayload): Promise<KnowledgeEntry> {
    const response = await apiClient.post<KnowledgeEntry>('/ai/knowledge', payload);
    if (!response.success || !response.data) {
      // O código de negócio vem no corpo da resposta de erro, e o limite é o
      // único caso em que a mensagem genérica não diria o que fazer.
      const reason = (response.data as { reason?: string } | undefined)?.reason;
      throw new Error(reason === 'KNOWLEDGE_LIMIT_EXCEEDED'
        ? 'Você atingiu o limite de perguntas cadastradas.'
        : 'Não foi possível salvar a pergunta.');
    }
    return response.data;
  }

  public async update(id: string, payload: Partial<KnowledgeEntryPayload>): Promise<KnowledgeEntry> {
    const response = await apiClient.patch<KnowledgeEntry>(`/ai/knowledge/${id}`, payload);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível salvar a alteração.');
    }
    return response.data;
  }

  public async remove(id: string): Promise<void> {
    const response = await apiClient.delete(`/ai/knowledge/${id}`);
    if (!response.success) {
      throw new Error('Não foi possível remover a pergunta.');
    }
  }

  /** Testa uma mensagem contra a base sem envolver a IA nem o cliente. */
  public async preview(message: string): Promise<KnowledgePreview> {
    const response = await apiClient.post<KnowledgePreview>('/ai/knowledge/preview', { message });
    if (!response.success || !response.data) {
      throw new Error('Não foi possível testar a pergunta.');
    }
    return response.data;
  }
}

export const knowledgeService = new KnowledgeService();
