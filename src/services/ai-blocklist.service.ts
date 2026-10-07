import type { AiBlockedContact } from '@/types/AI';
import { getErrorMessage } from '@/types/ErrorCode';
import { apiClient } from '@/utils/ApiClient';

class AiBlocklistService {
  public async list(): Promise<AiBlockedContact[]> {
    const response = await apiClient.get<{ contacts: AiBlockedContact[] }>('/ai/blocked-contacts');
    if (!response.success || !response.data)
      throw new Error('Não foi possível carregar a lista de bloqueio da IA.');
    return response.data.contacts;
  }

  public async block(contactIds: string[]): Promise<AiBlockedContact[]> {
    const response = await apiClient.post<{ contacts: AiBlockedContact[] }>('/ai/blocked-contacts', { contactIds });
    if (!response.success || !response.data?.contacts) {
      const body = response.data as { reason?: string } | undefined;
      throw new Error(body?.reason ? getErrorMessage(body.reason) : 'Não foi possível bloquear o contato. Tente de novo.');
    }
    return response.data.contacts;
  }

  public async unblock(contactId: string): Promise<void> {
    const response = await apiClient.delete(`/ai/blocked-contacts/${contactId}`);
    if (!response.success)
      throw new Error('Não foi possível tirar o contato da lista de bloqueio. Tente de novo.');
  }
}

export const aiBlocklistService = new AiBlocklistService();
