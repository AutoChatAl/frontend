import type { Campaign, CampaignRun, CreateCampaignInput, UpdateCampaignInput } from '@/types/Campaign';
import { apiClient } from '@/utils/ApiClient';

interface BackendResponse<T> {
  data: T;
}

function normalizeId<T extends { id?: string; _id?: string }>(obj: T): T {
  if (!obj.id && obj._id) {
    return { ...obj, id: obj._id };
  }
  return obj;
}

export class CampaignService {
  public async listCampaigns(): Promise<Campaign[]> {
    const response = await apiClient.get<BackendResponse<Campaign[]>>('/campaigns');
    if (!response.success || !response.data) throw new Error('Falha ao buscar campanhas. Tente novamente.');
    return response.data.data;
  }

  public async getCampaign(campaignId: string): Promise<Campaign> {
    const response = await apiClient.get<BackendResponse<Campaign>>(`/campaigns/${campaignId}`);
    if (!response.success || !response.data) throw new Error('Falha ao buscar campanha. Tente novamente.');
    return response.data.data;
  }

  public async createCampaign(input: CreateCampaignInput): Promise<Campaign> {
    const response = await apiClient.post<BackendResponse<Campaign & { _id?: string }>>('/campaigns', input);
    if (!response.success || !response.data) throw new Error('Falha ao criar campanha. Tente novamente.');
    return normalizeId(response.data.data);
  }

  public async updateCampaign(campaignId: string, input: UpdateCampaignInput): Promise<Campaign> {
    const response = await apiClient.put<BackendResponse<Campaign>>(`/campaigns/${campaignId}`, input);
    if (!response.success || !response.data) throw new Error('Falha ao atualizar campanha. Tente novamente.');
    return response.data.data;
  }

  public async runCampaign(campaignId: string, paceMs?: number): Promise<CampaignRun> {
    const queryString = paceMs !== undefined ? `?paceMs=${paceMs}` : '';
    const response = await apiClient.post<BackendResponse<CampaignRun>>(
      `/campaigns/${campaignId}/run${queryString}`,
    );
    if (!response.success || !response.data) throw new Error('Falha ao executar campanha. Tente novamente.');
    return response.data.data;
  }

  public async processJobs(opts?: { limit?: number; runId?: string }): Promise<{ sent: number; failed: number; skipped: number }> {
    const params = new URLSearchParams();
    if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
    if (opts?.runId) params.set('runId', opts.runId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.post<BackendResponse<{ sent: number; failed: number; skipped: number }>>(
      `/campaigns/jobs/process${queryString}`,
    );
    if (!response.success || !response.data) throw new Error('Falha ao processar jobs. Tente novamente.');
    return response.data.data;
  }
}

export const campaignService = new CampaignService();
