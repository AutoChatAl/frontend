'use client';

/* eslint-disable @next/next/no-img-element */

import { ImagePlus, MessageCircle, Send, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSupportChat } from '../../contexts/SupportChatContext';
import { MAX_SUPPORT_CHAT_IMAGE_BYTES } from '../../utils/supportChat';

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

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

export default function SupportChatWidget() {
  const {
    isOpen,
    loading,
    sending,
    conversation,
    messages,
    error,
    closedConversationMessage,
    workspaceConfigured,
    setIsOpen,
    startNewConversation,
    sendMessage,
  } = useSupportChat();
  const [draft, setDraft] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const unreadBadge = useMemo(() => conversation?.unreadByVisitorCount ?? 0, [conversation?.unreadByVisitorCount]);

  const scrollToLatestMessage = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    scrollToLatestMessage();
  }, [isOpen, messages, closedConversationMessage, scrollToLatestMessage]);

  const handleSubmit = async () => {
    if (!workspaceConfigured) return;

    const payload: { body?: string; imageBase64?: string; imageMimeType?: string } = {};
    if (draft.trim()) {
      payload.body = draft.trim();
    }

    if (imageFile) {
      payload.imageBase64 = await fileToBase64(imageFile);
      payload.imageMimeType = imageFile.type;
    }

    await sendMessage(payload);
    setDraft('');
    setImageFile(null);
    setUploadError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-3 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700"
          >
            <MessageCircle size={18} />
            Falar com suporte
            {unreadBadge > 0 && (
              <span className="absolute -top-1 -right-1 min-w-6 h-6 rounded-full bg-rose-500 px-1.5 text-center text-xs font-bold text-white ring-2 ring-white dark:ring-slate-900 flex items-center justify-center">
                {unreadBadge > 9 ? '9+' : unreadBadge}
              </span>
            )}
          </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed bottom-0 right-6 z-40 w-[min(92vw,420px)] rounded-t-3xl rounded-b-none border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/40">
          <div className="flex items-center justify-between rounded-t-3xl bg-indigo-600 px-5 py-4 text-white dark:bg-slate-900">
            <div>
              <h3 className="text-sm font-semibold">Suporte Synq</h3>
              <p className="text-xs text-slate-300">O tempo de resposta máximo é de 24 horas</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex h-140 flex-col">
            <div ref={messagesContainerRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-slate-900/70">
              {!workspaceConfigured && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  Configure `NEXT_PUBLIC_SUPPORT_WORKSPACE_ID` para habilitar o suporte.
                </div>
              )}

              {closedConversationMessage ? (
                <div className="flex min-h-full items-center justify-center py-6">
                  <div className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Conversa encerrada</h4>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{closedConversationMessage}</p>
                    <button
                      type="button"
                      onClick={startNewConversation}
                      className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Iniciar nova conversa
                    </button>
                  </div>
                </div>
              ) : messages.length === 0 && !loading ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  Envie a primeira mensagem para iniciar o atendimento.
                </div>
              ) : null}

              {!closedConversationMessage && messages.map((message: { id: string; senderType: string; body?: string | null; imageBase64?: string | null; imageMimeType?: string | null; createdAt: string }, index: number) => {
                const isVisitor = message.senderType === 'VISITOR';
                const previousMessage = index > 0 ? messages[index - 1] : null;
                const currentDay = new Date(message.createdAt).toDateString();
                const previousDay = previousMessage ? new Date(previousMessage.createdAt).toDateString() : null;
                const showDateSeparator = !previousDay || previousDay !== currentDay;

                return (
                  <div key={message.id}>
                    {showDateSeparator && (
                      <div className="mb-2 flex justify-center">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                    )}

                    <div className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[82%] rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                          isVisitor
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100'
                        }`}
                      >
                        {message.body && <p className="whitespace-pre-wrap wrap-break-word">{message.body}</p>}
                        {message.imageBase64 && (
                          <img
                            src={`data:${message.imageMimeType || 'image/png'};base64,${message.imageBase64}`}
                            alt="Imagem enviada no suporte"
                            className="mt-2 max-h-56 w-full rounded-xl object-cover"
                          />
                        )}
                        <div className={`mt-2 text-[11px] ${isVisitor ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
              {!closedConversationMessage && (
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={3}
                  placeholder="Digite sua mensagem..."
                  className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              )}

              {!closedConversationMessage && imageFile && (
                <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <span className="truncate">{imageFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      if (fileRef.current) fileRef.current.value = '';
                    }}
                    className="text-rose-500"
                  >
                    Remover
                  </button>
                </div>
              )}

              {(uploadError || error) && !closedConversationMessage && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{uploadError || error}</div>}

              {!closedConversationMessage && <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] || null;
                      if (!nextFile) {
                        setImageFile(null);
                        setUploadError('');
                        return;
                      }

                      if (nextFile.size > MAX_SUPPORT_CHAT_IMAGE_BYTES) {
                        setImageFile(null);
                        setUploadError('Não são permitidas imagens acima de 2 MB.');
                        if (fileRef.current) fileRef.current.value = '';
                        return;
                      }

                      setImageFile(nextFile);
                      setUploadError('');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    <ImagePlus size={16} />
                    Imagem
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={sending || (!draft.trim() && !imageFile)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={16} />
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
