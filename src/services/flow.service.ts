import type { CreateFlowPayload, Flow, UpdateFlowPayload } from '@/types/Flow';
import type { TransferExport, TransferImportResult } from '@/types/Transfer';
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

  /** Sem `flowId`, leva todos os fluxos do workspace. */
  public async exportCsv(flowId?: string): Promise<TransferExport> {
    const query = flowId ? `?flowId=${encodeURIComponent(flowId)}` : '';
    const response = await apiClient.get<TransferExport>(`/flows/export${query}`);
    if (!response.success || !response.data) {
      throw new Error('Falha ao exportar os fluxos.');
    }
    return response.data;
  }

  public async importCsv(csv: string): Promise<TransferImportResult> {
    const response = await apiClient.post<TransferImportResult>('/flows/import', { csv }, { timeoutMs: 120000 });
    if (!response.success || !response.data) {
      throw new Error('Falha ao importar os fluxos. Confira se o arquivo veio de uma exportação do Synq.');
    }
    return response.data;
  }
}

export const flowService = new FlowService();
