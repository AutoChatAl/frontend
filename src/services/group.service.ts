import type { Group, GroupWithContacts, CreateGroupInput, UpdateGroupInput } from '@/types/Group';
import { apiClient } from '@/utils/ApiClient';

class GroupService {
  async listGroups(): Promise<Group[]> {
    return apiClient.get<Group[]>('/groups');
  }

  async getGroup(id: string): Promise<GroupWithContacts> {
    return apiClient.get<GroupWithContacts>(`/groups/${id}`);
  }

  async createGroup(data: CreateGroupInput): Promise<Group> {
    return apiClient.post<Group>('/groups', data);
  }

  async updateGroup(id: string, data: UpdateGroupInput): Promise<Group> {
    return apiClient.put<Group>(`/groups/${id}`, data);
  }

  async deleteGroup(id: string): Promise<void> {
    await apiClient.delete(`/groups/${id}`);
  }

  async setMembers(groupId: string, contactIds: string[]): Promise<void> {
    await apiClient.post(`/groups/${groupId}/members`, { contactIds });
  }
}

export const groupService = new GroupService();
