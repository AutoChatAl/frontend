import type { Campaign, CampaignRun, CreateCampaignInput, UpdateCampaignInput } from '@/types/Campaign';
import { apiClient } from '@/utils/ApiClient';

interface ApiResponse<T> {
  data: T;
}

export class CampaignService {
  /**
   * Lista todas as campanhas
   */
  public async listCampaigns(): Promise<Campaign[]> {
    const response = await apiClient.get<ApiResponse<Campaign[]>>('/campaigns');
    return response.data;
  }

  /**
   * Busca uma campanha específica
   */
  public async getCampaign(campaignId: string): Promise<Campaign> {
    const response = await apiClient.get<ApiResponse<Campaign>>(`/campaigns/${campaignId}`);
    return response.data;
  }

  /**
   * Cria uma nova campanha
   */
  public async createCampaign(input: CreateCampaignInput): Promise<Campaign> {
    const response = await apiClient.post<ApiResponse<Campaign>>('/campaigns', input);
    return response.data;
  }

  /**
   * Atualiza uma campanha existente
   */
  public async updateCampaign(campaignId: string, input: UpdateCampaignInput): Promise<Campaign> {
    const response = await apiClient.put<ApiResponse<Campaign>>(`/campaigns/${campaignId}`, input);
    return response.data;
  }

  /**
   * Inicia o disparo de uma campanha (cria run e jobs)
   */
  public async runCampaign(campaignId: string, paceMs?: number): Promise<CampaignRun> {
    const queryString = paceMs !== undefined ? `?paceMs=${paceMs}` : '';
    const response = await apiClient.post<ApiResponse<CampaignRun>>(
      `/campaigns/${campaignId}/run${queryString}`,
    );
    return response.data;
  }

  /**
   * Processa jobs pendentes (dispara mensagens)
   */
  public async processJobs(limit?: number): Promise<{ sent: number; failed: number; skipped: number }> {
    const queryString = limit !== undefined ? `?limit=${limit}` : '';
    const response = await apiClient.post<ApiResponse<{ sent: number; failed: number; skipped: number }>>(
      `/campaigns/jobs/process${queryString}`,
    );
    return response.data;
  }
}

export const campaignService = new CampaignService();
