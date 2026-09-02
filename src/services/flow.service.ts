import type { CreateFlowPayload, Flow, UpdateFlowPayload } from '@/types/Flow';
import { apiClient } from '@lib/ApiClient';

class FlowService {
  public async list(): Promise<Flow[]> {
    const response = await apiClient.get<{ flows: Flow[] }>('/flows');
    if (!response.success || !response.data) {
      throw new Error('Falha ao carregar os fluxos.');
    }
    return response.data.flows;
  }

  public async getById(flowId: string): Promise<Flow> {
    const response = await apiClient.get<{ flow: Flow }>(`/flows/${flowId}`);
    if (!response.success || !response.data) {
      throw new Error('Falha ao carregar o fluxo.');
    }
    return response.data.flow;
  }

  public async create(payload: CreateFlowPayload): Promise<Flow> {
    const response = await apiClient.post<{ flow: Flow }>('/flows', payload);
    if (!response.success || !response.data) {
      throw new Error('Falha ao criar o fluxo.');
    }
    return response.data.flow;
  }

  public async update(flowId: string, payload: UpdateFlowPayload): Promise<Flow> {
    const response = await apiClient.put<{ flow: Flow }>(`/flows/${flowId}`, payload);
    if (!response.success || !response.data) {
      throw new Error('Falha ao salvar o fluxo.');
    }
    return response.data.flow;
  }

  public async remove(flowId: string): Promise<void> {
    const response = await apiClient.delete(`/flows/${flowId}`);
    if (!response.success) {
      throw new Error('Falha ao excluir o fluxo.');
    }
  }
}

export const flowService = new FlowService();
