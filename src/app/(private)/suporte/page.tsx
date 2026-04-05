'use client';

/* eslint-disable @next/next/no-img-element */

import { ImagePlus, Loader2, MessageCircle, Search, Send, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ConfirmDeleteModal from '../../../components/ConfirmDeleteModal';
import IconButton from '../../../components/IconButton';
import { authService } from '../../../services/auth.service';
import { supportChatService } from '../../../services/support-chat.service';
import type { SupportChatConversation, SupportChatMessage, SupportChatStatus } from '../../../types/SupportChat';
import { formatSupportChatClosure, getSupportChatPreviewText, getSupportChatStatusLabel, MAX_SUPPORT_CHAT_IMAGE_BYTES } from '../../../utils/supportChat';

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] ?? '' : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function getStatusTone(status: SupportChatStatus) {
  if (status === 'WAITING_AGENT') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
  if (status === 'WAITING_USER') return 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300';
  if (status === 'CLOSED') return 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
}

const filters: Array<{ label: string; value: SupportChatStatus | 'ALL' }> = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Aguardando suporte', value: 'WAITING_AGENT' },
  { label: 'Aguardando usuário', value: 'WAITING_USER' },
  { label: 'Abertas', value: 'OPEN' },
  { label: 'Encerradas', value: 'CLOSED' },
];

export default function SupportPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<SupportChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SupportChatStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isRoleChecking, setIsRoleChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const suppressNextMessageCreatedSyncRef = useRef(false);
  const currentUserId = authService.getUser()?.id || '';

  const scrollThreadToBottom = useCallback(() => {
    const container = threadRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 0);
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    const cachedUser = authService.getUser();
    const cachedIsAdmin = cachedUser?.role === 'admin' || cachedUser?.role === 'owner';
    setIsAdmin(cachedIsAdmin);

    authService.fetchMe()
      .then((user) => {
        if (!mounted) return;
        const admin = user.role === 'admin' || user.role === 'owner';
        setIsAdmin(admin);
        if (!admin) {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        if (!mounted) return;
        setIsAdmin(false);
        router.replace('/dashboard');
      })
      .finally(() => {
        if (mounted) {
          setIsRoleChecking(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  const selectedConversationIdRef = useRef(selectedConversationId);
  selectedConversationIdRef.current = selectedConversationId;

  const loadConversations = useCallback(async (keepSelection = true) => {
    const shouldToggleLoading = !keepSelection;
    if (shouldToggleLoading) setLoading(true);
    try {
      const next = await supportChatService.listAdminConversations({ status: statusFilter, search });
      setConversations(next);
      const previousSelectedId = selectedConversationIdRef.current;
      const shouldReplaceSelection = !keepSelection || !next.some((conversation: SupportChatConversation) => conversation.id === previousSelectedId);
      const nextSelectedId = shouldReplaceSelection ? (next[0]?.id || '') : previousSelectedId;
      if (shouldReplaceSelection) {
        setSelectedConversationId(nextSelectedId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os atendimentos.');
    } finally {
      if (shouldToggleLoading) setLoading(false);
    }
  }, [search, statusFilter]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setThreadLoading(true);
    try {
      const nextMessages = await supportChatService.listConversationMessages(conversationId);
      setMessages(nextMessages);
      await supportChatService.markAdminRead(conversationId);
      setConversations((prev) => prev.map((conversation) => (
        conversation.id === conversationId
          ? { ...conversation, unreadByAdminCount: 0 }
          : conversation
      )));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a conversa selecionada.');
    } finally {
      setThreadLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isRoleChecking || !isAdmin) return;
    loadConversations(false).catch(() => {});
  }, [isAdmin, isRoleChecking, loadConversations]);

  useEffect(() => {
    if (isRoleChecking || !isAdmin) return;
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedConversationId).catch(() => {});
  }, [isAdmin, isRoleChecking, selectedConversationId, loadMessages]);

  useEffect(() => {
    if (!selectedConversationId || threadLoading) return;
    scrollThreadToBottom();
  }, [messages, selectedConversationId, threadLoading, scrollThreadToBottom]);

  useEffect(() => {
    if (isRoleChecking || !isAdmin) return;

    const source = new EventSource(supportChatService.getWorkspaceEventsUrl());
    const syncWorkspace = () => {
      loadConversations(true).catch(() => {});
    };

    source.addEventListener('conversation.created', syncWorkspace);
    source.addEventListener('conversation.updated', syncWorkspace);
    source.addEventListener('conversation.deleted', syncWorkspace);
    // SSE auth is succeeding in production logs; trigger one initial sync from
    // this effect to guarantee conversation list request dispatch.
    syncWorkspace();

    return () => {
      source.removeEventListener('conversation.created', syncWorkspace);
      source.removeEventListener('conversation.updated', syncWorkspace);
      source.removeEventListener('conversation.deleted', syncWorkspace);
      source.close();
    };
  }, [isAdmin, isRoleChecking, loadConversations]);

  useEffect(() => {
    if (isRoleChecking || !isAdmin) return undefined;
    if (!selectedConversationId) return undefined;

    const source = new EventSource(supportChatService.getConversationEventsUrl(selectedConversationId));
    const syncConversation = () => {
      loadMessages(selectedConversationId).catch(() => {});
      loadConversations(true).catch(() => {});
    };

    const handleMessageCreated = (event: Event) => {
      let payload:
        | { message?: SupportChatMessage; conversation?: SupportChatConversation }
        | undefined;

      try {
        payload = JSON.parse((event as MessageEvent).data) as { message?: SupportChatMessage; conversation?: SupportChatConversation };
      } catch {
        syncConversation();
        return;
      }

      const nextMessage = payload?.message;
      const nextConversation = payload?.conversation;

      if (!nextMessage || nextMessage.supportChatId !== selectedConversationId) {
        syncConversation();
        return;
      }

      setMessages((prev) => (
        prev.some((message) => message.id === nextMessage.id)
          ? prev
          : [...prev, nextMessage]
      ));

      if (nextConversation) {
        setConversations((prev) => {
          const withoutCurrent = prev.filter((conversation) => conversation.id !== nextConversation.id);
          return [{ ...nextConversation, unreadByAdminCount: 0 }, ...withoutCurrent];
        });
      }

      if (
        suppressNextMessageCreatedSyncRef.current
        && nextMessage.senderType === 'ADMIN'
        && nextMessage.senderUserId === currentUserId
      ) {
        suppressNextMessageCreatedSyncRef.current = false;
      }
    };

    source.addEventListener('message.created', handleMessageCreated);
    source.addEventListener('messages.read', syncConversation);
    source.addEventListener('conversation.closed', syncConversation);

    return () => {
      source.removeEventListener('message.created', handleMessageCreated);
      source.removeEventListener('messages.read', syncConversation);
      source.removeEventListener('conversation.closed', syncConversation);
      source.close();
    };
  }, [currentUserId, isAdmin, isRoleChecking, selectedConversationId, loadConversations, loadMessages]);

  const handleSend = async () => {
    if (!selectedConversationId) return;

    setSending(true);
    setError('');

    try {
      const payload: { body?: string; imageBase64?: string; imageMimeType?: string } = {};
      if (draft.trim()) {
        payload.body = draft.trim();
      }
      if (imageFile) {
        payload.imageBase64 = await fileToBase64(imageFile);
        payload.imageMimeType = imageFile.type;
      }

      suppressNextMessageCreatedSyncRef.current = true;
      const result = await supportChatService.sendAdminMessage(selectedConversationId, payload);
      setMessages((prev) => (
        prev.some((message) => message.id === result.message.id)
          ? prev
          : [...prev, result.message]
      ));
      setConversations((prev) => {
        const nextConversation = { ...result.conversation, unreadByAdminCount: 0 };
        const withoutCurrent = prev.filter((conversation) => conversation.id !== nextConversation.id);
        return [nextConversation, ...withoutCurrent];
      });
      setDraft('');
      setImageFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      suppressNextMessageCreatedSyncRef.current = false;
      setError(err instanceof Error ? err.message : 'Não foi possível responder o atendimento.');
    } finally {
      setSending(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversationId) return;

    setClosing(true);
    try {
      await supportChatService.closeConversation(selectedConversationId);
      await loadConversations(true);
      await loadMessages(selectedConversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível encerrar o atendimento.');
    } finally {
      setClosing(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversationId) return;

    setDeleting(true);
    try {
      await supportChatService.deleteConversation(selectedConversationId);
      setIsDeleteModalOpen(false);
      await loadConversations(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível deletar a conversa.');
    } finally {
      setDeleting(false);
    }
  };

  if (isRoleChecking) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Validando permissões...
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleting) setIsDeleteModalOpen(false);
        }}
        onConfirm={handleDeleteConversation}
        title="Deletar conversa"
        message="Tem certeza que deseja deletar esta conversa de suporte? Todas as mensagens vinculadas também serão removidas permanentemente."
        confirmLabel="Deletar conversa"
        loading={deleting}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Suporte</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Atendimento em tempo real com conversas ativas do site público.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="flex h-[70vh] min-h-0 max-h-[70vh] flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, e-mail ou mensagem"
              className="w-full bg-transparent text-sm text-slate-700 outline-none dark:text-slate-200"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === filter.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" />Carregando conversas...</div>
            ) : conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Nenhuma conversa encontrada.
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedConversationId === conversation.id ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30' : conversation.unreadByAdminCount > 0 ? 'border-amber-200 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/20' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">{conversation.visitorName}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusTone(conversation.status)}`}>
                          {getSupportChatStatusLabel(conversation.status)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{conversation.visitorEmail}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-400">{formatDateTime(conversation.lastMessageAt)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm text-slate-600 dark:text-slate-300">{getSupportChatPreviewText(conversation.lastMessagePreview)}</p>
                    {conversation.unreadByAdminCount > 0 && (
                      <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {conversation.unreadByAdminCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="flex h-[70vh] min-h-0 max-h-[70vh] flex-col rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          {!selectedConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-slate-500 dark:text-slate-400">
              <MessageCircle size={28} />
              <p>Selecione uma conversa para iniciar o atendimento.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedConversation.visitorName}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{selectedConversation.visitorEmail}</p>
                  <p className="mt-1 text-xs text-slate-400">Última atividade: {formatDateTime(selectedConversation.lastMessageAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    <ShieldCheck size={14} />
                    {getSupportChatStatusLabel(selectedConversation.status)}
                  </span>
                  <button
                    type="button"
                    onClick={handleCloseConversation}
                    disabled={closing || selectedConversation.status === 'CLOSED'}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900 dark:hover:bg-rose-950/30"
                  >
                    <XCircle size={16} />
                    {closing ? 'Encerrando...' : 'Encerrar atendimento'}
                  </button>
                  <IconButton
                    icon={<Trash2 size={16}/>}
                    onClick={() => setIsDeleteModalOpen(true)}
                    title="Deletar conversa"
                    variant="danger"
                    size="md"
                    disabled={deleting}
                    className="border border-red-200 dark:border-red-900"
                  />
                </div>
              </div>

              <div ref={threadRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 px-6 py-5 dark:bg-slate-900/50">
                {threadLoading ? (
                  <div className="flex items-center justify-center py-10 text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" />Carregando conversa...</div>
                ) : (
                  <>
                    {messages.map((message) => {
                      const isAdminMessage = message.senderType === 'ADMIN';
                      return (
                        <div key={message.id} className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isAdminMessage ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100'}`}>
                            {message.body && <p className="whitespace-pre-wrap wrap-break-word">{message.body}</p>}
                            {message.imageBase64 && (
                              <img
                                src={`data:${message.imageMimeType || 'image/png'};base64,${message.imageBase64}`}
                                alt="Imagem da conversa"
                                className="mt-2 max-h-72 w-full rounded-xl object-cover"
                              />
                            )}
                            <div className={`mt-2 text-[11px] ${isAdminMessage ? 'text-indigo-100' : 'text-slate-400'}`}>
                              {formatDateTime(message.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {selectedConversation.closedAt && (
                      <div className="flex justify-center">
                        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                          Conversa encerrada em {formatSupportChatClosure(selectedConversation.closedAt)}.
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-slate-200 px-6 py-5 dark:border-slate-800">
                {imageFile && (
                  <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    <span className="truncate">{imageFile.name}</span>
                    <button type="button" onClick={() => { setImageFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-rose-500">
                      Remover
                    </button>
                  </div>
                )}

                {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}

                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={3}
                    placeholder="Responder atendimento..."
                    className="min-h-26 flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                  <div className="flex items-center gap-2 lg:flex-col">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const nextFile = event.target.files?.[0] || null;
                        if (!nextFile) {
                          setImageFile(null);
                          return;
                        }

                        if (nextFile.size > MAX_SUPPORT_CHAT_IMAGE_BYTES) {
                          setImageFile(null);
                          setError('Não são permitidas imagens acima de 2 MB.');
                          if (fileRef.current) fileRef.current.value = '';
                          return;
                        }

                        setImageFile(nextFile);
                        setError('');
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                      <ImagePlus size={16} />
                      Imagem
                    </button>
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={sending || (!draft.trim() && !imageFile) || selectedConversation.status === 'CLOSED'}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Enviar
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
