import { apiClient } from '@/utils/ApiClient';

export type NotificationType = 'maintenance' | 'feature' | 'bugfix';

export interface Notification {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  type: NotificationType;
  date: string;
  createdAt: string;
}

class NotificationService {
  public async list(): Promise<Notification[]> {
    const response = await apiClient.get<{ data: Notification[] }>('/notifications');
    if (!response.success || !response.data) return [];
    const result = response.data as { data: Notification[] };
    return result.data;
  }

  public async create(input: { title: string; description: string; type: NotificationType; date: string }): Promise<Notification | null> {
    const response = await apiClient.post<{ data: Notification }>('/notifications', input);
    if (!response.success || !response.data) return null;
    const result = response.data as { data: Notification };
    return result.data;
  }

  public async update(id: string, input: { title?: string; description?: string; type?: NotificationType; date?: string }): Promise<Notification | null> {
    const response = await apiClient.put<{ data: Notification }>(`/notifications/${id}`, input);
    if (!response.success || !response.data) return null;
    const result = response.data as { data: Notification };
    return result.data;
  }

  public async delete(id: string): Promise<boolean> {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.success;
  }
}

export const notificationService = new NotificationService();
