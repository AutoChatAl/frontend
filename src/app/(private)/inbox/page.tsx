'use client';
import { BadgeCheck, Check, CheckCheck, Clock, FileText, Instagram, Mic, Paperclip, Reply, Search, Send, MessageCircle, Square, X } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';

import AudioPlayer from '@/components/AudioPlayer';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import type { InboxChannelType, InboxConversation, InboxMessage, InboxOutgoingMedia, MessageMediaType } from '@/types/Inbox';
import {
  AUDIO_RECORDER_FALLBACK_MIME,
  AUDIO_WAV_MIME,
  blobToWavBase64,
  pickAudioRecorderMimeType,
} from '@/utils/AudioWav';

import { messagePreview, useInbox } from './useInbox';

function StatusTicks({ message }: { message: InboxMessage }) {
  if (message.direction !== 'OUT') return null;
  if (message.pending) return <Clock size={13} className="text-indigo-200" />;
  const status = message.deliveryStatus ?? 'SENT';
  if (status === 'SENT') return <Check size={13} className="text-indigo-200" />;
  if (status === 'DELIVERED') return <CheckCheck size={13} className="text-indigo-200" />;
  return <CheckCheck size={13} className="text-sky-300" />;
}

function mediaTypeFromMime(mime: string): MessageMediaType {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  return 'document';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

function mediaSrc(message: InboxMessage): string | null {
  if (message.mediaUrl) return message.mediaUrl;
  if (message.mediaBase64) {
    if (message.mediaBase64.startsWith('data:')) return message.mediaBase64;
    return `data:${message.mediaMimeType || 'application/octet-stream'};base64,${message.mediaBase64}`;
  }
  return null;
}

function MediaContent({ message }: { message: InboxMessage }) {
  const src = mediaSrc(message);
  if (!message.mediaType || !src) return null;
  if (message.mediaType === 'image') {
    // eslint-disable-next-line @next/next/no-img-element -- mídia de chat (CDN dinâmico / base64) não suporta next/image
    return <img src={src} alt={message.mediaFileName || 'Imagem'} className="max-h-64 max-w-full rounded-lg object-cover" />;
  }
  if (message.mediaType === 'audio') {
    return (
      <AudioPlayer
        src={src}
        variant={message.direction === 'OUT' ? 'accent' : 'default'}
        bars={28}
        className="w-72 max-w-full"
      />
    );
  }
  if (message.mediaType === 'video') {
    return <video controls src={src} className="max-h-64 max-w-full rounded-lg" />;
  }
  return (
    <a href={src} target="_blank" rel="noreferrer" download={message.mediaFileName || true} className="flex items-center gap-2 underline">
      <FileText size={16} />
      {message.mediaFileName || 'Documento'}
    </a>
  );
}

/** No balão sempre a hora: a data de cada bloco vive na badge de dia. */
function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/** Na listagem: hora no dia corrente, "Ontem" no anterior, data nos mais antigos. */
function formatConversationTime(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) return formatMessageTime(iso);
  if (isSameDay(date, yesterday)) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) return 'Hoje';
  if (isSameDay(date, yesterday)) return 'Ontem';
  const sameYear = date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString('pt-BR', sameYear
    ? { day: '2-digit', month: 'long' }
    : { day: '2-digit', month: 'long', year: 'numeric' });
}

function channelBadge(type: InboxChannelType) {
  if (type === 'INSTAGRAM') {
    return <Badge type="instagram" text="Instagram" icon={Instagram} pill />;
  }
  // Mesma cor do WhatsApp (é o mesmo app para o contato), com selo e rótulo
  // distinguindo a API Oficial da conexão via QR Code.
  if (type === 'WHATSAPP_OFFICIAL') {
    return <Badge type="whatsapp" text="API Oficial" icon={BadgeCheck} pill />;
  }
  return <Badge type="whatsapp" text="WhatsApp" icon={MessageCircle} pill />;
}

function getInitials(name?: string | null, fallback?: string | null): string {
  const source = (name || fallback || '?').trim().replace(/^@/, '');
  const parts = source.split(/\s+/).filter(Boolean);
  const first = parts[0] ?? '';
  if (!first) return '?';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? '';
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase();
}

function Avatar({
  name,
  identifier,
  avatarUrl,
  size = 44,
}: {
  name?: string | null | undefined;
  identifier?: string | null | undefined;
  avatarUrl?: string | null | undefined;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);
  const showImage = !!avatarUrl && !errored;
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- URLs de avatar de CDN dinâmico (IG/WhatsApp) não suportam next/image
        <img
          src={avatarUrl as string}
          alt={name || 'Contato'}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {getInitials(name, identifier)}
        </span>
      )}
    </div>
  );
}

function ConversationRow({
  conversation,
  active,
  onClick,
}: {
  conversation: InboxConversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-100 dark:border-slate-700/60 ${active ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'}`}
    >
      <Avatar
        name={conversation.contactName}
        identifier={conversation.contactIdentifier}
        avatarUrl={conversation.avatarUrl}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {conversation.contactName || conversation.contactIdentifier || 'Contato sem nome'}
          </span>
          <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
            {formatConversationTime(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-slate-500 dark:text-slate-400">
            {conversation.lastMessageDirection === 'OUT' ? 'Você: ' : ''}
            {conversation.lastMessagePreview || '—'}
          </span>
          {conversation.unreadCount > 0 && (
            <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold flex items-center justify-center">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
        <div>{channelBadge(conversation.channelType)}</div>
      </div>
    </button>
  );
}

export default function InboxPage() {
  const {
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
    transcribingId,
    setChannelFilter,
    setSearch,
    selectConversation,
    sendMessage,
    notifyTyping,
    transcribeMessage,
  } = useInbox();

  const [draft, setDraft] = useState('');
  const [recording, setRecording] = useState(false);
  const [replyTo, setReplyTo] = useState<InboxMessage | null>(null);
  // Transcrição fica guardada na mensagem, mas só aparece depois que o operador pede.
  const [revealedTranscriptions, setRevealedTranscriptions] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesBoxRef = useRef<HTMLDivElement>(null);
  // Gruda a rolagem na última mensagem; solta quando o usuário sobe para ler o histórico.
  const stickToBottomRef = useRef(true);
  // Espelho para o callback de gravação de áudio, que captura o estado no início da gravação.
  const replyToRef = useRef<InboxMessage | null>(null);
  replyToRef.current = replyTo;
  const selectedConversation = conversations.find((c) => c.id === selectedId) || null;

  useEffect(() => {
    stickToBottomRef.current = true;
    setReplyTo(null);
  }, [selectedId]);

  useEffect(() => {
    const el = messagesBoxRef.current;
    if (el && stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loadingMessages, selectedId]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body) return;
    try {
      stickToBottomRef.current = true;
      await sendMessage(body, undefined, replyTo);
      setDraft('');
      setReplyTo(null);
    } catch {
      // erro tratado no hook
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      stickToBottomRef.current = true;
      const base64 = await fileToBase64(file);
      const media: InboxOutgoingMedia = {
        mediaType: mediaTypeFromMime(file.type),
        base64,
        mimeType: file.type || 'application/octet-stream',
        fileName: file.name,
      };
      await sendMessage(draft, media, replyTo);
      setDraft('');
      setReplyTo(null);
    } catch {
      // erro tratado no hook
    }
  };

  const handleTranscribe = async (message: InboxMessage) => {
    // Já transcrito na chegada: revelar não custa chamada. Sem transcrição
    // (mensagem antiga ou falha anterior), busca sob demanda.
    if (!message.transcription) await transcribeMessage(message);
    setRevealedTranscriptions((prev) => new Set(prev).add(message.id));
  };

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickAudioRecorderMimeType() ?? AUDIO_RECORDER_FALLBACK_MIME;
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType });
        if (blob.size === 0) return;
        // O Instagram aceita apenas aac, m4a, wav e mp4 em DM — webm/opus sobe mas toca mudo.
        const base64 = await blobToWavBase64(blob).catch(() => '');
        if (!base64) return;
        stickToBottomRef.current = true;
        await sendMessage(
          '',
          { mediaType: 'audio', base64, mimeType: AUDIO_WAV_MIME, fileName: `audio-${Date.now()}.wav` },
          replyToRef.current,
        )
          .then(() => setReplyTo(null))
          .catch(() => {});
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      // permissão de microfone negada ou indisponível
    }
  };

  const filters: Array<{ id: InboxChannelType | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'Todos' },
    { id: 'WHATSAPP', label: 'WhatsApp' },
    { id: 'WHATSAPP_OFFICIAL', label: 'API Oficial' },
    { id: 'INSTAGRAM', label: 'Instagram' },
  ];

  return (
    // Altura = viewport − header (4rem) − padding vertical do main (p-4/sm:p-6),
    // com teto para o chat não se esticar de ponta a ponta em telas altas.
    <div className="flex h-[calc(100vh-6rem)] sm:h-[calc(100vh-7rem)] max-h-176 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
      {/* Lista de conversas */}
      <aside className="flex w-full max-w-sm shrink-0 flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="p-4 space-y-3 border-b border-slate-100 dark:border-slate-700">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Caixa de entrada</h1>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversa..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setChannelFilter(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${channelFilter === f.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <p className="p-4 text-sm text-slate-400">Carregando conversas...</p>
          ) : conversations.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">Nenhuma conversa ainda.</p>
          ) : (
            conversations.map((c) => (
              <ConversationRow
                key={c.id}
                conversation={c}
                active={c.id === selectedId}
                onClick={() => selectConversation(c.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-900">
        {!selectedConversation ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={<MessageCircle size={48} />}
              title="Selecione uma conversa"
              description="Escolha uma conversa à esquerda para ver as mensagens do WhatsApp e Instagram em tempo real."
            />
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  name={selectedConversation.contactName}
                  identifier={selectedConversation.contactIdentifier}
                  avatarUrl={selectedConversation.avatarUrl}
                  size={40}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedConversation.contactName || selectedConversation.contactIdentifier || 'Contato sem nome'}
                  </p>
                  {contactTyping ? (
                    <p className="truncate text-xs text-emerald-500">digitando…</p>
                  ) : (
                    selectedConversation.contactIdentifier && (
                      <p className="truncate text-xs text-slate-400">{selectedConversation.contactIdentifier}</p>
                    )
                  )}
                </div>
              </div>
              {channelBadge(selectedConversation.channelType)}
            </header>

            <div
              ref={messagesBoxRef}
              onScroll={(e) => {
                const el = e.currentTarget;
                stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
              }}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-2"
            >
              {loadingMessages ? (
                <p className="text-sm text-slate-400">Carregando mensagens...</p>
              ) : (
                messages.map((m, index) => {
                  const previous = index > 0 ? messages[index - 1] : undefined;
                  // Sticky no container rolável: cada badge fica presa no topo até a do
                  // dia seguinte empurrá-la para fora, marcando a virada de dia.
                  const startsDay = !previous || !isSameDay(new Date(previous.createdAt), new Date(m.createdAt));
                  const daySeparator = startsDay && (
                    <div className="sticky top-0 z-10 flex justify-center py-1">
                      <span className="rounded-full bg-slate-200/90 px-3 py-1 text-[11px] font-medium text-slate-600 backdrop-blur-sm dark:bg-slate-700/90 dark:text-slate-300">
                        {dayLabel(m.createdAt)}
                      </span>
                    </div>
                  );
                  const replyButton = !m.pending && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(m);
                        textareaRef.current?.focus();
                      }}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                      title="Responder"
                    >
                      <Reply size={14} />
                    </button>
                  );
                  return (
                    <Fragment key={m.id}>
                      {daySeparator}
                      <div
                        id={`msg-${m.id}`}
                        className={`group flex items-center gap-1 ${m.direction === 'OUT' ? 'justify-end' : 'justify-start'}`}
                      >
                        {m.direction === 'OUT' && replyButton}
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words transition-opacity duration-300 ${m.direction === 'OUT' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-sm'} ${m.pending ? 'opacity-60' : 'opacity-100'}`}
                        >
                          {m.replyToPreview && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!m.replyToMessageId) return;
                                document.getElementById(`msg-${m.replyToMessageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }}
                              className={`mb-1 block w-full rounded-lg border-l-2 px-2 py-1 text-left text-xs ${m.direction === 'OUT' ? 'border-indigo-300 bg-indigo-500/60 text-indigo-100' : 'border-indigo-400 bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'}`}
                            >
                              <span className="block font-semibold">
                                {m.replyToDirection === 'OUT' ? 'Você' : (selectedConversation.contactName || selectedConversation.contactIdentifier || 'Contato')}
                              </span>
                              <span className="block truncate">{m.replyToPreview}</span>
                            </button>
                          )}
                          {m.mediaType && (
                            <div className="mb-1">
                              <MediaContent message={m} />
                            </div>
                          )}
                          {m.body && <p>{m.body}</p>}
                          {/* Só áudio recebido: não faz sentido transcrever o que o próprio operador gravou. */}
                          {m.mediaType === 'audio' && m.direction === 'IN' && !m.pending && (
                            revealedTranscriptions.has(m.id) && m.transcription ? (
                              <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">
                                {m.transcription}
                              </p>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTranscribe(m)}
                                disabled={transcribingId === m.id}
                                className="mt-1 text-xs underline underline-offset-2 disabled:opacity-60 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              >
                                {transcribingId === m.id ? 'Transcrevendo...' : 'Transcrever'}
                              </button>
                            )
                          )}
                          <span className={`mt-1 flex items-center gap-1 text-[10px] ${m.direction === 'OUT' ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {m.sentByAi ? 'IA · ' : m.sentByAutomation ? 'Auto · ' : ''}
                            {formatMessageTime(m.createdAt)}
                            <StatusTicks message={m} />
                          </span>
                        </div>
                        {m.direction === 'IN' && replyButton}
                      </div>
                    </Fragment>
                  );
                })
              )}
            </div>

            <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
              {error && <p className="mb-2 text-xs text-rose-500">{error}</p>}
              {replyTo && (
                <div className="mb-2 flex items-start gap-2 rounded-lg border-l-2 border-indigo-500 bg-slate-50 dark:bg-slate-900 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Respondendo a {replyTo.direction === 'OUT' ? 'você' : (selectedConversation.contactName || selectedConversation.contactIdentifier || 'contato')}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{messagePreview(replyTo)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="shrink-0 rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    title="Cancelar resposta"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || recording}
                  className="shrink-0 rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-50"
                  title="Anexar arquivo"
                >
                  <Paperclip size={18} />
                </button>
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={sending}
                  className={`shrink-0 rounded-lg p-2.5 disabled:opacity-50 ${recording ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                  title={recording ? 'Parar gravação' : 'Gravar áudio'}
                >
                  {recording ? <Square size={18} /> : <Mic size={18} />}
                </button>
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (e.target.value.trim()) notifyTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                    if (e.key === 'Escape' && replyTo) {
                      setReplyTo(null);
                    }
                  }}
                  rows={1}
                  placeholder={recording ? 'Gravando áudio…' : 'Escreva uma mensagem...'}
                  disabled={recording}
                  className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none max-h-32 disabled:opacity-60"
                />
                <Button onClick={handleSend} loading={sending} disabled={!draft.trim() || recording} icon={<Send size={16} />}>
                  Enviar
                </Button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
