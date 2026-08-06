import type { AiSpendRow } from '@/types/AiSpend';
import { apiClient } from '@/utils/ApiClient';

class AiSpendService {
  /** Admin (role 'admin'): gasto de IA de todos os usuários. */
  public async list(): Promise<AiSpendRow[]> {
    const res = await apiClient.get<{ spends: AiSpendRow[] }>('/admin/ai-spends');
    if (!res.success || !res.data) {
      throw new Error('Falha ao buscar gastos com IA.');
    }
    return (res.data as { spends: AiSpendRow[] }).spends;
  }
}

export const aiSpendService = new AiSpendService();
