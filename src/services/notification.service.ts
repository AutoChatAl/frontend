import { apiClient } from '@/utils/ApiClient';

export interface Notification {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  date: string;
  createdAt: string;
}

class NotificationService {
  async list(): Promise<Notification[]> {
    const response = await apiClient.get<{ data: Notification[] }>('/notifications');
    if (!response.success || !response.data) return [];
    const result = response.data as { data: Notification[] };
    return result.data;
  }

  async create(input: { title: string; description: string; date: string }): Promise<Notification | null> {
    const response = await apiClient.post<{ data: Notification }>('/notifications', input);
    if (!response.success || !response.data) return null;
    const result = response.data as { data: Notification };
    return result.data;
  }

  async update(id: string, input: { title?: string; description?: string; date?: string }): Promise<Notification | null> {
    const response = await apiClient.put<{ data: Notification }>(`/notifications/${id}`, input);
    if (!response.success || !response.data) return null;
    const result = response.data as { data: Notification };
    return result.data;
  }

  async delete(id: string): Promise<boolean> {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.success;
  }
}

export const notificationService = new NotificationService();
