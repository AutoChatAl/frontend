import { apiClient } from '@/utils/ApiClient';

export interface Tag {
  id: string;
  name: string;
  workspaceId: string;
}

interface BackendResponse<T> {
  data: T;
}

class TagService {
  public async listTags(): Promise<Tag[]> {
    const response = await apiClient.get<BackendResponse<Tag[]>>('/tags');
    if (!response.success || !response.data) throw new Error('Falha ao buscar tags.');
    return response.data.data;
  }

  public async createTag(name: string): Promise<Tag> {
    const response = await apiClient.post<BackendResponse<Tag>>('/tags', { name });
    if (!response.success || !response.data) throw new Error('Falha ao criar tag.');
    return response.data.data;
  }

  public async deleteTag(tagId: string): Promise<void> {
    const response = await apiClient.delete(`/tags/${tagId}`);
    if (!response.success) throw new Error('Falha ao excluir tag.');
  }
}

export const tagService = new TagService();
