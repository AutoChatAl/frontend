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
    const response = await apiClient.get<PaginatedContacts>(url);
    if (!response.success || !response.data) throw new Error('Falha ao buscar contatos. Tente novamente.');
    return response.data as PaginatedContacts;
  }

  public async getContact(contactId: string): Promise<Contact> {
    const response = await apiClient.get<Contact>(`/contacts/${contactId}`);
    if (!response.success || !response.data) throw new Error('Falha ao buscar contato. Tente novamente.');
    return response.data as Contact;
  }

  public async syncContacts(channelId: string): Promise<SyncContactsResult> {
    const response = await apiClient.post<SyncContactsResult>(`/channels/whatsapp/${channelId}/contacts/sync`);
    if (!response.success || !response.data) throw new Error('Não foi possível sincronizar os contatos. Tente novamente.');
    return response.data as SyncContactsResult;
  }

  public async syncInstagramContacts(channelId: string): Promise<{ ok: boolean; upserted: number }> {
    const response = await apiClient.post<{ ok: boolean; upserted: number }>(`/channels/instagram/${channelId}/contacts/sync`);
    if (!response.success || !response.data) throw new Error('Não foi possível sincronizar os contatos do Instagram. Tente novamente.');
    return response.data as { ok: boolean; upserted: number };
  }
}

export const contactService = new ContactService();
