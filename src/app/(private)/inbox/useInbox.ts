'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

import { inboxService } from '@/services/inbox.service';
import type { InboxChannelType, InboxConversation, InboxListFilters, InboxMessage, InboxOutgoingMedia, MessageDeliveryStatus } from '@/types/Inbox';

const STATUS_RANK: Record<MessageDeliveryStatus, number> = { SENT: 1, DELIVERED: 2, READ: 3 };

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
  sendMessage: (body: string, media?: InboxOutgoingMedia) => Promise<void>;
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
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  selectedIdRef.current = selectedId;

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

  useEffect(() => {
    setLoadingConversations(true);
    loadConversations();
  }, [loadConversations]);

  // SSE da lista do workspace — recarrega ao chegar/atualizar qualquer conversa.
  useEffect(() => {
    const source = new EventSource(inboxService.getInboxEventsUrl());
    const onUpdate = () => { loadConversations(); };
    source.addEventListener('conversation.updated', onUpdate);
    source.onerror = () => source.close();
    return () => {
      source.removeEventListener('conversation.updated', onUpdate);
      source.close();
    };
  }, [loadConversations]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const data = await inboxService.listMessages(conversationId);
      setMessages(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar mensagens.');
    } finally {
      setLoadingMessages(false);
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
  useEffect(() => {
    if (!selectedId) return undefined;
    const conversationId = selectedId;
    setContactTyping(false);
    const source = new EventSource(inboxService.getConversationEventsUrl(conversationId));

    const onMessage = (event: Event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as { message?: InboxMessage };
        if (!payload.message || payload.message.conversationId !== conversationId) return;
        const incoming = payload.message;
        setContactTyping(false);
        setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        inboxService.markRead(conversationId).catch(() => {});
      } catch {
        loadMessages(conversationId);
      }
    };

    const onStatus = (event: Event) => {
      try {
        const { status } = JSON.parse((event as MessageEvent).data) as { status?: MessageDeliveryStatus };
        if (!status) return;
        setMessages((prev) => prev.map((m) => {
          if (m.direction !== 'OUT') return m;
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

    source.addEventListener('message.created', onMessage);
    source.addEventListener('message.status', onStatus);
    source.addEventListener('typing', onTyping);
    source.onerror = () => source.close();
    return () => {
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      source.removeEventListener('message.created', onMessage);
      source.removeEventListener('message.status', onStatus);
      source.removeEventListener('typing', onTyping);
      source.close();
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

  const sendMessage = useCallback(async (body: string, media?: InboxOutgoingMedia) => {
    const conversationId = selectedIdRef.current;
    if (!conversationId || (!body.trim() && !media)) return;
    setSending(true);
    setError(null);
    try {
      await inboxService.sendMessage(conversationId, body, media);
      await loadMessages(conversationId);
    } catch (e) {
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
