import type {
  CommentAutomation,
  CreateCommentAutomationInput,
  UpdateCommentAutomationInput,
} from '@/types/CommentAutomation';
import { apiClient } from '@/utils/ApiClient';
import { getErrorMessage } from '@/types/ErrorCode';

function throwApiError(response: { data?: unknown }, fallback: string): never {
  const body = response.data as { reason?: string } | undefined;
  throw new Error(body?.reason ? getErrorMessage(body.reason) : fallback);
}

class CommentAutomationService {
  public async list(): Promise<CommentAutomation[]> {
    const response = await apiClient.get<{ data: CommentAutomation[] }>('/comment-automations');
    if (!response.success || !response.data) {
      throwApiError(response, 'Nao foi possivel buscar automacoes de comentario. Tente novamente.');
    }
    const result = response.data as { data: CommentAutomation[] };
    return result.data;
  }

  public async getById(id: string): Promise<CommentAutomation> {
    const response = await apiClient.get<CommentAutomation>(`/comment-automations/${id}`);
    if (!response.success || !response.data) {
      throwApiError(response, 'Nao foi possivel buscar a automacao de comentario. Tente novamente.');
    }
    return response.data as CommentAutomation;
  }

  public async create(input: CreateCommentAutomationInput): Promise<CommentAutomation> {
    const response = await apiClient.post<CommentAutomation>('/comment-automations', input);
    if (!response.success || !response.data) {
      throwApiError(response, 'Nao foi possivel criar a automacao de comentario. Tente novamente.');
    }
    return response.data as CommentAutomation;
  }

  public async update(id: string, input: UpdateCommentAutomationInput): Promise<CommentAutomation> {
    const response = await apiClient.put<CommentAutomation>(`/comment-automations/${id}`, input);
    if (!response.success || !response.data) {
      throwApiError(response, 'Nao foi possivel atualizar a automacao de comentario. Tente novamente.');
    }
    return response.data as CommentAutomation;
  }

  public async delete(id: string): Promise<void> {
    const response = await apiClient.delete(`/comment-automations/${id}`);
    if (!response.success) {
      throwApiError(response, 'Nao foi possivel deletar a automacao de comentario. Tente novamente.');
    }
  }

  public async toggle(id: string): Promise<CommentAutomation> {
    const response = await apiClient.patch<CommentAutomation>(`/comment-automations/${id}/toggle`);
    if (!response.success || !response.data) {
      throwApiError(response, 'Nao foi possivel alternar a automacao de comentario. Tente novamente.');
    }
    return response.data as CommentAutomation;
  }
}

export const commentAutomationService = new CommentAutomationService();