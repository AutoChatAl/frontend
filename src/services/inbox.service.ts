import { authService } from '@/services/auth.service';
import type { InboxConversation, InboxListFilters, InboxMessage, InboxOutgoingMedia } from '@/types/Inbox';
import { apiClient } from '@/utils/ApiClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class InboxService {
  public async listConversations(filters: InboxListFilters = {}): Promise<InboxConversation[]> {
    const query = new URLSearchParams();
    if (filters.channelType) query.set('channelType', filters.channelType);
    if (filters.search?.trim()) query.set('search', filters.search.trim());
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await apiClient.get<{ conversations: InboxConversation[] }>(`/inbox/conversations${suffix}`);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível carregar as conversas.');
    }
    return response.data.conversations;
  }

  public async listMessages(conversationId: string): Promise<InboxMessage[]> {
    const response = await apiClient.get<{ messages: InboxMessage[] }>(`/inbox/conversations/${conversationId}/messages`);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível carregar as mensagens.');
    }
    return response.data.messages;
  }

  public async sendMessage(
    conversationId: string,
    body: string,
    media?: InboxOutgoingMedia,
    replyToMessageId?: string,
  ): Promise<{ conversation: InboxConversation; message: InboxMessage | null }> {
    const payload: { body?: string; media?: InboxOutgoingMedia; replyToMessageId?: string } = {};
    if (body.trim()) payload.body = body.trim();
    if (media) payload.media = media;
    if (replyToMessageId) payload.replyToMessageId = replyToMessageId;
    const response = await apiClient.post<{ conversation: InboxConversation; message?: InboxMessage | null }>(
      `/inbox/conversations/${conversationId}/messages`,
      payload,
    );
    if (!response.success || !response.data) {
      const reason = (response.data as { reason?: string } | undefined)?.reason;
      if (reason === 'MESSAGE_LIMIT_REACHED') {
        throw new Error('Limite de mensagens do plano atingido.');
      }
      if (reason === 'IG_MESSAGE_WINDOW_EXPIRED') {
        throw new Error('O Instagram só permite responder em até 24h após a última mensagem do contato.');
      }
      if (reason === 'IG_HUMAN_AGENT_NOT_APPROVED') {
        throw new Error('Envio bloqueado pelo Instagram: recurso não aprovado para este app.');
      }
      throw new Error('Não foi possível enviar a mensagem.');
    }
    return { conversation: response.data.conversation, message: response.data.message ?? null };
  }

  public async transcribe(conversationId: string, messageId: string): Promise<InboxMessage> {
    const response = await apiClient.post<{ message: InboxMessage }>(
      `/inbox/conversations/${conversationId}/messages/${messageId}/transcribe`,
    );
    if (!response.success || !response.data) {
      const reason = (response.data as { reason?: string } | undefined)?.reason;
      if (reason === 'TRANSCRIPTION_FAILED') {
        throw new Error('Não foi possível entender o áudio.');
      }
      if (reason === 'AUDIO_UNAVAILABLE') {
        throw new Error('Áudio não está mais disponível para transcrição.');
      }
      throw new Error('Não foi possível transcrever o áudio.');
    }
    return response.data.message;
  }

  public async markRead(conversationId: string): Promise<void> {
    await apiClient.post(`/inbox/conversations/${conversationId}/read`);
  }

  public async sendTyping(conversationId: string): Promise<void> {
    await apiClient.post(`/inbox/conversations/${conversationId}/typing`).catch(() => {});
  }

  public async getSummary(): Promise<{ unreadCount: number }> {
    const response = await apiClient.get<{ unreadCount: number }>('/inbox/summary');
    if (!response.success || !response.data) {
      return { unreadCount: 0 };
    }
    return response.data;
  }

  public getInboxEventsUrl(): string {
    const token = authService.getToken();
    return `${API_URL}/inbox/events?token=${encodeURIComponent(token || '')}`;
  }

  public getConversationEventsUrl(conversationId: string): string {
    const token = authService.getToken();
    return `${API_URL}/inbox/conversations/${conversationId}/events?token=${encodeURIComponent(token || '')}`;
  }
}

export const inboxService = new InboxService();
