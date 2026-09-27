import type { CreateAdLeadPayload } from '@/types/AdLead';
import { apiClient } from '@/utils/ApiClient';

class AdLeadService {
  public async create(payload: CreateAdLeadPayload): Promise<void> {
    const response = await apiClient.post<{ ok: boolean }>('/ad-leads', payload);
    if (!response.success) {
      throw new Error('Não foi possível salvar suas respostas.');
    }
  }
}

export const adLeadService = new AdLeadService();
