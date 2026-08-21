import type { Contact, ContactImportReport, ListContactsParams, PaginatedContacts } from '@/types/Contact';
import { getErrorMessage } from '@/types/ErrorCode';
import { apiClient } from '@/utils/ApiClient';

const IMPORT_TIMEOUT_MS = 120000;

export interface SyncContactsResult {
    ok: boolean;
    created: number;
    updated: number;
}
class ContactService {
  public async listContacts(params?: ListContactsParams): Promise<PaginatedContacts> {
    const queryString = new URLSearchParams();
    if (params?.search)
      queryString.append('search', params.search);
    if (params?.channelId)
      queryString.append('channelId', params.channelId);
    if (params?.includeUnlinked != null)
      queryString.append('includeUnlinked', String(params.includeUnlinked));
    if (params?.unlinkedOnly != null)
      queryString.append('unlinkedOnly', String(params.unlinkedOnly));
    if (params?.tagName)
      queryString.append('tagName', params.tagName);
    if (params?.tagIds)
      queryString.append('tagIds', params.tagIds);
    if (params?.skip != null)
      queryString.append('skip', String(params.skip));
    if (params?.limit != null)
      queryString.append('limit', String(params.limit));
    const url = `/contacts${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    const response = await apiClient.get<PaginatedContacts>(url);
    if (!response.success || !response.data)
      throw new Error('Falha ao buscar contatos. Tente novamente.');
    return response.data as PaginatedContacts;
  }
  public async getContact(contactId: string): Promise<Contact> {
    const response = await apiClient.get<Contact>(`/contacts/${contactId}`);
    if (!response.success || !response.data)
      throw new Error('Falha ao buscar contato. Tente novamente.');
    return response.data as Contact;
  }
  public async syncContacts(channelId: string): Promise<SyncContactsResult> {
    const response = await apiClient.post<SyncContactsResult>(`/channels/whatsapp/${channelId}/contacts/sync`);
    if (!response.success || !response.data)
      throw new Error('Não foi possível sincronizar os contatos. Tente novamente.');
    return response.data as SyncContactsResult;
  }
  public async updateContact(contactId: string, data: {
        displayName?: string;
        tagIds?: string[];
    }): Promise<Contact> {
    const response = await apiClient.put<{
            data: Contact;
        }>(`/contacts/${contactId}`, data);
    if (!response.success || !response.data)
      throw new Error('Falha ao atualizar contato.');
    return response.data.data;
  }
  public async deleteContact(contactId: string): Promise<void> {
    const response = await apiClient.delete(`/contacts/${contactId}`);
    if (!response.success)
      throw new Error('Falha ao excluir contato.');
  }
  public async syncInstagramContacts(channelId: string): Promise<{
        ok: boolean;
        upserted: number;
    }> {
    const response = await apiClient.post<{
            ok: boolean;
            upserted: number;
        }>(`/channels/instagram/${channelId}/contacts/sync`);
    if (!response.success || !response.data)
      throw new Error('Não foi possível sincronizar os contatos do Instagram. Tente novamente.');
    return response.data as {
            ok: boolean;
            upserted: number;
        };
  }
  public async getHumanQueueSummary(): Promise<{
        waitingCount: number;
    }> {
    const response = await apiClient.get<{
            waitingCount: number;
        }>('/contacts/human-queue/summary');
    if (!response.success || !response.data)
      return { waitingCount: 0 };
    return response.data as {
            waitingCount: number;
        };
  }
  public async importContacts(file: File): Promise<ContactImportReport> {
    const fileBase64 = await this.readFileAsBase64(file);
    const response = await apiClient.post<ContactImportReport>('/contacts/import', {
      fileName: file.name,
      fileBase64,
    }, { timeoutMs: IMPORT_TIMEOUT_MS });
    if (!response.success || !response.data) {
      const body = response.data as { reason?: string } | undefined;
      throw new Error(body?.reason ? getErrorMessage(body.reason) : 'Falha ao importar a planilha de contatos.');
    }
    return response.data as ContactImportReport;
  }
  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const separatorIndex = result.indexOf(',');
        resolve(separatorIndex >= 0 ? result.slice(separatorIndex + 1) : result);
      };
      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo selecionado.'));
      reader.readAsDataURL(file);
    });
  }
  public async markHumanRead(contactId: string): Promise<void> {
    const response = await apiClient.post(`/contacts/${contactId}/mark-human-read`, {});
    if (!response.success)
      throw new Error('Falha ao marcar contato como lido.');
  }
}
export const contactService = new ContactService();
