import { authService } from '@/services/auth.service';
import type { InboxAgent, InboxConversation, InboxListFilters, InboxMessage, InboxOutgoingMedia, InboxSettings, UpdateInboxSettingsPayload } from '@/types/Inbox';
import { apiClient } from '@/utils/ApiClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/** Um id por aba, criado no carregamento e estável enquanto a aba viver. */
const SESSION_STREAM_ID = `s-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

class InboxService {
  public async getSettings(): Promise<InboxSettings> {
    const response = await apiClient.get<InboxSettings>('/inbox/settings');
    if (!response.success || !response.data) {
      throw new Error('Não foi possível carregar a configuração do chat.');
    }
    return response.data;
  }

  public async updateSettings(payload: UpdateInboxSettingsPayload): Promise<InboxSettings> {
    const response = await apiClient.patch<InboxSettings>('/inbox/settings', payload);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível salvar a configuração do chat.');
    }
    return response.data;
  }

  public async listConversations(filters: InboxListFilters = {}): Promise<{ conversations: InboxConversation[]; archivedCount: number }> {
    const query = new URLSearchParams();
    if (filters.channelType) query.set('channelType', filters.channelType);
    if (filters.search?.trim()) query.set('search', filters.search.trim());
    if (filters.archived) query.set('archived', 'true');
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await apiClient.get<{ conversations: InboxConversation[]; archivedCount?: number }>(`/inbox/conversations${suffix}`);
    if (!response.success || !response.data) {
      throw new Error('Não foi possível carregar as conversas.');
    }
    return {
      conversations: response.data.conversations,
      archivedCount: response.data.archivedCount ?? 0,
    };
  }

  /**
   * Uma conversa, com os dados de atendimento, já filtrada pela visibilidade de
   * quem pede. É como o alerta do atendente descobre nome e prévia: o stream do
   * workspace só entrega o id. Devolve null quando a conversa não existe ou não
   * é visível para este usuário — nos dois casos não há o que avisar.
   */
  public async getConversation(conversationId: string): Promise<InboxConversation | null> {
    const response = await apiClient.get<{ conversation: InboxConversation }>(`/inbox/conversations/${conversationId}`);
    if (!response.success || !response.data) return null;
    return response.data.conversation;
  }

  public async listAgents(): Promise<InboxAgent[]> {
    const response = await apiClient.get<{ agents: InboxAgent[] }>('/inbox/agents');
    if (!response.success || !response.data) {
      throw new Error('Não foi possível carregar os atendentes.');
    }
    return response.data.agents;
  }

  public async assign(conversationId: string, userId: string): Promise<InboxConversation> {
    const response = await apiClient.post<{ conversation: InboxConversation }>(
      `/inbox/conversations/${conversationId}/assign`,
      { userId },
    );
    if (!response.success || !response.data) {
      throw new Error('Não foi possível transferir a conversa.');
    }
    return response.data.conversation;
  }

  public async unassign(conversationId: string): Promise<InboxConversation> {
    const response = await apiClient.post<{ conversation: InboxConversation }>(
      `/inbox/conversations/${conversationId}/unassign`,
    );
    if (!response.success || !response.data) {
      throw new Error('Não foi possível devolver a conversa para a fila.');
    }
    return response.data.conversation;
  }

  /** Dá nome ao contato quando o provedor não mandou o nome do WhatsApp. */
  public async renameContact(conversationId: string, displayName: string): Promise<InboxConversation> {
    const response = await apiClient.patch<InboxConversation>(
      `/inbox/conversations/${conversationId}/contact`,
      { displayName },
    );
    if (!response.success || !response.data) {
      throw new Error('Não foi possível salvar o nome do contato.');
    }
    return response.data;
  }

  /** Marca duas conversas como sendo da mesma pessoa. Não muda nada no envio. */
  public async link(conversationId: string, targetConversationId: string): Promise<void> {
    const response = await apiClient.post(`/inbox/conversations/${conversationId}/link`, { targetConversationId });
    if (!response.success) {
      const reason = (response.data as { reason?: string } | undefined)?.reason;
      throw new Error(reason === 'SAME_CONTACT'
        ? 'Essa já é a mesma pessoa.'
        : 'Não foi possível vincular as conversas.');
    }
  }

  public async unlink(conversationId: string): Promise<void> {
    const response = await apiClient.post(`/inbox/conversations/${conversationId}/unlink`);
    if (!response.success) {
      throw new Error('Não foi possível desfazer o vínculo.');
    }
  }

  public async resumeAi(conversationId: string): Promise<InboxConversation> {
    const response = await apiClient.post<{ conversation: InboxConversation }>(
      `/inbox/conversations/${conversationId}/ai/resume`,
    );
    if (!response.success || !response.data) {
      throw new Error('Não foi possível reativar a IA nesta conversa.');
    }
    return response.data.conversation;
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
      if (reason === 'REPLY_WINDOW_EXPIRED') {
        throw new Error('O contato não escreve há mais de 24h. O envio volta a ser liberado quando ele mandar uma nova mensagem.');
      }
      if (reason === 'IG_HUMAN_AGENT_NOT_APPROVED') {
        throw new Error('Envio bloqueado pelo Instagram: recurso não aprovado para este app.');
      }
      if (reason === 'MEDIA_TOO_LARGE') {
        throw new Error('O arquivo é grande demais para este canal.');
      }
      if (reason === 'MEDIA_EMPTY') {
        throw new Error('O arquivo está vazio.');
      }
      if (reason === 'MEDIA_TYPE_UNSUPPORTED') {
        throw new Error('Este canal não aceita esse tipo de arquivo.');
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

  /** Tira a conversa da caixa principal (ou devolve para ela) — reversível, não apaga nada. */
  public async setArchived(conversationId: string, archived: boolean): Promise<InboxConversation> {
    const response = await apiClient.post<{ conversation: InboxConversation }>(
      `/inbox/conversations/${conversationId}/${archived ? 'archive' : 'unarchive'}`,
    );
    if (!response.success || !response.data) {
      throw new Error(archived ? 'Não foi possível arquivar a conversa.' : 'Não foi possível desarquivar a conversa.');
    }
    return response.data.conversation;
  }

  /** Exclusão definitiva da conversa e do histórico dela. Só dono/admin do workspace. */
  public async deleteConversation(conversationId: string): Promise<void> {
    const response = await apiClient.delete<{ ok: boolean }>(`/inbox/conversations/${conversationId}`);
    if (!response.success) {
      throw new Error('Não foi possível excluir a conversa.');
    }
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

  /**
   * URL do stream do workspace — sempre a mesma nesta aba.
   *
   * Precisa ser idêntica para todos os consumidores (lista de conversas, sino,
   * contatos): o `SharedEventSource` agrupa por URL, e uma diferença de um único
   * parâmetro faria cada tela abrir a sua própria conexão.
   */
  public getInboxEventsUrl(): string {
    const token = authService.getToken();
    return `${API_URL}/inbox/events?token=${encodeURIComponent(token || '')}&streamId=${SESSION_STREAM_ID}`;
  }

  /** Id desta conexão, usado para dizer ao servidor qual conversa acompanhar. */
  public getStreamId(): string {
    return SESSION_STREAM_ID;
  }

  /**
   * Diz ao servidor qual conversa esta conexão passa a acompanhar, sem reabrir o
   * stream. Devolve false quando a conexão já morreu e precisa ser reaberta.
   */
  public async watchConversation(streamId: string, conversationId: string | null): Promise<boolean> {
    const response = await apiClient.post<{ ok: boolean; attached: boolean }>(
      `/inbox/events/${streamId}/watch`,
      { conversationId },
    );
    return !!response.data?.attached;
  }

}

export const inboxService = new InboxService();
