import type {
  BoardFilters,
  FunnelBoard,
  FunnelColumn,
  FunnelLead,
  FunnelStageDefinition,
  StageColor,
  StagePayload,
  UpdateLeadPayload,
} from '@/types/Funnel';
import { apiClient } from '@/utils/ApiClient';

type QueryValue = string | number | undefined;

function buildQuery(params: Record<string, QueryValue>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      qs.append(key, String(value));
    }
  }
  const serialized = qs.toString();
  return serialized ? `?${serialized}` : '';
}

class FunnelService {
  public async getBoard(filters: BoardFilters = {}, limitPerStage = 20): Promise<FunnelBoard> {
    const query = buildQuery({ ...filters, limitPerStage });
    const response = await apiClient.get<FunnelBoard>(`/funnel/board${query}`);
    if (!response.success || !response.data) {
      throw new Error('Falha ao carregar o funil. Tente novamente.');
    }
    return response.data;
  }

  public async getStageLeads(
    stageId: string,
    params: BoardFilters & { skip?: number; limit?: number } = {},
  ): Promise<FunnelColumn> {
    const query = buildQuery({ ...params });
    const response = await apiClient.get<FunnelColumn>(`/funnel/stages/${stageId}/leads${query}`);
    if (!response.success || !response.data) {
      throw new Error('Falha ao carregar os leads desta etapa.');
    }
    return response.data;
  }

  public async moveLead(leadId: string, stageId: string, boardOrder: number): Promise<FunnelLead> {
    const response = await apiClient.patch<{ lead: FunnelLead }>(`/funnel/leads/${leadId}/move`, { stageId, boardOrder });
    if (!response.success || !response.data) {
      throw new Error('Falha ao mover o lead.');
    }
    return response.data.lead;
  }

  public async updateLead(leadId: string, payload: UpdateLeadPayload): Promise<FunnelLead> {
    const response = await apiClient.patch<{ lead: FunnelLead }>(`/funnel/leads/${leadId}`, payload);
    if (!response.success || !response.data) {
      throw new Error('Falha ao atualizar o lead.');
    }
    return response.data.lead;
  }

  public async listStages(): Promise<FunnelStageDefinition[]> {
    const response = await apiClient.get<{ stages: FunnelStageDefinition[] }>('/funnel/stages');
    if (!response.success || !response.data) {
      throw new Error('Falha ao carregar as etapas do funil.');
    }
    return response.data.stages;
  }

  public async createStage(name: string, color?: StageColor, aiCriteria?: string): Promise<FunnelStageDefinition> {
    const response = await apiClient.post<{ stage: FunnelStageDefinition }>('/funnel/stages', {
      name,
      ...(color ? { color } : {}),
      ...(aiCriteria !== undefined ? { aiCriteria } : {}),
    });
    if (!response.success || !response.data) {
      throw new Error('Falha ao criar a etapa.');
    }
    return response.data.stage;
  }

  public async updateStage(stageId: string, data: StagePayload): Promise<FunnelStageDefinition> {
    const response = await apiClient.patch<{ stage: FunnelStageDefinition }>(`/funnel/stages/${stageId}`, data);
    if (!response.success || !response.data) {
      throw new Error('Falha ao atualizar a etapa.');
    }
    return response.data.stage;
  }

  public async deleteStage(stageId: string, reassignTo?: string): Promise<void> {
    const query = reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : '';
    const response = await apiClient.delete(`/funnel/stages/${stageId}${query}`);
    if (!response.success) {
      throw new Error('Falha ao excluir a etapa.');
    }
  }

  public async reorderStages(stageIds: string[]): Promise<FunnelStageDefinition[]> {
    const response = await apiClient.patch<{ stages: FunnelStageDefinition[] }>('/funnel/stages/reorder', { stageIds });
    if (!response.success || !response.data) {
      throw new Error('Falha ao reordenar as etapas.');
    }
    return response.data.stages;
  }
}

export const funnelService = new FunnelService();
