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
    return response.data;
  }
}

export const dashboardService = new DashboardService();
