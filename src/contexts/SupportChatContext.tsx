'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authService } from '@/services/auth.service';
import { supportChatService } from '@/services/support-chat.service';
import type { SupportChatMessage, SupportChatPublicConversation } from '@/types/SupportChat';
import { formatSupportChatClosure } from '@/utils/supportChat';

const OPEN_KEY = 'synq_support_widget_open';
const VISITOR_KEY = 'synq_support_visitor';
const CONVERSATION_KEY = 'synq_support_conversation';

type SupportChatApiError = Error & { code?: string; statusCode?: number };

function isConversationNotFoundError(error: unknown): error is SupportChatApiError {
  if (!(error instanceof Error)) return false;
  const apiError = error as SupportChatApiError;
  return apiError.code === 'SUPPORT_CHAT_NOT_FOUND' || apiError.statusCode === 404;
}

function isConversationClosedError(error: unknown): error is SupportChatApiError {
  if (!(error instanceof Error)) return false;
  return (error as SupportChatApiError).code === 'SUPPORT_CHAT_CLOSED';
}

function isValidConversation(conversation: SupportChatPublicConversation | null | undefined): conversation is SupportChatPublicConversation {
  return !!conversation?.id && !!conversation?.visitorToken;
}

interface VisitorIdentity {
  name: string;
  email: string;
}

interface SupportChatContextValue {
  isOpen: boolean;
  loading: boolean;
  sending: boolean;
  conversation: SupportChatPublicConversation | null;
  messages: SupportChatMessage[];
  visitor: VisitorIdentity;
  error: string;
  closedConversationMessage: string;
  workspaceConfigured: boolean;
  setIsOpen: (open: boolean) => void;
  setVisitor: (visitor: VisitorIdentity) => void;
  startNewConversation: () => void;
  sendMessage: (input: { body?: string; imageBase64?: string; imageMimeType?: string }) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

const SupportChatContext = createContext<SupportChatContextValue | undefined>(undefined);

export function SupportChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpenState] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<SupportChatPublicConversation | null>(null);
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [visitor, setVisitorState] = useState<VisitorIdentity>({ name: '', email: '' });
  const [error, setError] = useState('');
  const [closedConversationMessage, setClosedConversationMessage] = useState('');
  const workspaceId = supportChatService.getPublicWorkspaceId();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOpenState(localStorage.getItem(OPEN_KEY) === 'true');

    const loggedUser = authService.getUser();
    if (loggedUser?.email) {
      setVisitorState({ name: loggedUser.name || '', email: loggedUser.email });
    } else {
      const rawVisitor = localStorage.getItem(VISITOR_KEY);
      if (rawVisitor) {
        try {
          setVisitorState(JSON.parse(rawVisitor) as VisitorIdentity);
        } catch {}
      }
    }

    const rawConversation = localStorage.getItem(CONVERSATION_KEY);
    if (rawConversation) {
      try {
        const parsed = JSON.parse(rawConversation) as SupportChatPublicConversation;
        if (isValidConversation(parsed)) {
          setConversation(parsed);
        } else {
          localStorage.removeItem(CONVERSATION_KEY);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(OPEN_KEY, String(isOpen));
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(VISITOR_KEY, JSON.stringify(visitor));
  }, [visitor]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (conversation) {
      localStorage.setItem(CONVERSATION_KEY, JSON.stringify(conversation));
      return;
    }
    localStorage.removeItem(CONVERSATION_KEY);
  }, [conversation]);

  const clearStaleConversation = useCallback(() => {
    setConversation(null);
    setMessages([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CONVERSATION_KEY);
    }
  }, []);

  const handleClosedConversation = useCallback((closedAt?: string | null) => {
    clearStaleConversation();
    const closedLabel = formatSupportChatClosure(closedAt);
    setClosedConversationMessage(
      closedLabel
        ? `A sua conversa do dia ${closedLabel} foi encerrada.`
        : 'A sua conversa foi encerrada.',
    );
  }, [clearStaleConversation]);

  const startNewConversation = useCallback(() => {
    setClosedConversationMessage('');
    setError('');
    clearStaleConversation();
  }, [clearStaleConversation]);

  const refreshMessages = useCallback(async () => {
    if (!conversation?.id || !conversation.visitorToken) return;

    try {
      const activeConversation = await supportChatService.getPublicConversation(conversation.id, conversation.visitorToken);
      if (activeConversation.status === 'CLOSED') {
        handleClosedConversation(activeConversation.closedAt);
        return;
      }

      setClosedConversationMessage('');
      setConversation(activeConversation);
      const nextMessages = await supportChatService.listPublicMessages(conversation.id, conversation.visitorToken);
      setMessages(nextMessages);

      if (isOpen) {
        await supportChatService.markPublicRead(conversation.id, conversation.visitorToken);
        setConversation((prev) => (prev ? { ...prev, unreadByVisitorCount: 0 } : prev));
      }
    } catch (error) {
      if (isConversationNotFoundError(error)) {
        clearStaleConversation();
        setError('Atendimento anterior expirou. Envie uma nova mensagem para iniciar novamente.');
        return;
      }
      if (isConversationClosedError(error)) {
        handleClosedConversation(conversation.closedAt);
        return;
      }
      throw error;
    }
  }, [clearStaleConversation, conversation?.closedAt, conversation?.id, conversation?.visitorToken, handleClosedConversation, isOpen]);

  useEffect(() => {
    if (!conversation?.id || !conversation.visitorToken) return;

    setLoading(true);
    refreshMessages()
      .catch(() => setError('Não foi possível sincronizar o atendimento.'))
      .finally(() => setLoading(false));
  }, [conversation?.id, conversation?.visitorToken, isOpen, refreshMessages]);

  useEffect(() => {
    if (!conversation?.id || !conversation.visitorToken) return undefined;

    const source = new EventSource(supportChatService.getPublicConversationEventsUrl(conversation.id, conversation.visitorToken));
    const sync = () => {
      refreshMessages().catch(() => {});
    };
    const handleClosed = (event: Event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as { conversation?: { closedAt?: string | null } };
        handleClosedConversation(payload.conversation?.closedAt);
      } catch {
        handleClosedConversation();
      }
    };

    source.addEventListener('message.created', sync);
    source.addEventListener('messages.read', sync);
    source.addEventListener('conversation.closed', handleClosed);
    source.onerror = () => source.close();

    return () => {
      source.removeEventListener('message.created', sync);
      source.removeEventListener('messages.read', sync);
      source.removeEventListener('conversation.closed', handleClosed);
      source.close();
    };
  }, [conversation?.id, conversation?.visitorToken, handleClosedConversation, isOpen, refreshMessages]);

  const sendMessage = useCallback(async (input: { body?: string; imageBase64?: string; imageMimeType?: string }) => {
    if (!workspaceId) {
      setError('Workspace de suporte não configurado. Defina NEXT_PUBLIC_SUPPORT_WORKSPACE_ID.');
      return;
    }

    if (!visitor.name.trim() || !visitor.email.trim()) {
      setError('Informe nome e e-mail para iniciar o atendimento.');
      return;
    }

    setSending(true);
    setError('');
    setClosedConversationMessage('');

    try {
      let activeConversation = isValidConversation(conversation) ? conversation : null;
      if (!activeConversation) {
        setConversation(null);
        activeConversation = await supportChatService.createPublicConversation({
          workspaceId,
          visitorName: visitor.name,
          visitorEmail: visitor.email,
        });
        setConversation(activeConversation);
      } else {
        const persistedConversation = await supportChatService.getPublicConversation(activeConversation.id, activeConversation.visitorToken);
        if (persistedConversation.status === 'CLOSED') {
          handleClosedConversation(persistedConversation.closedAt);
          activeConversation = await supportChatService.createPublicConversation({
            workspaceId,
            visitorName: visitor.name,
            visitorEmail: visitor.email,
          });
          setConversation(activeConversation);
        } else {
          setConversation(persistedConversation);
          activeConversation = persistedConversation;
        }
      }

      if (!isValidConversation(activeConversation)) {
        throw new Error('Não foi possível inicializar o atendimento.');
      }

      const sendResult = await supportChatService.sendPublicMessage(activeConversation.id, activeConversation.visitorToken, input);
      setConversation({ ...sendResult.conversation, visitorToken: activeConversation.visitorToken });
      setIsOpenState(true);

      // Sync failures should not discard a message that was already sent successfully.
      try {
        const nextMessages = await supportChatService.listPublicMessages(activeConversation.id, activeConversation.visitorToken);
        setMessages(nextMessages);

        if (isOpen) {
          await supportChatService.markPublicRead(activeConversation.id, activeConversation.visitorToken);
          setConversation((prev) => (prev ? { ...prev, unreadByVisitorCount: 0 } : prev));
        }
      } catch (syncError) {
        if (isConversationNotFoundError(syncError)) {
          clearStaleConversation();
          setError('Atendimento anterior expirou. Envie uma nova mensagem para iniciar novamente.');
          return;
        }
      }
    } catch (err) {
      if (isConversationNotFoundError(err)) {
        clearStaleConversation();
        setError('Atendimento anterior expirou. Envie uma nova mensagem para iniciar novamente.');
        return;
      }
      if (isConversationClosedError(err)) {
        handleClosedConversation(conversation?.closedAt);
        return;
      }
      setError(err instanceof Error ? err.message : 'Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  }, [clearStaleConversation, conversation, handleClosedConversation, isOpen, visitor.email, visitor.name, workspaceId]);

  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenState(open);
    if (open && conversation?.id && conversation.visitorToken) {
      supportChatService.markPublicRead(conversation.id, conversation.visitorToken).catch(() => {});
      setConversation((prev) => (prev ? { ...prev, unreadByVisitorCount: 0 } : prev));
    }
  }, [conversation?.id, conversation?.visitorToken]);

  const setVisitor = (nextVisitor: VisitorIdentity) => {
    setVisitorState(nextVisitor);
  };

  const value = useMemo<SupportChatContextValue>(() => ({
    isOpen,
    loading,
    sending,
    conversation,
    messages,
    visitor,
    error,
    closedConversationMessage,
    workspaceConfigured: !!workspaceId,
    setIsOpen,
    setVisitor,
    startNewConversation,
    sendMessage,
    refreshMessages,
  }), [closedConversationMessage, conversation, error, isOpen, loading, messages, refreshMessages, sendMessage, sending, setIsOpen, startNewConversation, visitor, workspaceId]);

  return <SupportChatContext.Provider value={value}>{children}</SupportChatContext.Provider>;
}

export function useSupportChat() {
  const context = useContext(SupportChatContext);
  if (!context) {
    throw new Error('SupportChatContext indisponível.');
  }
  return context;
}
