import { authService } from '@/services/auth.service';
import type {
  SupportChatConversation,
  SupportChatListFilters,
  SupportChatMessage,
  SupportChatPublicConversation,
  SupportChatSendMessageInput,
  SupportChatSummary,
} from '@/types/SupportChat';
import { apiClient } from '@/utils/ApiClient';
import { getSupportChatErrorMessage } from '@/utils/supportChat';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type ApiErrorPayload = { code?: string; message?: string; reason?: string };

function getWorkspaceIdFromToken(): string | null {
  const token = authService.getToken();
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) return null;
    const payloadRaw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalized = payloadRaw.padEnd(Math.ceil(payloadRaw.length / 4) * 4, '=');
    const decoded = JSON.parse(atob(normalized)) as { workspaceId?: string };
    return decoded.workspaceId || null;
  } catch {
    return null;
  }
}

function makeApiError(defaultMessage: string, statusCode: number, payload?: ApiErrorPayload): Error {
  const err = new Error(
    getSupportChatErrorMessage(payload?.reason || payload?.code, payload?.message || defaultMessage) || defaultMessage,
  ) as Error & { code?: string; statusCode?: number };
  err.code = payload?.code || payload?.reason || 'UNKNOWN_ERROR';
  err.statusCode = statusCode;
  return err;
}

function getData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

class SupportChatService {
  public getPublicWorkspaceId(): string | null {
    return (
      process.env.NEXT_PUBLIC_SUPPORT_WORKSPACE_ID ||
      authService.getUser()?.workspace?.id ||
      getWorkspaceIdFromToken() ||
      null
    );
  }

  public async createPublicConversation(input: {
    workspaceId: string;
    visitorName: string;
    visitorEmail: string;
  }): Promise<SupportChatPublicConversation> {
    const response = await apiClient.post<{ data: SupportChatPublicConversation }>('/support-chat/public/conversations', input);
    if (!response.success || !response.data) {
      throw makeApiError('Não foi possível iniciar o atendimento.', response.statusCode, response.data as ApiErrorPayload | undefined);
    }
    return getData<SupportChatPublicConversation>(response.data);
  }

  public async getPublicConversation(conversationId: string, visitorToken: string): Promise<SupportChatPublicConversation> {
    const response = await apiClient.get<{ data: SupportChatPublicConversation }>(
      `/support-chat/public/conversations/${conversationId}?visitorToken=${encodeURIComponent(visitorToken)}`,
    );
    if (!response.success || !response.data) {
      throw makeApiError('Não foi possível carregar o atendimento.', response.statusCode, response.data as ApiErrorPayload | undefined);
    }
    return getData<SupportChatPublicConversation>(response.data);
  }

  public async listPublicMessages(conversationId: string, visitorToken: string): Promise<SupportChatMessage[]> {
    const response = await apiClient.get<{ data: SupportChatMessage[] }>(`/support-chat/public/conversations/${conversationId}/messages?visitorToken=${encodeURIComponent(visitorToken)}`);
    if (!response.success || !response.data) {
      throw makeApiError('Não foi possível carregar as mensagens do atendimento.', response.statusCode, response.data as ApiErrorPayload | undefined);
    }
    return getData<SupportChatMessage[]>(response.data);
  }

  public async sendPublicMessage(
    conversationId: string,
    visitorToken: string,
    input: SupportChatSendMessageInput,
  ): Promise<{ message: SupportChatMessage; conversation: SupportChatConversation }> {
    const response = await apiClient.post<{ data: { message: SupportChatMessage; conversation: SupportChatConversation } }>(
      `/support-chat/public/conversations/${conversationId}/messages?visitorToken=${encodeURIComponent(visitorToken)}`,
      input,
    );
    if (!response.success || !response.data) {
      throw makeApiError('Não foi possível enviar a mensagem.', response.statusCode, response.data as ApiErrorPayload | undefined);
    }
    return getData<{ message: SupportChatMessage; conversation: SupportChatConversation }>(response.data);
  }

  public async markPublicRead(conversationId: string, visitorToken: string): Promise<void> {
    const response = await apiClient.post(`/support-chat/public/conversations/${conversationId}/read?visitorToken=${encodeURIComponent(visitorToken)}`);
    if (!response.success) {
      throw makeApiError('Não foi possível confirmar leitura do atendimento.', response.statusCode, response.data as ApiErrorPayload | undefined);
    }
  }

  public getPublicConversationEventsUrl(conversationId: string, visitorToken: string): string {
    return `${API_URL}/support-chat/public/conversations/${conversationId}/events?visitorToken=${encodeURIComponent(visitorToken)}`;
  }

  public async listAdminConversations(filters: SupportChatListFilters = {}): Promise<SupportChatConversation[]> {
    const query = new URLSearchParams();
    if (filters.status) query.set('status', filters.status);
    if (filters.search?.trim()) query.set('search', filters.search.trim());
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await apiClient.get<{ data: SupportChatConversation[] }>(`/support-chat${suffix}`);
    if (!response.success || !response.data) {
      if ((response.data as { reason?: string } | undefined)?.reason === 'MIXED_CONTENT_BLOCKED') {
        throw new Error('Bloqueio do navegador: frontend em HTTPS tentando acessar API HTTP. Configure NEXT_PUBLIC_API_URL com URL HTTPS da API.');
      }
      throw makeApiError('Não foi possível carregar as conversas de suporte.', response.statusCode, response.data as ApiErrorPayload | undefined);
    }
    return getData<SupportChatConversation[]>(response.data);
  }

  public async getAdminSummary(): Promise<SupportChatSummary> {
    const response = await apiClient.get<{ data: SupportChatSummary }>('/support-chat/summary');
    if (!response.success || !response.data) {
      throw makeApiError('Não foi possível carregar o resumo de suporte.', response.statusCode, response.data as ApiErrorPayload | undefined);
    }
    return getData<SupportChatSummary>(response.data);
  }

  public async getConversation(conversationId: string): Promise<SupportChatConversation> {
    const response = await apiClient.get<{ data: SupportChatConversation }>(`/support-chat/${conversationId}`);
    if (!response.success || !response.data) {
      throw makeApiError('Não foi possível carregar a conversa.', response.statusCode, response.data as ApiErrorPayload | undefined);
    }
    return getData<SupportChatConversation>(response.data);
  }

  public async listConversationMessages(conversationId: string): Promise<SupportChatMessage[]> {
    const response = await apiClient.get<{ data: SupportChatMessage[] }>(`/support-chat/${conversationId}/messages`);
    if (!response.success || !response.data) {
      throw makeApiError('Não foi possível carregar as mensagens da conversa.', response.statusCode, response.data as ApiErrorPayload | undefined);
    }
    return getData<SupportChatMessage[]>(response.data);
  }

  public async sendAdminMessage(
    conversationId: string,
    input: SupportChatSendMessageInput,
  ): Promise<{ message: SupportChatMessage; conversation: SupportChatConversation }> {
    const response = await apiClient.post<{ data: { message: SupportChatMessage; conversation: SupportChatConversation } }>(
      `/support-chat/${conversationId}/messages`,
      input,
    );
    if (!response.success || !response.data) {
      throw makeApiError('Não foi possível enviar a resposta.', response.statusCode, response.data as ApiErrorPayload | undefined);
    }
    return getData<{ message: SupportChatMessage; conversation: SupportChatConversation }>(response.data);
  }

  public async markAdminRead(conversationId: string): Promise<void> {
    await apiClient.post(`/support-chat/${conversationId}/read`);
  }

  public async closeConversation(conversationId: string): Promise<SupportChatConversation> {
    const response = await apiClient.patch<{ data: SupportChatConversation }>(`/support-chat/${conversationId}`, { action: 'close' });
    if (!response.success || !response.data) {
      throw makeApiError('Não foi possível encerrar o atendimento.', response.statusCode, response.data as ApiErrorPayload | undefined);
    }
    return getData<SupportChatConversation>(response.data);
  }

  public async deleteConversation(conversationId: string): Promise<void> {
    const response = await apiClient.delete(`/support-chat/${conversationId}`);
    if (!response.success) {
      throw makeApiError('Não foi possível deletar a conversa.', response.statusCode, response.data as ApiErrorPayload | undefined);
    }
  }

  public getWorkspaceEventsUrl(): string {
    const token = authService.getToken();
    return `${API_URL}/support-chat/workspace/events?token=${encodeURIComponent(token || '')}`;
  }

  public getConversationEventsUrl(conversationId: string): string {
    const token = authService.getToken();
    return `${API_URL}/support-chat/${conversationId}/events?token=${encodeURIComponent(token || '')}`;
  }
}

export const supportChatService = new SupportChatService();
