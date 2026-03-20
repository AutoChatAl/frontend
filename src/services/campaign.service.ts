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

function extractData<T>(response: { success: boolean; data?: unknown }, errorMsg: string): T {
  if (!response.success || !response.data) {
    throw new Error(errorMsg);
  }

  const body = response.data as Record<string, unknown>;

  if ('data' in body && body.data !== undefined) {
    return body.data as T;
  }

  return response.data as T;
}

export class CampaignService {
  public async listCampaigns(): Promise<Campaign[]> {
    const response = await apiClient.get<BackendResponse<Campaign[]>>('/campaigns');
    const data = extractData<Campaign[]>(response, 'Falha ao buscar campanhas. Tente novamente.');
    return Array.isArray(data) ? data.map((c) => normalizeId(c as Campaign & { _id?: string })) : [];
  }

  public async getCampaign(campaignId: string): Promise<Campaign> {
    const response = await apiClient.get<BackendResponse<Campaign>>(`/campaigns/${campaignId}`);
    return extractData<Campaign>(response, 'Falha ao buscar campanha. Tente novamente.');
  }

  public async createCampaign(input: CreateCampaignInput): Promise<Campaign> {
    const response = await apiClient.post<BackendResponse<Campaign & { _id?: string }>>('/campaigns', input);
    const data = extractData<Campaign & { _id?: string }>(response, 'Falha ao criar campanha. Tente novamente.');
    return normalizeId(data);
  }

  public async updateCampaign(campaignId: string, input: UpdateCampaignInput): Promise<Campaign> {
    const response = await apiClient.put<BackendResponse<Campaign>>(`/campaigns/${campaignId}`, input);
    return extractData<Campaign>(response, 'Falha ao atualizar campanha. Tente novamente.');
  }

  public async runCampaign(campaignId: string, paceMs?: number): Promise<CampaignRun> {
    const queryString = paceMs !== undefined ? `?paceMs=${paceMs}` : '';
    const response = await apiClient.post<BackendResponse<CampaignRun>>(
      `/campaigns/${campaignId}/run${queryString}`,
    );
    return extractData<CampaignRun>(response, 'Falha ao executar campanha. Tente novamente.');
  }

  public async processJobs(opts?: { limit?: number; runId?: string }): Promise<{ sent: number; failed: number; skipped: number }> {
    const params = new URLSearchParams();
    if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
    if (opts?.runId) params.set('runId', opts.runId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.post<BackendResponse<{ sent: number; failed: number; skipped: number }>>(
      `/campaigns/jobs/process${queryString}`,
    );
    return extractData<{ sent: number; failed: number; skipped: number }>(response, 'Falha ao processar jobs. Tente novamente.');
  }
}

export const campaignService = new CampaignService();
