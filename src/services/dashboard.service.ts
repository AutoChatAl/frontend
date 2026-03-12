import { apiClient } from '@/utils/ApiClient';

export interface DashboardMetrics {
  messagesSent: number;
  messagesFailed: number;
  messagesReceived: number;
  totalContacts: number;
  activeChannels: number;
  totalCampaigns: number;
  daily: { date: string; sent: number; received: number }[];
}

interface MetricsResponse {
  data: DashboardMetrics;
}

class DashboardService {
  public async getMetrics(): Promise<DashboardMetrics> {
    const response = await apiClient.get<MetricsResponse>('/dashboard/metrics');
    if (!response.success || !response.data) {
      throw new Error('Falha ao buscar métricas do dashboard. Tente novamente.');
    }
    return (response.data as MetricsResponse).data;
  }
}

export const dashboardService = new DashboardService();
