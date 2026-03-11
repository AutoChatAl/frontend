import type { Contact, ListContactsParams, PaginatedContacts } from '@/types/Contact';
import { apiClient } from '@/utils/ApiClient';

export interface SyncContactsResult {
  ok: boolean;
  created: number;
  updated: number;
}

class ContactService {
  public async listContacts(params?: ListContactsParams): Promise<PaginatedContacts> {
    const queryString = new URLSearchParams();
    if (params?.search) queryString.append('search', params.search);
    if (params?.channelId) queryString.append('channelId', params.channelId);
    if (params?.tagName) queryString.append('tagName', params.tagName);
    if (params?.tagIds) queryString.append('tagIds', params.tagIds);
    if (params?.skip != null) queryString.append('skip', String(params.skip));
    if (params?.limit != null) queryString.append('limit', String(params.limit));

    const url = `/contacts${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return apiClient.get<PaginatedContacts>(url);
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

  /**
   * Sincroniza contatos do Instagram (a partir das conversas DM).
   * Endpoint: POST /channels/instagram/:channelId/contacts/sync
   */
  public async syncInstagramContacts(channelId: string): Promise<{ ok: boolean; upserted: number }> {
    return apiClient.post<{ ok: boolean; upserted: number }>(`/channels/instagram/${channelId}/contacts/sync`);
  }
}

export const contactService = new ContactService();
