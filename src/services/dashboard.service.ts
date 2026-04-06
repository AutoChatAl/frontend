import { apiClient } from '@/utils/ApiClient';

export interface DashboardMetrics {
  messagesSent: number;
  messagesFailed: number;
  messagesReceived: number;
  messagesRead: number;
  totalContacts: number;
  activeChannels: number;
  totalCampaigns: number;
  daily: { date: string; sent: number; received: number; read: number }[];
}

export interface ProductRevenue {
  productId: string;
  productName: string;
  count: number;
  totalCents: number;
}

export interface BillingMetrics {
  totalCompleted: number;
  totalRevenueCents: number;
  revenueByProduct: ProductRevenue[];
  dailyRevenue: { date: string; count: number; revenueCents: number }[];
}

export interface CollaboratorMetric {
  userId: string;
  name: string;
  email: string;
  messagesSent: number;
  messagesReceived: number;
  totalContacts: number;
  activeChannels: number;
  totalChannels: number;
}

interface MetricsResponse {
  data: DashboardMetrics;
}

interface BillingResponse {
  data: BillingMetrics;
}

interface CollaboratorsResponse {
  data: CollaboratorMetric[];
}

class DashboardService {
  public async getMetrics(): Promise<DashboardMetrics> {
    const response = await apiClient.get<MetricsResponse>('/dashboard/metrics');
    if (!response.success || !response.data) {
      throw new Error('Falha ao buscar métricas do dashboard. Tente novamente.');
    }
    return (response.data as MetricsResponse).data;
  }

  public async getBillingMetrics(): Promise<BillingMetrics> {
    const response = await apiClient.get<BillingResponse>('/dashboard/billing');
    if (!response.success || !response.data) {
      throw new Error('Falha ao buscar métricas de faturamento. Tente novamente.');
    }
    return (response.data as BillingResponse).data;
  }

  public async getCollaboratorsMetrics(): Promise<CollaboratorMetric[]> {
    const response = await apiClient.get<CollaboratorsResponse>('/dashboard/collaborators-metrics');
    if (!response.success || !response.data) {
      throw new Error('Falha ao buscar métricas de colaboradores. Tente novamente.');
    }
    return (response.data as CollaboratorsResponse).data;
  }
}

export const dashboardService = new DashboardService();
