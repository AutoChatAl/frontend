import type {
  CommentAutomation,
  CreateCommentAutomationInput,
  UpdateCommentAutomationInput,
} from '@/types/CommentAutomation';
import { apiClient } from '@/utils/ApiClient';

class CommentAutomationService {
  public async list(): Promise<CommentAutomation[]> {
    const response = await apiClient.get<{ data: CommentAutomation[] }>('/comment-automations');
    if (!response.success || !response.data) {
      throw new Error('Não foi possível buscar automações de comentário. Tente novamente.');
    }
    const result = response.data as { data: CommentAutomation[] };
    return result.data;
  }

  public async getById(id: string): Promise<CommentAutomation> {
    const response = await apiClient.get<CommentAutomation>(`/comment-automations/${id}`);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível buscar a automação de comentário. Tente novamente.');
    }
    return response.data as CommentAutomation;
  }

  public async create(input: CreateCommentAutomationInput): Promise<CommentAutomation> {
    const response = await apiClient.post<CommentAutomation>('/comment-automations', input);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível criar a automação de comentário. Tente novamente.');
    }
    return response.data as CommentAutomation;
  }

  public async update(id: string, input: UpdateCommentAutomationInput): Promise<CommentAutomation> {
    const response = await apiClient.put<CommentAutomation>(`/comment-automations/${id}`, input);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível atualizar a automação de comentário. Tente novamente.');
    }
    return response.data as CommentAutomation;
  }

  public async delete(id: string): Promise<void> {
    const response = await apiClient.delete(`/comment-automations/${id}`);
    if (!response.success) {
      throw new Error('Não foi possível deletar a automação de comentário. Tente novamente.');
    }
  }

  public async toggle(id: string): Promise<CommentAutomation> {
    const response = await apiClient.patch<CommentAutomation>(`/comment-automations/${id}/toggle`);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível alternar a automação de comentário. Tente novamente.');
    }
    return response.data as CommentAutomation;
  }
}

export const commentAutomationService = new CommentAutomationService();
