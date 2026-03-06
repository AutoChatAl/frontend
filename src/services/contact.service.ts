import type { Contact, ListContactsParams } from '@/types/Contact';
import { apiClient } from '@/utils/ApiClient';

export interface SyncContactsResult {
  ok: boolean;
  created: number;
  updated: number;
}

class ContactService {
  public async listContacts(params?: ListContactsParams): Promise<Contact[]> {
    const queryString = new URLSearchParams();
    if (params?.search) queryString.append('search', params.search);
    if (params?.channelId) queryString.append('channelId', params.channelId);

    const url = `/contacts${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return apiClient.get<Contact[]>(url);
  }

  public async getContact(contactId: string): Promise<Contact> {
    return apiClient.get<Contact>(`/contacts/${contactId}`);
  }

  /**
   * Sincroniza contatos do WhatsApp remoto para o banco local.
   * Endpoint: POST /channels/whatsapp/:channelId/contacts/sync
   */
  public async syncContacts(channelId: string): Promise<SyncContactsResult> {
    return apiClient.post<SyncContactsResult>(`/channels/whatsapp/${channelId}/contacts/sync`);
  }
}

export const contactService = new ContactService();
