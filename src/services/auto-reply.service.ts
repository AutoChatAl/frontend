import type { AutoReply, CreateAutoReplyInput, UpdateAutoReplyInput } from '@/types/AutoReply';
import { apiClient } from '@/utils/ApiClient';

class AutoReplyService {
  public async list(): Promise<AutoReply[]> {
    const response = await apiClient.get<{ data: AutoReply[] }>('/auto-replies');
    if (!response.success || !response.data) {
      throw new Error('Não foi possível buscar respostas automáticas. Tente novamente.');
    }
    const result = response.data as { data: AutoReply[] };
    return result.data;
  }

  public async getById(id: string): Promise<AutoReply> {
    const response = await apiClient.get<AutoReply>(`/auto-replies/${id}`);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível buscar a resposta automática. Tente novamente.');
    }
    return response.data as AutoReply;
  }

  public async create(input: CreateAutoReplyInput): Promise<AutoReply> {
    const response = await apiClient.post<AutoReply>('/auto-replies', input);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível criar a resposta automática. Tente novamente.');
    }
    return response.data as AutoReply;
  }

  public async update(id: string, input: UpdateAutoReplyInput): Promise<AutoReply> {
    const response = await apiClient.put<AutoReply>(`/auto-replies/${id}`, input);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível atualizar a resposta automática. Tente novamente.');
    }
    return response.data as AutoReply;
  }

  public async delete(id: string): Promise<void> {
    const response = await apiClient.delete(`/auto-replies/${id}`);
    if (!response.success) {
      throw new Error('Não foi possível deletar a resposta automática. Tente novamente.');
    }
  }

  public async toggle(id: string): Promise<AutoReply> {
    const response = await apiClient.patch<AutoReply>(`/auto-replies/${id}/toggle`);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível alternar a resposta automática. Tente novamente.');
    }
    return response.data as AutoReply;
  }
}

export const autoReplyService = new AutoReplyService();
