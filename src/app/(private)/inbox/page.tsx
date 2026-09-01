'use client';
import { ArrowLeft, Check, CheckCheck, Clock, FileText, Inbox, Lock, MessageCircle, Mic, Paperclip, PanelRight, PanelRightClose, Reply, Search, Send, Square, UserCheck, X } from 'lucide-react';
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';

import AudioPlayer from '@/components/AudioPlayer';
import Button from '@/components/Button';
import { authService } from '@/services/auth.service';
import { inboxService } from '@/services/inbox.service';
import type { InboxChannelType, InboxConversation, InboxMessage, InboxOutgoingMedia, InboxRetentionDays, MessageMediaType } from '@/types/Inbox';
import {
  AUDIO_RECORDER_FALLBACK_MIME,
  AUDIO_WAV_MIME,
  blobToWavBase64,
  pickAudioRecorderMimeType,
} from '@/utils/AudioWav';

import {
  Avatar,
  bodyForBubble,
  channelBadge,
  dayLabel,
  formatConversationTime,
  formatMessageTime,
  getInitials,
  InteractiveContent,
  isSameDay,
} from './components/ChatBits';
import ChatSettingsMenu from './components/ChatSettingsMenu';
import ConversationContextPanel from './components/ConversationContextPanel';
import { messagePreview, useInbox } from './useInbox';

/**
 * Cache do último valor conhecido da configuração, só para o switch já nascer na posição
 * certa. A verdade continua sendo a API — a resposta sobrescreve o que estiver aqui.
 * Chaveado por workspace para não vazar o estado de uma conta para outra no mesmo navegador.
 */
function chatEnabledCacheKey(workspaceId: string): string {
  return `inbox_chat_enabled:${workspaceId}`;
}

/** Preferência de painel aberto/minimizado, por workspace. */
function detailsOpenCacheKey(workspaceId: string): string {
  return `inbox_details_open:${workspaceId}`;
}

/**
 * Antes da pintura: lido em layout effect, o switch nunca chega a ser desenhado na
 * posição errada. Em useEffect comum sobraria um frame com o valor padrão.
 * No servidor não há layout effect — cai em useEffect só para não emitir warning.
 */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const PANEL = 'flex flex-col bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs dark:shadow-none overflow-hidden';

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

function ConversationRow({
  conversation,
  active,
  disabled = false,
  currentUserId,
  onClick,
}: {
  conversation: InboxConversation;
  active: boolean;
  disabled?: boolean;
  currentUserId: string | null;
  onClick: () => void;
}) {
  const assignedTo = conversation.assignedTo ?? null;
  const isMine = !!assignedTo && assignedTo === currentUserId;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors border-b border-slate-100 dark:border-slate-700/60 ${disabled ? 'cursor-not-allowed' : active ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer'}`}
    >
      {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-indigo-500" aria-hidden />}
      <Avatar
        name={conversation.contactName}
        identifier={conversation.contactIdentifier}
        avatarUrl={conversation.avatarUrl}
        size={38}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
            {conversation.contactName || conversation.contactIdentifier || 'Contato sem nome'}
          </span>
          <span className="shrink-0 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
            {formatConversationTime(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-slate-500 dark:text-slate-400">
            {conversation.lastMessageDirection === 'OUT' ? 'Você: ' : ''}
            {conversation.lastMessagePreview || '—'}
          </span>
          {conversation.unreadCount > 0 && (
            <span className="shrink-0 min-w-4.5 h-4.5 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-semibold flex items-center justify-center">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {channelBadge(
            conversation.channelType,
            conversation.channelName || conversation.channelIdentifier,
          )}
          {conversation.awaitingHuman && !assignedTo && (
            <span className="rounded-full bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              aguardando
            </span>
          )}
          {assignedTo && (
            <span
              title={isMine ? 'Atribuída a você' : `Atendida por ${conversation.assignedToName ?? 'outro atendente'}`}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${isMine ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'}`}
            >
              <UserCheck size={11} />
              {isMine ? 'você' : getInitials(conversation.assignedToName)}
            </span>
          )}
        </div>
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
    resumeAi,
  } = useInbox();

  const [draft, setDraft] = useState('');
  // Configuração do workspace, carregada da API. Assume desligado enquanto não responde,
  // que é o estado mais conservador: não mostra conversa antes de saber se pode.
  const [chatEnabled, setChatEnabled] = useState(false);
  const [retentionDays, setRetentionDays] = useState<InboxRetentionDays>(1);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [savingChatSetting, setSavingChatSetting] = useState(false);
  const [savingRetention, setSavingRetention] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [canToggleChat, setCanToggleChat] = useState(false);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  // Abaixo de lg só cabe um painel por vez: a lista ou a conversa.
  const [mobilePane, setMobilePane] = useState<'list' | 'thread'>('list');
  const [replyTo, setReplyTo] = useState<InboxMessage | null>(null);
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
  const replyWindowExpiresAt = selectedConversation?.replyWindowExpiresAt ?? null;
  const replyLocked = !!selectedConversation && (!replyWindowExpiresAt || new Date(replyWindowExpiresAt).getTime() <= now);

  const workspaceId = authService.getUser()?.workspace?.id ?? null;

  useIsomorphicLayoutEffect(() => {
    if (!workspaceId) return;
    const cached = localStorage.getItem(chatEnabledCacheKey(workspaceId));
    if (cached !== null) setChatEnabled(cached === 'true');
    const cachedDetails = localStorage.getItem(detailsOpenCacheKey(workspaceId));
    if (cachedDetails !== null) setDetailsOpen(cachedDetails === 'true');
  }, [workspaceId]);

  useEffect(() => {
    const user = authService.getUser();
    const fullAccess = user?.role === 'owner' || user?.role === 'admin';
    setCanToggleChat(fullAccess);
    setHasFullAccess(fullAccess);
    setCurrentUserId(user?.id ?? null);
    inboxService.getSettings()
      .then((settings) => {
        setChatEnabled(settings.enabled);
        setRetentionDays(settings.retentionDays);
        if (workspaceId) localStorage.setItem(chatEnabledCacheKey(workspaceId), String(settings.enabled));
      })
      .catch(() => setSettingsError('Não foi possível carregar a configuração do chat.'))
      .finally(() => setSettingsLoaded(true));
  }, [workspaceId]);

  useEffect(() => {
    stickToBottomRef.current = true;
    setReplyTo(null);
  }, [selectedId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (replyLocked) setReplyTo(null);
  }, [replyLocked]);

  useEffect(() => {
    const el = messagesBoxRef.current;
    if (el && stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loadingMessages, selectedId]);

  // Atualização otimista: o gate da thread responde na hora e volta atrás se a API recusar.
  const handleToggleChat = async (next: boolean) => {
    const previous = chatEnabled;
    setChatEnabled(next);
    setSavingChatSetting(true);
    setSettingsError(null);
    try {
      const settings = await inboxService.updateSettings({ enabled: next });
      setChatEnabled(settings.enabled);
      setRetentionDays(settings.retentionDays);
      // Só grava o cache com a confirmação do servidor: um valor otimista que falhou
      // faria a próxima visita abrir na posição errada até a API responder.
      if (workspaceId) localStorage.setItem(chatEnabledCacheKey(workspaceId), String(settings.enabled));
    } catch (e) {
      setChatEnabled(previous);
      setSettingsError(e instanceof Error ? e.message : 'Não foi possível salvar a configuração do chat.');
    } finally {
      setSavingChatSetting(false);
    }
  };

  const handleRetentionChange = async (days: InboxRetentionDays) => {
    const previous = retentionDays;
    setRetentionDays(days);
    setSavingRetention(true);
    setSettingsError(null);
    try {
      const settings = await inboxService.updateSettings({ retentionDays: days });
      setRetentionDays(settings.retentionDays);
      setChatEnabled(settings.enabled);
    } catch (e) {
      setRetentionDays(previous);
      setSettingsError(e instanceof Error ? e.message : 'Não foi possível salvar a duração do histórico.');
    } finally {
      setSavingRetention(false);
    }
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || replyLocked) return;
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
    if (!file || replyLocked) return;
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

  const toggleDetails = () => {
    setDetailsOpen((previous) => {
      const next = !previous;
      if (workspaceId) localStorage.setItem(detailsOpenCacheKey(workspaceId), String(next));
      return next;
    });
  };

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
    setMobilePane('thread');
  };

  const handleAssign = (userId: string) => {
    if (!selectedId) return;
    assignConversation(selectedId, userId).catch(() => {});
  };

  const handleUnassign = () => {
    if (!selectedId) return;
    unassignConversation(selectedId).catch(() => {});
  };

  const handleResumeAi = () => {
    if (!selectedId) return;
    resumeAi(selectedId).catch(() => {});
  };

  const filters: Array<{ id: InboxChannelType | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'Todos' },
    { id: 'WHATSAPP', label: 'WhatsApp' },
    { id: 'WHATSAPP_OFFICIAL', label: 'Oficial' },
    { id: 'INSTAGRAM', label: 'Instagram' },
  ];

  return (
    // Altura = viewport − header (4rem) − padding vertical do main (p-3/sm:p-5).
    <div className="flex h-[calc(100vh-6rem)] sm:h-[calc(100vh-7rem)] flex-col gap-3">
      {/* Cabeçalho some no celular: a caixa de entrada usa a altura toda. */}
      <div className="hidden sm:flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Chat multi-plataforma</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
            WhatsApp e Instagram na mesma caixa de entrada
          </p>
        </div>

      </div>

      <div className="flex min-h-0 flex-1 gap-2 sm:gap-3">
        {/* Lista de conversas */}
        <aside className={`${PANEL} w-full shrink-0 lg:w-80 ${mobilePane === 'thread' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="space-y-2.5 border-b border-slate-100 dark:border-slate-700 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <h1 className="text-sm font-semibold text-slate-900 dark:text-white">Caixa de entrada</h1>
              <span className="shrink-0 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                {conversations.length.toLocaleString('pt-BR')} conversa{conversations.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar conversa..."
                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 pl-9 pr-3 text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-1">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setChannelFilter(f.id)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${channelFilter === f.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs dark:shadow-none' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="space-y-2 p-3 animate-pulse" aria-hidden>
                <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-700/50" />
                <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-700/50" />
                <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-700/50" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-1.5 px-6 text-center">
                <Inbox size={22} className="text-slate-300 dark:text-slate-600" />
                <p className="text-[13px] text-slate-600 dark:text-slate-400">
                  {search.trim() ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {search.trim() ? 'Tente outro termo ou limpe a busca.' : 'As mensagens recebidas aparecem aqui.'}
                </p>
              </div>
            ) : (
              conversations.map((c) => (
                <ConversationRow
                  key={c.id}
                  conversation={c}
                  active={c.id === selectedId}
                  currentUserId={currentUserId}
                  // Abrir a conversa marca como lida e dispara o recibo de leitura para o
                  // contato. Com o chat desligado o operador não viu nada, então não seleciona.
                  disabled={!chatEnabled}
                  onClick={() => handleSelectConversation(c.id)}
                />
              ))
            )}
          </div>

          {/* Barra de status + configurações: o menu abre para cima. */}
          <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 p-2.5">
            {/* Quem não pode alternar não vê o controle — só a leitura do estado. */}
            {canToggleChat && (
              <ChatSettingsMenu
                enabled={chatEnabled}
                retentionDays={retentionDays}
                loaded={settingsLoaded}
                saving={savingChatSetting}
                savingRetention={savingRetention}
                canToggle={canToggleChat}
                error={settingsError}
                onToggle={handleToggleChat}
                onRetentionChange={handleRetentionChange}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className={`h-1.5 w-1.5 rounded-full ${chatEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} aria-hidden />
                {chatEnabled ? 'Chat ativo' : 'Chat desativado'}
              </p>

            </div>
          </div>
        </aside>

        {/* Thread */}
        <section className={`${PANEL} min-w-0 flex-1 ${mobilePane === 'list' ? 'hidden lg:flex' : 'flex'}`}>
          {!chatEnabled ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500">
                <MessageCircle size={22} />
              </span>
              <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Chat desativado</p>
              <p className="max-w-xs text-[11px] text-slate-400 dark:text-slate-500">
                Abra as configurações no rodapé da lista para ligar o recebimento de mensagens.
              </p>
            </div>
          ) : !selectedConversation ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500">
                <MessageCircle size={22} />
              </span>
              <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Selecione uma conversa</p>
              <p className="max-w-xs text-[11px] text-slate-400 dark:text-slate-500">
                WhatsApp e Instagram na mesma lista, em tempo real.
              </p>
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMobilePane('list')}
                    aria-label="Voltar para a lista"
                    className="lg:hidden shrink-0 -ml-1 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <Avatar
                    name={selectedConversation.contactName}
                    identifier={selectedConversation.contactIdentifier}
                    avatarUrl={selectedConversation.avatarUrl}
                    size={36}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
                      {selectedConversation.contactName || selectedConversation.contactIdentifier || 'Contato sem nome'}
                    </p>
                    {contactTyping ? (
                      <p className="truncate text-[11px] text-emerald-500">digitando…</p>
                    ) : (
                      selectedConversation.contactIdentifier && (
                        <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">{selectedConversation.contactIdentifier}</p>
                      )
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {selectedConversation.assignedTo && (
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      <UserCheck size={11} />
                      {selectedConversation.assignedTo === currentUserId ? 'Você' : selectedConversation.assignedToName}
                    </span>
                  )}
                  {channelBadge(
                    selectedConversation.channelType,
                    selectedConversation.channelName || selectedConversation.channelIdentifier,
                  )}
                  <button
                    type="button"
                    onClick={toggleDetails}
                    aria-label={detailsOpen ? 'Minimizar detalhes da conversa' : 'Mostrar detalhes da conversa'}
                    title={detailsOpen ? 'Minimizar detalhes' : 'Mostrar detalhes'}
                    className={`shrink-0 rounded-lg border p-1.5 transition-colors cursor-pointer ${detailsOpen
                      ? 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    {detailsOpen ? <PanelRightClose size={16} /> : <PanelRight size={16} />}
                  </button>
                </div>
              </header>

              <div
                ref={messagesBoxRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
                }}
                className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/40 px-4 py-4 space-y-2"
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
                    const replyButton = !m.pending && !replyLocked && (
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
                            {(() => {
                              const text = bodyForBubble(m.body, m.interactive);
                              return text ? <p>{text}</p> : null;
                            })()}
                            {m.interactive && m.interactive.buttons.length > 0 && (
                              <InteractiveContent interactive={m.interactive} outgoing={m.direction === 'OUT'} />
                            )}
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

              <footer className="border-t border-slate-100 dark:border-slate-700 p-3">
                {error && <p className="mb-2 text-xs text-rose-500">{error}</p>}
                {replyLocked ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5">
                    <Lock size={16} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Envio bloqueado</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        O contato não escreve há mais de 24h. Você poderá responder de novo assim que ele mandar uma nova mensagem.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {replyTo && (
                      <div className="mb-2 flex items-start gap-2 rounded-lg border-l-2 border-indigo-500 bg-slate-50 dark:bg-slate-900/60 px-3 py-2">
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
                        className="shrink-0 rounded-lg p-2 sm:p-2.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-50"
                        title="Anexar arquivo"
                      >
                        <Paperclip size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={toggleRecording}
                        disabled={sending}
                        className={`shrink-0 rounded-lg p-2 sm:p-2.5 disabled:opacity-50 ${recording ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
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
                        className="min-w-0 flex-1 resize-none rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 sm:px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 max-h-32 disabled:opacity-60 transition-colors"
                      />
                      {/* No celular o rótulo sai: o ícone basta e o campo ganha a largura. */}
                      <Button onClick={handleSend} loading={sending} disabled={!draft.trim() || recording} icon={<Send size={16} />} className="shrink-0 px-2.5 sm:px-4">
                        <span className="hidden sm:inline">Enviar</span>
                      </Button>
                    </div>
                  </>
                )}
              </footer>
            </>
          )}
        </section>

        {/* Contexto do atendimento: coluna a partir de xl, gaveta abaixo disso. */}
        {chatEnabled && selectedConversation && detailsOpen && (
          <>
            <div
              onClick={toggleDetails}
              aria-hidden
              className="fixed inset-0 z-30 bg-slate-900/40 xl:hidden"
            />
            <aside className={`${PANEL} fixed inset-y-0 right-0 z-40 flex w-80 max-w-[85vw] rounded-none xl:static xl:z-auto xl:w-72 xl:max-w-none xl:shrink-0 xl:rounded-lg`}>
              <ConversationContextPanel
                conversation={selectedConversation}
                agents={agents}
                currentUserId={currentUserId}
                hasFullAccess={hasFullAccess}
                assigning={assigning}
                messageCount={messages.length}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
                onResumeAi={handleResumeAi}
              />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
