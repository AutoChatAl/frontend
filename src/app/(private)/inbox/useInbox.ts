'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

import { inboxService } from '@/services/inbox.service';
import type { InboxAgent, InboxConversation, InboxFilterId, InboxListFilters, InboxMessage, InboxOutgoingMedia, MessageDeliveryStatus } from '@/types/Inbox';
import { subscribeToEvents } from '@/utils/SharedEventSource';

const STATUS_RANK: Record<MessageDeliveryStatus, number> = { SENT: 1, DELIVERED: 2, READ: 3 };

const MEDIA_PREVIEW_LABEL: Record<NonNullable<InboxMessage['mediaType']>, string> = {
  image: '📷 Imagem',
  audio: '🎤 Áudio',
  video: '🎬 Vídeo',
  document: '📄 Documento',
};

/** Espelha o `SHARE_LABEL` do backend — reels chega como vídeo e publicação como imagem. */
const SHARE_PREVIEW_LABEL: Record<NonNullable<InboxMessage['shareKind']>, string> = {
  reel: '🎬 Reels',
  post: '📱 Publicação do Instagram',
};

/** Resumo curto de uma mensagem para citações e barra de resposta (espelha o preview do backend). */
export function messagePreview(message: InboxMessage): string {
  const text = message.body?.trim();
  if (text) return text.slice(0, 140);
  // Documento aparece pelo nome do arquivo, como no WhatsApp: numa lista de conversas
  // "📄 contrato-assinado.pdf" diz muito mais do que "📄 Documento".
  if (message.mediaType === 'document' && message.mediaFileName?.trim()) {
    return `📄 ${message.mediaFileName.trim()}`.slice(0, 140);
  }
  if (message.shareKind) return SHARE_PREVIEW_LABEL[message.shareKind];
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
  channelFilter: InboxFilterId;
  /** Lista mostrando o arquivo em vez da caixa principal. */
  viewingArchived: boolean;
  setViewingArchived: (value: boolean) => void;
  archivedCount: number;
  search: string;
  transcribingId: string | null;
  agents: InboxAgent[];
  assigning: boolean;
  setChannelFilter: (value: InboxFilterId) => void;
  setSearch: (value: string) => void;
  selectConversation: (conversationId: string) => void;
  sendMessage: (body: string, media?: InboxOutgoingMedia, replyTo?: InboxMessage | null) => Promise<void>;
  notifyTyping: () => void;
  transcribeMessage: (message: InboxMessage) => Promise<void>;
  assignConversation: (conversationId: string, userId: string) => Promise<void>;
  unassignConversation: (conversationId: string) => Promise<void>;
  /** Marca duas conversas como a mesma pessoa. Só muda a lista, nunca o envio. */
  renameContact: (conversationId: string, displayName: string) => Promise<void>;
  linkConversation: (conversationId: string, targetConversationId: string) => Promise<void>;
  unlinkConversation: (conversationId: string) => Promise<void>;
  resumeAi: (conversationId: string) => Promise<void>;
  deletingId: string | null;
  deleteConversation: (conversationId: string) => Promise<void>;
  archivingId: string | null;
  archiveConversation: (conversationId: string, archived: boolean) => Promise<void>;
}

export function useInbox(): UseInboxReturn {
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<InboxFilterId>('ALL');
  const [search, setSearch] = useState('');
  const [viewingArchived, setViewingArchived] = useState(false);
  const [archivedCount, setArchivedCount] = useState(0);
  const [contactTyping, setContactTyping] = useState(false);
  const [agents, setAgents] = useState<InboxAgent[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const conversationsRef = useRef<InboxConversation[]>([]);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  /**
   * Quando a thread aberta foi atualizada pela última vez. Serve para o evento do
   * workspace não repetir uma busca que o stream da conversa acabou de fazer.
   */
  const lastThreadSyncRef = useRef<number>(0);

  selectedIdRef.current = selectedId;
  conversationsRef.current = conversations;

  /**
   * Marca a conversa como lida no servidor e espelha na lista.
   *
   * Ponto único de propósito: a marcação precisa acontecer por todo caminho que
   * traz mensagem para a thread aberta — o stream da conversa, a rede de segurança
   * do canal do workspace e a seleção da conversa. Estando em um só lugar, nenhum
   * caminho novo esquece de zerar o contador.
   */
  const markConversationRead = useCallback((conversationId: string) => {
    // O markRead emite `conversation.updated` no backend. Chamar sem ter o que zerar
    // devolveria o evento que provocou a chamada, e os dois ficariam se alimentando —
    // uma rodada de requisições a cada ida e volta. Com a guarda, a segunda passada
    // vê o contador já zerado e para.
    const conversation = conversationsRef.current.find((c) => c.id === conversationId);
    if (conversation && conversation.unreadCount === 0) return;
    inboxService.markRead(conversationId)
      .then(() => {
        setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
      })
      .catch(() => {});
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const filters: InboxListFilters = {};
      // O arquivo é uma vista à parte: mostra tudo que foi arquivado, sem recorte por canal.
      if (viewingArchived) filters.archived = true;
      else if (channelFilter !== 'ALL') filters.channelType = channelFilter;
      if (search.trim()) filters.search = search.trim();
      const { conversations: data, archivedCount: count } = await inboxService.listConversations(filters);
      setConversations(data);
      setArchivedCount(count);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar conversas.');
    } finally {
      setLoadingConversations(false);
    }
  }, [channelFilter, search, viewingArchived]);

  const markConversationReadRef = useRef(markConversationRead);
  markConversationReadRef.current = markConversationRead;

  const loadConversationsRef = useRef(loadConversations);
  loadConversationsRef.current = loadConversations;

  /**
   * Recarga da lista com as rajadas agrupadas.
   *
   * Uma única mensagem recebida gera vários `conversation.updated` — a gravação, o
   * markRead, a foto do contato chegando depois. Recarregando a cada evento, a lista
   * era buscada três ou quatro vezes seguidas para mostrar o mesmo resultado.
   */
  const RELOAD_COALESCE_MS = 400;
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleConversationsReload = useCallback(() => {
    if (reloadTimerRef.current) return;
    reloadTimerRef.current = setTimeout(() => {
      reloadTimerRef.current = null;
      loadConversationsRef.current();
    }, RELOAD_COALESCE_MS);
  }, []);
  const scheduleConversationsReloadRef = useRef(scheduleConversationsReload);
  scheduleConversationsReloadRef.current = scheduleConversationsReload;

  const loadMessages = useCallback(async (conversationId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const data = await inboxService.listMessages(conversationId);
      lastThreadSyncRef.current = Date.now();
      // A recarga silenciosa pode cair no meio de um envio: sem preservar as bolhas
      // otimistas, a mensagem que o operador acabou de mandar sumiria e voltaria.
      setMessages((prev) => {
        const pending = prev.filter((m) => m.pending);
        return pending.length > 0 ? [...data, ...pending] : data;
      });
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Erro ao carregar mensagens.');
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, []);

  const loadMessagesRef = useRef(loadMessages);
  loadMessagesRef.current = loadMessages;

  /** Tira a conversa da lista e fecha a thread se era a que estava aberta. */
  const dropConversation = useCallback((conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (selectedIdRef.current === conversationId) {
      setSelectedId(null);
      setMessages([]);
      setContactTyping(false);
    }
  }, []);

  const dropConversationRef = useRef(dropConversation);
  dropConversationRef.current = dropConversation;

  useEffect(() => {
    setLoadingConversations(true);
    loadConversations();
  }, [loadConversations]);

  /**
   * Stream do workspace: lista de conversas e avisos. Vai pela conexão compartilhada,
   * então a página de contatos e o sino de notificações não abrem outra igual.
   */
  useEffect(() => {
    const onUpdate = (event: MessageEvent) => {
      scheduleConversationsReloadRef.current();
      const openId = selectedIdRef.current;
      if (!openId) return;
      try {
        const { conversationId } = JSON.parse(event.data) as { conversationId?: string };
        if (conversationId && conversationId !== openId) return;
      } catch {
        // Payload ilegível: ressincroniza mesmo assim, é o caso em que menos se sabe.
      }
      // O stream da conversa é o caminho normal da mensagem nova; este é a rede de
      // segurança para quando aquele cai. O carimbo evita a busca repetida.
      if (Date.now() - lastThreadSyncRef.current < 1500) return;
      loadMessagesRef.current(openId, true);
      markConversationReadRef.current(openId);
    };

    return subscribeToEvents(inboxService.getInboxEventsUrl(), {
      'conversation.updated': onUpdate,
      'conversation.deleted': (event) => {
        try {
          const { conversationId } = JSON.parse(event.data) as { conversationId?: string };
          if (conversationId) dropConversationRef.current(conversationId);
        } catch {
          scheduleConversationsReloadRef.current();
        }
      },
      'settings.updated': () => {
        scheduleConversationsReloadRef.current();
        const conversationId = selectedIdRef.current;
        if (conversationId) loadMessagesRef.current(conversationId, true);
      },
      'message.created': (event) => { onConversationMessageRef.current(event); },
      'message.edited': (event) => { onConversationMessageEditedRef.current(event); },
      'message.status': (event) => { onConversationStatusRef.current(event); },
      typing: (event) => { onConversationTypingRef.current(event); },
    });
  }, []);

  useEffect(() => {
    inboxService.listAgents()
      .then(setAgents)
      .catch(() => setAgents([]));
  }, []);

  /**
   * Transferir pode tirar a conversa da vista de quem transferiu (colaborador que
   * passa para outro), então a lista é recarregada em vez de remendada no cliente.
   */
  const applyAssignment = useCallback(async (action: () => Promise<InboxConversation>) => {
    setAssigning(true);
    setError(null);
    try {
      const updated = await action();
      setConversations((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      loadConversationsRef.current();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar o atendimento.');
      throw e;
    } finally {
      setAssigning(false);
    }
  }, []);

  const assignConversation = useCallback(async (conversationId: string, userId: string) => {
    await applyAssignment(() => inboxService.assign(conversationId, userId));
  }, [applyAssignment]);

  /**
   * Vincular e desvincular mudam a ORDEM da lista, e não só a linha tocada — as
   * irmãs passam a viajar juntas. Por isso recarrega tudo em vez de remendar o
   * estado local, que não teria como saber a nova posição do grupo.
   */
  const renameContact = useCallback(async (conversationId: string, displayName: string) => {
    await applyAssignment(() => inboxService.renameContact(conversationId, displayName));
  }, [applyAssignment]);

  const linkConversation = useCallback(async (conversationId: string, targetConversationId: string) => {
    setAssigning(true);
    setError(null);
    try {
      await inboxService.link(conversationId, targetConversationId);
      loadConversationsRef.current();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao vincular as conversas.');
      throw e;
    } finally {
      setAssigning(false);
    }
  }, []);

  const unlinkConversation = useCallback(async (conversationId: string) => {
    setAssigning(true);
    setError(null);
    try {
      await inboxService.unlink(conversationId);
      loadConversationsRef.current();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao desfazer o vínculo.');
      throw e;
    } finally {
      setAssigning(false);
    }
  }, []);

  const unassignConversation = useCallback(async (conversationId: string) => {
    await applyAssignment(() => inboxService.unassign(conversationId));
  }, [applyAssignment]);

  const resumeAi = useCallback(async (conversationId: string) => {
    await applyAssignment(() => inboxService.resumeAi(conversationId));
  }, [applyAssignment]);

  /**
   * Arquivar/desarquivar tira a conversa da vista atual nos dois sentidos: arquivada
   * sai da caixa principal, desarquivada sai do filtro "Arquivadas".
   */
  const archiveConversation = useCallback(async (conversationId: string, archived: boolean) => {
    setArchivingId(conversationId);
    setError(null);
    try {
      await inboxService.setArchived(conversationId, archived);
      dropConversation(conversationId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao arquivar a conversa.');
      throw e;
    } finally {
      setArchivingId(null);
    }
  }, [dropConversation]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    setDeletingId(conversationId);
    setError(null);
    try {
      await inboxService.deleteConversation(conversationId);
      dropConversation(conversationId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir a conversa.');
      throw e;
    } finally {
      setDeletingId(null);
    }
  }, [dropConversation]);

  const selectConversation = useCallback((conversationId: string) => {
    setSelectedId(conversationId);
    setMessages([]);
    setContactTyping(false);
    loadMessages(conversationId);
    markConversationRead(conversationId);
  }, [loadMessages]);

  /**
   * Handlers da conversa aberta. Ficam em refs porque a assinatura do stream é feita
   * uma vez só, com deps vazias, e precisa enxergar sempre a conversa atual.
   */
  const onConversationMessage = useCallback((event: MessageEvent) => {
    const conversationId = selectedIdRef.current;
    if (!conversationId) return;
    try {
      const payload = JSON.parse(event.data) as { message?: InboxMessage };
      if (!payload.message || payload.message.conversationId !== conversationId) return;
      const incoming = payload.message;
      lastThreadSyncRef.current = Date.now();
      setContactTyping(false);
      setMessages((prev) => {
        const known = prev.find((m) => m.id === incoming.id);
        if (known) {
          // Mesma mensagem reemitida: o servidor promoveu a bolha do eco ao registro do
          // envio (ganhou o selo de IA/automação). Atualiza no lugar em vez de ignorar,
          // preservando o recibo que já tenha subido por conta própria.
          const status = STATUS_RANK[known.deliveryStatus ?? 'SENT'] > STATUS_RANK[incoming.deliveryStatus ?? 'SENT']
            ? known.deliveryStatus
            : incoming.deliveryStatus;
          return prev.map((m) => (m.id === incoming.id
            ? { ...m, ...incoming, ...(status ? { deliveryStatus: status } : {}) }
            : m));
        }
        // Envio próprio ecoado pelo SSE: substitui a bolha otimista equivalente em vez de duplicar.
        let base = prev;
        if (incoming.direction === 'OUT') {
          const tempIdx = prev.findIndex((m) => m.pending && m.body === incoming.body && (m.mediaType ?? null) === (incoming.mediaType ?? null));
          if (tempIdx >= 0) base = prev.filter((_, i) => i !== tempIdx);
        }
        return [...base, incoming];
      });
      // Só marca como lida (e espelha o tique azul para o contato) quando a mensagem é recebida.
      if (incoming.direction === 'IN') markConversationReadRef.current(conversationId);
    } catch {
      loadMessagesRef.current(conversationId, true);
    }
  }, []);
  const onConversationMessageRef = useRef(onConversationMessage);
  onConversationMessageRef.current = onConversationMessage;

  /**
   * Edição feita pelo contato no WhatsApp: reescreve o balão que já está na thread. Não
   * entra como mensagem nova e não mexe em leitura — o contato corrigiu o que já mandou.
   */
  const onConversationMessageEdited = useCallback((event: MessageEvent) => {
    const conversationId = selectedIdRef.current;
    if (!conversationId) return;
    try {
      const payload = JSON.parse(event.data) as { message?: InboxMessage };
      const edited = payload.message;
      if (!edited || edited.conversationId !== conversationId) return;
      setMessages((prev) => prev.map((m) => (m.id === edited.id ? { ...m, ...edited } : m)));
    } catch {
      loadMessagesRef.current(conversationId, true);
    }
  }, []);
  const onConversationMessageEditedRef = useRef(onConversationMessageEdited);
  onConversationMessageEditedRef.current = onConversationMessageEdited;

  const onConversationStatus = useCallback((event: MessageEvent) => {
    try {
      const { status, until } = JSON.parse(event.data) as {
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
  }, []);
  const onConversationStatusRef = useRef(onConversationStatus);
  onConversationStatusRef.current = onConversationStatus;

  const onConversationTyping = useCallback((event: MessageEvent) => {
    try {
      const payload = JSON.parse(event.data) as { isTyping?: boolean };
      setContactTyping(!!payload.isTyping);
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      if (payload.isTyping) {
        typingClearRef.current = setTimeout(() => setContactTyping(false), 6000);
      }
    } catch {
      // ignora payload malformado
    }
  }, []);
  const onConversationTypingRef = useRef(onConversationTyping);
  onConversationTypingRef.current = onConversationTyping;

  /**
   * Aponta a conexão já aberta para a conversa selecionada. É uma chamada curta, sem
   * reabrir stream nenhum — trocar de conversa não custa mais uma conexão.
   */
  useEffect(() => {
    if (!selectedId) return undefined;
    setContactTyping(false);
    let cancelled = false;

    const watch = async (attempt = 0) => {
      if (cancelled) return;
      const attached = await inboxService.watchConversation(inboxService.getStreamId(), selectedId).catch(() => false);
      // `attached: false` = o servidor não conhece este stream (conexão ainda subindo
      // ou caiu). Tenta de novo em vez de deixar a thread sem acompanhar a conversa.
      if (!attached && attempt < 5 && !cancelled) {
        setTimeout(() => watch(attempt + 1), 1000 * (attempt + 1));
      }
    };
    watch();

    return () => {
      cancelled = true;
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      inboxService.watchConversation(inboxService.getStreamId(), null).catch(() => {});
    };
  }, [selectedId]);

  /**
   * Aba em segundo plano e máquina suspensa matam o EventSource sem aviso — o
   * navegador só reconecta quando a aba volta. Ao reaparecer (ou ao a rede voltar),
   * ressincroniza lista e thread em silêncio, para o operador nunca encontrar a
   * conversa desatualizada ao voltar para ela.
   */
  useEffect(() => {
    // `focus` e `visibilitychange` disparam juntos ao trocar de aba — sem a folga,
    // cada volta custaria duas rodadas de busca.
    let lastResync = 0;
    const resync = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastResync < 3000) return;
      lastResync = Date.now();
      loadConversationsRef.current();
      const conversationId = selectedIdRef.current;
      if (conversationId) loadMessagesRef.current(conversationId, true);
    };
    document.addEventListener('visibilitychange', resync);
    window.addEventListener('online', resync);
    window.addEventListener('focus', resync);
    return () => {
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('online', resync);
      window.removeEventListener('focus', resync);
    };
  }, []);

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
    // A prévia da lista também é otimista.
    //
    // Ela dependia inteiramente de o servidor devolver `conversation.updated` e a
    // lista ser rebuscada — então a mensagem já estava no balão e a linha da conversa
    // continuava mostrando a anterior. Sendo conteúdo que o próprio cliente acabou de
    // escrever, não há motivo para esperar a ida e volta.
    setConversations((prev) => prev.map((c) => (c.id === conversationId
      ? {
        ...c,
        lastMessagePreview: messagePreview(optimistic),
        lastMessageDirection: 'OUT' as const,
        lastMessageAt: optimistic.createdAt,
        unreadCount: 0,
      }
      : c)));
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

  const transcribeMessage = useCallback(async (message: InboxMessage) => {
    const { conversationId } = message;
    setTranscribingId(message.id);
    try {
      const updated = await inboxService.transcribe(conversationId, message.id);
      setMessages((prev) => prev.map((m) => (
        m.id === updated.id ? { ...m, transcription: updated.transcription ?? null } : m
      )));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao transcrever o áudio.');
    } finally {
      setTranscribingId(null);
    }
  }, []);

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
    viewingArchived,
    setViewingArchived,
    archivedCount,
    search,
    transcribingId,
    agents,
    assigning,
    setChannelFilter,
    setSearch,
    selectConversation,
    sendMessage,
    notifyTyping,
    transcribeMessage,
    assignConversation,
    unassignConversation,
    renameContact,
    linkConversation,
    unlinkConversation,
    resumeAi,
    deletingId,
    deleteConversation,
    archivingId,
    archiveConversation,
  };
}
