'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

import { inboxService } from '@/services/inbox.service';
import type { InboxChannelType, InboxConversation, InboxListFilters, InboxMessage, InboxOutgoingMedia, MessageDeliveryStatus } from '@/types/Inbox';

const STATUS_RANK: Record<MessageDeliveryStatus, number> = { SENT: 1, DELIVERED: 2, READ: 3 };

const MEDIA_PREVIEW_LABEL: Record<NonNullable<InboxMessage['mediaType']>, string> = {
  image: '📷 Imagem',
  audio: '🎤 Áudio',
  video: '🎬 Vídeo',
  document: '📄 Documento',
};

/** Resumo curto de uma mensagem para citações e barra de resposta (espelha o preview do backend). */
export function messagePreview(message: InboxMessage): string {
  const text = message.body?.trim();
  if (text) return text.slice(0, 140);
  if (message.mediaType) return MEDIA_PREVIEW_LABEL[message.mediaType];
  return '';
}

interface UseInboxReturn {
  conversations: InboxConversation[];
  messages: InboxMessage[];
  selectedId: string | null;
  loadingConversations: boolean;
  loadingMessages: boolean;
  sending: boolean;
  contactTyping: boolean;
  error: string | null;
  channelFilter: InboxChannelType | 'ALL';
  search: string;
  setChannelFilter: (value: InboxChannelType | 'ALL') => void;
  setSearch: (value: string) => void;
  selectConversation: (conversationId: string) => void;
  sendMessage: (body: string, media?: InboxOutgoingMedia, replyTo?: InboxMessage | null) => Promise<void>;
  notifyTyping: () => void;
}

export function useInbox(): UseInboxReturn {
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<InboxChannelType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [contactTyping, setContactTyping] = useState(false);
  const selectedIdRef = useRef<string | null>(null);
  const conversationsRef = useRef<InboxConversation[]>([]);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  selectedIdRef.current = selectedId;
  conversationsRef.current = conversations;

  const loadConversations = useCallback(async () => {
    try {
      const filters: InboxListFilters = {};
      if (channelFilter !== 'ALL') filters.channelType = channelFilter;
      if (search.trim()) filters.search = search.trim();
      const data = await inboxService.listConversations(filters);
      setConversations(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar conversas.');
    } finally {
      setLoadingConversations(false);
    }
  }, [channelFilter, search]);

  const loadConversationsRef = useRef(loadConversations);
  loadConversationsRef.current = loadConversations;

  useEffect(() => {
    setLoadingConversations(true);
    loadConversations();
  }, [loadConversations]);

  // SSE da lista do workspace — recarrega ao chegar/atualizar qualquer conversa.
  // Usa ref para a conexão sobreviver a mudanças de filtro/busca e reconecta em caso de queda.
  useEffect(() => {
    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;
    let hadError = false;

    const onUpdate = () => { loadConversationsRef.current(); };

    const connect = () => {
      if (disposed) return;
      const es = new EventSource(inboxService.getInboxEventsUrl());
      source = es;
      es.onopen = () => {
        // Ressincroniza o que chegou enquanto o stream esteve fora.
        if (hadError) {
          hadError = false;
          loadConversationsRef.current();
        }
      };
      es.addEventListener('conversation.updated', onUpdate);
      es.onerror = () => {
        hadError = true;
        // EventSource reconecta sozinho em erros transitórios; recria só quando fecha de vez.
        if (es.readyState === EventSource.CLOSED) {
          es.close();
          if (retryTimer) clearTimeout(retryTimer);
          retryTimer = setTimeout(connect, 4000);
        }
      };
    };

    connect();
    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
    };
  }, []);

  const loadMessages = useCallback(async (conversationId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const data = await inboxService.listMessages(conversationId);
      setMessages(data);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Erro ao carregar mensagens.');
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, []);

  const selectConversation = useCallback((conversationId: string) => {
    setSelectedId(conversationId);
    setMessages([]);
    setContactTyping(false);
    loadMessages(conversationId);
    inboxService.markRead(conversationId)
      .then(() => {
        setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
      })
      .catch(() => {});
  }, [loadMessages]);

  // SSE da conversa aberta — mensagens novas, status de entrega e "digitando".
  // Reconecta em caso de queda e ressincroniza as mensagens ao voltar.
  useEffect(() => {
    if (!selectedId) return undefined;
    const conversationId = selectedId;
    setContactTyping(false);

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;
    let hadError = false;

    const onMessage = (event: Event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as { message?: InboxMessage };
        if (!payload.message || payload.message.conversationId !== conversationId) return;
        const incoming = payload.message;
        setContactTyping(false);
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          // Envio próprio ecoado pelo SSE: substitui a bolha otimista equivalente em vez de duplicar.
          let base = prev;
          if (incoming.direction === 'OUT') {
            const tempIdx = prev.findIndex((m) => m.pending && m.body === incoming.body && (m.mediaType ?? null) === (incoming.mediaType ?? null));
            if (tempIdx >= 0) base = prev.filter((_, i) => i !== tempIdx);
          }
          return [...base, incoming];
        });
        // Só marca como lida (e espelha o tique azul para o contato) quando a mensagem é recebida.
        if (incoming.direction === 'IN') {
          inboxService.markRead(conversationId).catch(() => {});
        }
      } catch {
        loadMessages(conversationId, true);
      }
    };

    const onStatus = (event: Event) => {
      try {
        const { status, until } = JSON.parse((event as MessageEvent).data) as {
          status?: MessageDeliveryStatus;
          until?: string | null;
        };
        if (!status) return;
        const untilTime = until ? new Date(until).getTime() : null;
        setMessages((prev) => prev.map((m) => {
          if (m.direction !== 'OUT') return m;
          // Recibo escopado: não promove mensagens enviadas depois da mensagem referenciada.
          if (untilTime !== null && new Date(m.createdAt).getTime() > untilTime) return m;
          const current = STATUS_RANK[m.deliveryStatus ?? 'SENT'];
          return current < STATUS_RANK[status] ? { ...m, deliveryStatus: status } : m;
        }));
      } catch {
        // ignora payload malformado
      }
    };

    const onTyping = (event: Event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as { isTyping?: boolean };
        setContactTyping(!!payload.isTyping);
        if (typingClearRef.current) clearTimeout(typingClearRef.current);
        if (payload.isTyping) {
          typingClearRef.current = setTimeout(() => setContactTyping(false), 6000);
        }
      } catch {
        // ignora payload malformado
      }
    };

    const connect = () => {
      if (disposed) return;
      const es = new EventSource(inboxService.getConversationEventsUrl(conversationId));
      source = es;
      es.onopen = () => {
        // Ressincroniza mensagens e status perdidos enquanto o stream esteve fora.
        if (hadError) {
          hadError = false;
          loadMessages(conversationId, true);
        }
      };
      es.addEventListener('message.created', onMessage);
      es.addEventListener('message.status', onStatus);
      es.addEventListener('typing', onTyping);
      es.onerror = () => {
        hadError = true;
        // EventSource reconecta sozinho em erros transitórios; recria só quando fecha de vez.
        if (es.readyState === EventSource.CLOSED) {
          es.close();
          if (retryTimer) clearTimeout(retryTimer);
          retryTimer = setTimeout(connect, 4000);
        }
      };
    };

    connect();
    return () => {
      disposed = true;
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
    };
  }, [selectedId, loadMessages]);

  const notifyTyping = useCallback(() => {
    const conversationId = selectedIdRef.current;
    if (!conversationId) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 3000) return;
    lastTypingSentRef.current = now;
    inboxService.sendTyping(conversationId).catch(() => {});
  }, []);

  const sendMessage = useCallback(async (body: string, media?: InboxOutgoingMedia, replyTo?: InboxMessage | null) => {
    const conversationId = selectedIdRef.current;
    if (!conversationId || (!body.trim() && !media)) return;

    // Mensagem otimista: aparece imediatamente com tom apagado e é trocada pela
    // definitiva quando o envio confirma — sem recarregar a thread inteira.
    const conversation = conversationsRef.current.find((c) => c.id === conversationId);
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: InboxMessage = {
      id: tempId,
      conversationId,
      contactId: conversation?.contactId ?? '',
      channelId: conversation?.channelId ?? '',
      channelType: conversation?.channelType ?? 'WHATSAPP',
      direction: 'OUT',
      body: body.trim(),
      mediaType: media?.mediaType ?? null,
      mediaBase64: media?.base64 ?? null,
      mediaMimeType: media?.mimeType ?? null,
      mediaFileName: media?.fileName ?? null,
      deliveryStatus: 'SENT',
      replyToMessageId: replyTo?.id ?? null,
      replyToPreview: replyTo ? messagePreview(replyTo) : null,
      replyToDirection: replyTo?.direction ?? null,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setSending(true);
    setError(null);
    setMessages((prev) => [...prev, optimistic]);
    try {
      const { message } = await inboxService.sendMessage(conversationId, body, media, replyTo?.id);
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        if (message && !withoutTemp.some((m) => m.id === message.id)) {
          return [...withoutTemp, message];
        }
        return withoutTemp;
      });
      // Sem a mensagem definitiva na resposta, ressincroniza em silêncio.
      if (!message) loadMessages(conversationId, true);
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(e instanceof Error ? e.message : 'Erro ao enviar mensagem.');
      throw e;
    } finally {
      setSending(false);
    }
  }, [loadMessages]);

  return {
    conversations,
    messages,
    selectedId,
    loadingConversations,
    loadingMessages,
    sending,
    contactTyping,
    error,
    channelFilter,
    search,
    setChannelFilter,
    setSearch,
    selectConversation,
    sendMessage,
    notifyTyping,
  };
}
