import type { AutoReply, CreateAutoReplyInput, UpdateAutoReplyInput } from '@/types/AutoReply';
import { apiClient } from '@/utils/ApiClient';

class AutoReplyService {
  public async list(): Promise<AutoReply[]> {
    const result = await apiClient.get<{ data: AutoReply[] }>('/auto-replies');
    return result.data;
  }

  public async getById(id: string): Promise<AutoReply> {
    return apiClient.get<AutoReply>(`/auto-replies/${id}`);
  }

  public async create(input: CreateAutoReplyInput): Promise<AutoReply> {
    return apiClient.post<AutoReply>('/auto-replies', input);
  }

  public async update(id: string, input: UpdateAutoReplyInput): Promise<AutoReply> {
    return apiClient.put<AutoReply>(`/auto-replies/${id}`, input);
  }

  public async delete(id: string): Promise<void> {
    await apiClient.delete(`/auto-replies/${id}`);
  }

  public async toggle(id: string): Promise<AutoReply> {
    return apiClient.patch<AutoReply>(`/auto-replies/${id}/toggle`);
  }
}

export const autoReplyService = new AutoReplyService();
