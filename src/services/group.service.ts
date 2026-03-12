import type { Group, GroupWithContacts, CreateGroupInput, UpdateGroupInput } from '@/types/Group';
import { apiClient } from '@/utils/ApiClient';

class GroupService {
  public async listGroups(): Promise<Group[]> {
    const response = await apiClient.get<Group[]>('/groups');
    if (!response.success || !response.data) {
      throw new Error('Falha ao buscar grupos. Tente novamente.');
    }
    return response.data as Group[];
  }

  public async getGroup(id: string): Promise<GroupWithContacts> {
    const response = await apiClient.get<GroupWithContacts>(`/groups/${id}`);
    if (!response.success || !response.data) {
      throw new Error('Falha ao buscar grupo. Tente novamente.');
    }
    return response.data as GroupWithContacts;
  }

  public async createGroup(data: CreateGroupInput): Promise<Group> {
    const response = await apiClient.post<Group>('/groups', data);
    if (!response.success || !response.data) {
      throw new Error('Falha ao criar grupo. Tente novamente.');
    }
    return response.data as Group;
  }

  public async updateGroup(id: string, data: UpdateGroupInput): Promise<Group> {
    const response = await apiClient.put<Group>(`/groups/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error('Falha ao atualizar grupo. Tente novamente.');
    }
    return response.data as Group;
  }

  public async deleteGroup(id: string): Promise<void> {
    const response = await apiClient.delete(`/groups/${id}`);
    if (!response.success) {
      throw new Error('Falha ao deletar grupo. Tente novamente.');
    }
  }

  public async setMembers(groupId: string, contactIds: string[]): Promise<void> {
    const response = await apiClient.post(`/groups/${groupId}/members`, { contactIds });
    if (!response.success) {
      throw new Error('Falha ao definir membros do grupo. Tente novamente.');
    }
  }
}

export const groupService = new GroupService();
