'use client';
import { Archive, ArchiveRestore, ArrowLeft, Check, CheckCheck, Clock, Inbox, Link2, Lock, Maximize2, MessageCircle, Mic, Paperclip, PanelRight, PanelRightClose, Reply, Search, Send, Square, Trash2, UserCheck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';

import AudioPlayer from '@/components/AudioPlayer';
import Button from '@/components/Button';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import Skeleton from '@/components/Skeleton';
import { useAttendantAlerts } from '@/contexts/AttendantAlertsContext';
import { authService } from '@/services/auth.service';
import { inboxService } from '@/services/inbox.service';
import type { InboxConversation, InboxDirection, InboxFilterId, InboxMessage, InboxOutgoingMedia, InboxRetentionDays, MessageShareKind } from '@/types/Inbox';
import {
  AUDIO_RECORDER_FALLBACK_MIME,
  AUDIO_WAV_MIME,
  blobToWavBase64,
  pickAudioRecorderMimeType,
} from '@/utils/AudioWav';
import { normalizeDisplayName } from '@/utils/displayName';
import { mediaTypeFromMime, validateInboxMedia } from '@/utils/inboxMedia';

import AlertsQuickMenu from './components/AlertsQuickMenu';
import {
  Avatar,
  bodyForBubble,
  isAlbumPlaceholder,
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
import DocumentBubble from './components/DocumentBubble';
import MediaLightbox, { type LightboxItem } from './components/MediaLightbox';
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
  // O arquivo vive no servidor e o link já vem assinado: é o caminho de toda mídia nova.
  // `mediaUrl` (CDN do provedor) e `mediaBase64` só aparecem em mensagens antigas.
  if (message.mediaPath) return inboxService.mediaUrl(message.mediaPath);
  if (message.mediaUrl) return message.mediaUrl;
  if (message.mediaBase64) {
    if (message.mediaBase64.startsWith('data:')) return message.mediaBase64;
    return `data:${message.mediaMimeType || 'application/octet-stream'};base64,${message.mediaBase64}`;
  }
  return null;
}

/**
 * O que o balão diz quando o contato compartilha conteúdo do Instagram.
 *
 * Reels chega marcado como vídeo e publicação como imagem, mas nenhum dos dois é
 * arquivo que a pessoa gravou: é um post, sem legenda nem autor no webhook. Um
 * player solto no meio da conversa não dizia isso ao atendente.
 */
function shareNotice(kind: MessageShareKind, direction: InboxDirection): string {
  const what = kind === 'reel' ? 'Um reels foi enviado' : 'Uma publicação do Instagram foi enviada';
  return direction === 'IN' ? `${what} por esse usuário` : what;
}

/** Capa do post compartilhado: estática, sem controles — quem quiser ver abre em tela cheia. */
function ShareThumbnail({ message, src, onExpand }: { message: InboxMessage; src: string; onExpand?: () => void }) {
  const thumbClass = 'max-h-40 max-w-full rounded-lg object-cover';
  const preview = message.mediaType === 'video'
    // `preload="metadata"` basta para o navegador desenhar o primeiro quadro.
    ? <video src={src} preload="metadata" muted playsInline className={thumbClass} />
    // eslint-disable-next-line @next/next/no-img-element -- mídia de chat (CDN dinâmico / base64) não suporta next/image
    : <img src={src} alt="Capa da publicação compartilhada" className={thumbClass} />;

  if (!onExpand) return preview;
  return (
    <button
      type="button"
      onClick={onExpand}
      title="Ampliar"
      aria-label="Ampliar publicação compartilhada"
      className="group/media relative block cursor-zoom-in overflow-hidden rounded-lg"
    >
      {preview}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover/media:bg-black/25 group-hover/media:opacity-100">
        <Maximize2 size={20} className="text-white drop-shadow" />
      </span>
    </button>
  );
}

/**
 * Miniatura no balão. Foto e vídeo abrem em tela cheia — o `onExpand` só chega
 * preenchido quando a mídia entrou na galeria da conversa (mensagem confirmada,
 * com conteúdo exibível).
 */
function MediaContent({ message, onExpand }: { message: InboxMessage; onExpand?: () => void }) {
  const src = mediaSrc(message);
  if (message.shareKind) {
    return (
      <div className="space-y-1">
        <p className={`text-xs italic ${message.direction === 'OUT' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
          {shareNotice(message.shareKind, message.direction)}
        </p>
        {/* Sem `src` o arquivo não pôde ser guardado — o aviso sozinho já diz o que chegou. */}
        {src && <ShareThumbnail message={message} src={src} {...(onExpand ? { onExpand } : {})} />}
      </div>
    );
  }
  if (!message.mediaType || !src) return null;
  if (message.mediaType === 'image') {
    const image = (
      // eslint-disable-next-line @next/next/no-img-element -- mídia de chat (CDN dinâmico / base64) não suporta next/image
      <img src={src} alt={message.mediaFileName || 'Imagem'} className="max-h-64 max-w-full rounded-lg object-cover" />
    );
    if (!onExpand) return image;
    return (
      <button
        type="button"
        onClick={onExpand}
        title="Ampliar"
        aria-label="Ampliar imagem"
        className="group/media relative block cursor-zoom-in overflow-hidden rounded-lg"
      >
        {image}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover/media:bg-black/25 group-hover/media:opacity-100">
          <Maximize2 size={20} className="text-white drop-shadow" />
        </span>
      </button>
    );
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
    return (
      <div className="relative">
        <video controls src={src} className="max-h-64 max-w-full rounded-lg" />
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            title="Ampliar"
            aria-label="Ampliar vídeo"
            className="absolute right-2 top-2 rounded-lg bg-black/55 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
          >
            <Maximize2 size={15} />
          </button>
        )}
      </div>
    );
  }
  return (
    <DocumentBubble
      src={src}
      fileName={message.mediaFileName}
      mimeType={message.mediaMimeType}
      base64={message.mediaBase64}
      outgoing={message.direction === 'OUT'}
    />
  );
}

/** Largura de cada botão revelado pelo arrasto e a partir de quanto o painel fica aberto. */
const SWIPE_ACTION_PX = 76;

function ConversationRow({
  conversation,
  active,
  disabled = false,
  currentUserId,
  canDelete = false,
  busy = false,
  groupedWithPrevious = false,
  groupedWithNext = false,
  open,
  onOpenChange,
  onClick,
  onArchive,
  onRequestDelete,
}: {
  conversation: InboxConversation;
  active: boolean;
  disabled?: boolean;
  currentUserId: string | null;
  /** Excluir é só do administrador; arquivar fica disponível para qualquer atendente. */
  canDelete?: boolean;
  busy?: boolean;
  /**
   * Vizinhas que são a mesma pessoa em outro canal. O backend já devolve as
   * vinculadas adjacentes; estas duas marcas desenham a linha que liga um card
   * ao outro — metade sai de cada lado e elas se encontram na borda.
   */
  groupedWithPrevious?: boolean;
  groupedWithNext?: boolean;
  /** Painel de ações aberto — controlado pela página para só uma linha ficar aberta por vez. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClick: () => void;
  onArchive: () => void;
  onRequestDelete: () => void;
}) {
  const assignedTo = conversation.assignedTo ?? null;
  const isMine = !!assignedTo && assignedTo === currentUserId;
  const grouped = groupedWithPrevious || groupedWithNext;
  const archived = !!conversation.archivedAt;
  const swipeEnabled = !disabled;
  const actionsWidth = SWIPE_ACTION_PX * (canDelete ? 2 : 1);
  // Enquanto o dedo está na tela quem manda é o arrasto; fora dele, o estado aberto/fechado.
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const offset = dragOffset ?? (open ? -actionsWidth : 0);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; base: number; horizontal: boolean } | null>(null);
  // O clique do navegador vem logo depois do arrasto; sem esta marca o gesto abriria a conversa.
  const swipedRef = useRef(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!swipeEnabled || event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      base: open ? -actionsWidth : 0,
      horizontal: false,
    };
    swipedRef.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.horizontal) {
      // Só assume o gesto quando ele é claramente horizontal: a rolagem vertical da lista continua livre.
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dx) <= Math.abs(dy)) {
        dragRef.current = null;
        return;
      }
      drag.horizontal = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    swipedRef.current = true;
    setDragOffset(Math.max(-actionsWidth, Math.min(0, drag.base + dx)));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const shouldOpen = drag.horizontal ? offset <= -actionsWidth / 2 : open;
    dragRef.current = null;
    setDragOffset(null);
    if (shouldOpen !== open) onOpenChange(shouldOpen);
  };

  const cancelDrag = () => {
    dragRef.current = null;
    setDragOffset(null);
  };

  return (
    <div
      className={`relative overflow-hidden ${
        grouped
          // O grupo é um cartão só: recuado dos dois lados para se destacar das
          // linhas soltas, arredondado apenas nas pontas e sem divisória interna
          // cheia — é isso que faz duas conversas lerem como uma pessoa.
          ? `mx-2 border-slate-100 bg-indigo-50/60 dark:border-slate-700/60 dark:bg-indigo-500/[0.07] ${
            groupedWithNext ? '' : 'mb-1 rounded-b-xl border-b'
          }`
          : 'border-b border-slate-100 dark:border-slate-700/60'
      }`}
    >
      {offset < 0 && (
        <div className="absolute inset-y-0 right-0 flex" style={{ width: actionsWidth }}>
          <button
            onClick={onArchive}
            disabled={busy}
            className="flex flex-1 flex-col items-center justify-center gap-1 bg-slate-500 text-[11px] font-semibold text-white transition-colors hover:bg-slate-600 disabled:opacity-60"
          >
            {archived ? <ArchiveRestore size={17} /> : <Archive size={17} />}
            {archived ? 'Desarquivar' : 'Arquivar'}
          </button>
          {canDelete && (
            <button
              onClick={onRequestDelete}
              disabled={busy}
              className="flex flex-1 flex-col items-center justify-center gap-1 bg-red-600 text-[11px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              <Trash2 size={17} />
              Excluir
            </button>
          )}
        </div>
      )}
      <button
        onClick={() => {
          if (swipedRef.current) {
            swipedRef.current = false;
            return;
          }
          // Com o painel aberto, o toque na linha serve para fechá-lo, não para abrir a conversa.
          if (open) {
            onOpenChange(false);
            return;
          }
          onClick();
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={cancelDrag}
        disabled={disabled}
        style={{
          transform: `translateX(${offset}px)`,
          // Inline e não por classe: `transition-transform` e `transition-colors` disputam a
          // mesma propriedade CSS, e a ordem entre elas não é a da lista de classes.
          transition: dragOffset !== null ? 'none' : 'transform 160ms ease-out, background-color 150ms ease-out',
          touchAction: swipeEnabled ? 'pan-y' : undefined,
        }}
        className={`relative flex w-full items-start gap-2.5 px-3 py-2.5 text-left ${
          // Dentro do grupo o fundo é o do cartão: pintar branco aqui recortaria
          // o tingido e as duas linhas voltariam a parecer soltas.
          grouped ? 'bg-transparent' : ''
        } ${disabled
          ? `cursor-not-allowed ${grouped ? '' : 'bg-white dark:bg-slate-800'}`
          : active
            ? 'bg-indigo-100/70 dark:bg-indigo-500/20'
            : `cursor-pointer hover:bg-slate-500/5 dark:hover:bg-white/5 ${grouped ? '' : 'bg-white dark:bg-slate-800'}`}`}
      >
        {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-indigo-500" aria-hidden />}
        {/* Divisória interna do grupo: recuada nos dois lados para separar as
            conversas sem cortar o cartão que as contém. */}
        {groupedWithPrevious && (
          <span className="absolute inset-x-3 top-0 h-px bg-indigo-200/70 dark:bg-indigo-400/15" aria-hidden />
        )}
        <Avatar
          name={conversation.contactName}
          identifier={conversation.contactIdentifier}
          avatarUrl={conversation.avatarUrl}
          size={38}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
              {normalizeDisplayName(conversation.contactName) || conversation.contactIdentifier || 'Contato sem nome'}
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
            {archived && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <Archive size={11} />
                arquivada
              </span>
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
    </div>
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
  // Conversa que o arrasto colocou na fila de exclusão — enquanto houver uma, o modal está aberto.
  const [conversationToDelete, setConversationToDelete] = useState<InboxConversation | null>(null);
  // Só uma linha por vez mostra o painel de ações — a anterior fecha ao abrir outra.
  const [swipedRowId, setSwipedRowId] = useState<string | null>(null);
  const [revealedTranscriptions, setRevealedTranscriptions] = useState<Set<string>>(new Set());
  // Índice da mídia aberta em tela cheia dentro de `gallery`; null com o visualizador fechado.
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // Anexo recusado antes do upload (tamanho/formato) — some no próximo envio.
  const [attachError, setAttachError] = useState<string | null>(null);
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
  const router = useRouter();
  const {
    setOpenConversationId,
    pendingConversationId,
    requestOpenConversation,
    consumePendingConversation,
  } = useAttendantAlerts();

  /**
   * Avisa o motor de alertas qual conversa está na tela: mensagem nela, com a aba
   * visível, não vira som nem cartão — a pessoa já está lendo.
   */
  useEffect(() => {
    setOpenConversationId(selectedId);
    return () => setOpenConversationId(null);
  }, [selectedId, setOpenConversationId]);

  /**
   * Link direto (`/inbox?conversation=<id>`) entra pelo mesmo caminho do clique no
   * alerta, e a URL é limpa para um F5 não reabrir a mesma conversa. Lido de
   * `window.location` em vez de `useSearchParams` de propósito — esse hook exige um
   * limite de Suspense na página, que a caixa de entrada não tem.
   */
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('conversation');
    if (!requested) return;
    requestOpenConversation(requested);
    router.replace('/inbox', { scroll: false });
  }, [requestOpenConversation, router]);

  // Quantas cargas da lista já começaram — serve para saber se a lista foi
  // recarregada depois de um reset de filtros, e não só re-renderizada.
  const loadCycleRef = useRef(0);
  const resetAtCycleRef = useRef<number | null>(null);
  useEffect(() => {
    if (loadingConversations) loadCycleRef.current += 1;
  }, [loadingConversations]);

  /**
   * Abre a conversa pedida por um alerta assim que a lista carrega. Se ela não
   * está na lista por causa de um filtro (canal, busca, arquivo), limpa os filtros
   * uma vez e espera a recarga; se mesmo assim não vier, desiste em silêncio — a
   * pessoa já está na caixa de entrada e encontra a conversa pela busca.
   */
  useEffect(() => {
    if (!pendingConversationId || loadingConversations) return;
    if (conversations.some((c) => c.id === pendingConversationId)) {
      resetAtCycleRef.current = null;
      consumePendingConversation();
      setSwipedRowId(null);
      selectConversation(pendingConversationId);
      setMobilePane('thread');
      return;
    }
    const filtered = channelFilter !== 'ALL' || viewingArchived || search.trim() !== '';
    if (filtered && resetAtCycleRef.current === null) {
      resetAtCycleRef.current = loadCycleRef.current;
      setChannelFilter('ALL');
      setViewingArchived(false);
      setSearch('');
      return;
    }
    // Filtros já limpos: só desiste depois que a lista recarregou de fato.
    if (resetAtCycleRef.current !== null && loadCycleRef.current === resetAtCycleRef.current) return;
    resetAtCycleRef.current = null;
    consumePendingConversation();
  }, [
    pendingConversationId,
    conversations,
    loadingConversations,
    channelFilter,
    viewingArchived,
    search,
    selectConversation,
    consumePendingConversation,
    setChannelFilter,
    setViewingArchived,
    setSearch,
  ]);

  // O marcador de álbum do WhatsApp não é mensagem: as fotos que ele anuncia vêm
  // logo abaixo, uma por balão. O webhook já descarta os novos — aqui somem os
  // que ficaram gravados antes.
  const visibleMessages = messages.filter((m) => !isAlbumPlaceholder(m));

  /**
   * Mensagens agrupadas por dia.
   *
   * O agrupamento não é enfeite: a badge do dia é `sticky`, e `position: sticky` é
   * limitada pelo bloco que a contém. Numa lista plana, o bloco de todas elas era a
   * thread inteira — então cada badge grudava no topo e elas se empilhavam umas sobre
   * as outras. Dentro de uma seção por dia, cada badge só existe enquanto as
   * mensagens daquele dia estão na tela, e a do dia seguinte a empurra para fora.
   */
  const dayGroups = visibleMessages.reduce<Array<{ key: string; items: InboxMessage[] }>>((groups, message) => {
    const last = groups[groups.length - 1];
    if (last && isSameDay(new Date(last.items[0]!.createdAt), new Date(message.createdAt))) {
      last.items.push(message);
      return groups;
    }
    groups.push({ key: message.id, items: [message] });
    return groups;
  }, []);

  // Galeria da conversa: fotos e vídeos na ordem da thread. As setas do
  // visualizador andam por ela, então mídia sem conteúdo exibível (mensagem
  // otimista ainda subindo, anexo grande demais para guardar) fica de fora.
  const gallery: LightboxItem[] = visibleMessages.flatMap((m) => {
    if (m.mediaType !== 'image' && m.mediaType !== 'video') return [];
    if (m.pending) return [];
    const src = mediaSrc(m);
    if (!src) return [];
    const caption = bodyForBubble(m.body, m.interactive).trim();
    return [{
      messageId: m.id,
      kind: m.mediaType,
      src,
      fileName: m.mediaFileName ?? null,
      createdAt: m.createdAt,
      ...(caption ? { caption } : {}),
    }];
  });

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
      .catch(() => setSettingsError('Não foi possível carregar a configuração das conversas.'))
      .finally(() => setSettingsLoaded(true));
  }, [workspaceId]);

  useEffect(() => {
    stickToBottomRef.current = true;
    setReplyTo(null);
    setLightboxIndex(null);
    setAttachError(null);
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
      setSettingsError(e instanceof Error ? e.message : 'Não foi possível salvar a configuração das conversas.');
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
    setAttachError(null);
    // O campo é limpo antes da ida ao servidor, não depois: a bolha otimista já entra no
    // chat no mesmo instante, e ver o mesmo texto nos dois lugares durante o envio passa
    // a sensação de que o enter não pegou. Falhando o envio, o texto volta para o campo.
    const quoted = replyTo;
    setDraft('');
    setReplyTo(null);
    try {
      stickToBottomRef.current = true;
      await sendMessage(body, undefined, quoted);
    } catch {
      // O hook já mostra o erro e tira a bolha. Aqui só devolve o que foi digitado —
      // sem atropelar a mensagem seguinte, se o atendente já começou a escrever outra.
      setDraft((current) => (current ? current : body));
      setReplyTo((current) => current ?? quoted);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setAttachError(null);
    if (!file || replyLocked || !selectedConversation) return;
    const mediaType = mediaTypeFromMime(file.type);
    // Recusa aqui evita subir dezenas de MB para ouvir um 413 do outro lado — a
    // checagem que vale continua sendo a do backend.
    const invalid = validateInboxMedia(file, mediaType, selectedConversation.channelType);
    if (invalid) {
      setAttachError(invalid);
      return;
    }
    stickToBottomRef.current = true;
    const base64 = await fileToBase64(file).catch(() => '');
    if (!base64) return;
    const media: InboxOutgoingMedia = {
      mediaType,
      base64,
      mimeType: file.type || 'application/octet-stream',
      fileName: file.name,
    };
    // Mesma lógica do envio de texto: a legenda sai do campo assim que o anexo começa
    // a subir, e só volta se o envio falhar.
    const caption = draft;
    const quoted = replyTo;
    setDraft('');
    setReplyTo(null);
    try {
      await sendMessage(caption, media, quoted);
    } catch {
      setDraft((current) => (current ? current : caption));
      setReplyTo((current) => current ?? quoted);
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
    setSwipedRowId(null);
    selectConversation(conversationId);
    setMobilePane('thread');
  };

  const handleArchive = (conversation: InboxConversation) => {
    if (archivingId) return;
    setSwipedRowId(null);
    archiveConversation(conversation.id, !conversation.archivedAt).catch(() => {});
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

  const handleConfirmDelete = () => {
    const target = conversationToDelete;
    if (!target || deletingId) return;
    deleteConversation(target.id)
      .then(() => {
        setConversationToDelete(null);
        // Na largura em que só cabe um painel, sair da conversa apagada é voltar para a lista.
        if (selectedId === target.id) setMobilePane('list');
      })
      // O erro já vai para a faixa de aviso da página; o modal fica aberto para nova tentativa.
      .catch(() => {});
  };

  const filters: Array<{ id: InboxFilterId; label: string }> = [
    { id: 'ALL', label: 'Todos' },
    { id: 'WHATSAPP', label: 'WhatsApp' },
    { id: 'WHATSAPP_OFFICIAL', label: 'Oficial' },
    { id: 'INSTAGRAM', label: 'Instagram' },
  ];

  const openArchived = (open: boolean) => {
    setSwipedRowId(null);
    setSearch('');
    setViewingArchived(open);
  };

  return (
    // Altura = viewport − header (4rem) − padding vertical do main (p-3/sm:p-5).
    <div className="flex h-[calc(100vh-6rem)] sm:h-[calc(100vh-7rem)] flex-col gap-3">
      {/* Cabeçalho some no celular: a caixa de entrada usa a altura toda. */}
      <div className="hidden sm:flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Conversas</h1>
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
              {viewingArchived ? (
                <button
                  onClick={() => openArchived(false)}
                  className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white"
                >
                  <ArrowLeft size={15} className="text-slate-400 dark:text-slate-500" />
                  Arquivadas
                </button>
              ) : (
                <h1 className="text-sm font-semibold text-slate-900 dark:text-white">Caixa de entrada</h1>
              )}
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

            {/* Dentro do arquivo o recorte por canal não vale: ele mostra tudo que foi arquivado. */}
            {!viewingArchived && (
              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-1">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSwipedRowId(null);
                      setChannelFilter(f.id);
                    }}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${channelFilter === f.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs dark:shadow-none' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Atalho para o arquivo, acima da lista — como no WhatsApp. Some quando não há
              nada arquivado: sem conversa lá dentro, a linha só ocuparia espaço. */}
          {!viewingArchived && archivedCount > 0 && (
            <button
              onClick={() => openArchived(true)}
              className="flex w-full cursor-pointer items-center gap-2.5 border-b border-slate-100 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:border-slate-700/60 dark:hover:bg-slate-700/40"
            >
              <Archive size={16} className="shrink-0 text-slate-400 dark:text-slate-500" />
              <span className="flex-1 text-[13px] font-medium text-slate-600 dark:text-slate-300">Arquivadas</span>
              <span className="shrink-0 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                {archivedCount.toLocaleString('pt-BR')}
              </span>
            </button>
          )}

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
                  {search.trim()
                    ? 'Nenhuma conversa encontrada'
                    : viewingArchived ? 'Nenhuma conversa arquivada' : 'Nenhuma conversa ainda'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {search.trim()
                    ? 'Tente outro termo ou limpe a busca.'
                    : viewingArchived
                      ? 'Arraste uma conversa para o lado para arquivar.'
                      : 'As mensagens recebidas aparecem aqui.'}
                </p>
              </div>
            ) : (
              conversations.map((c, index) => {
                const startsGroup = !!c.linkGroupId && c.linkGroupId !== conversations[index - 1]?.linkGroupId
                  && c.linkGroupId === conversations[index + 1]?.linkGroupId;
                const groupSize = c.linkGroupId
                  ? conversations.filter((other) => other.linkGroupId === c.linkGroupId).length
                  : 0;
                return (<Fragment key={c.id}>
                  {/* Cabeçalho do cartão de grupo. Uma linha fina sozinha mostra que
                      há relação mas não diz qual; o rótulo tira a adivinhação, e só
                      aparece quando existe grupo — nenhuma conversa solta paga por ele. */}
                  {startsGroup && (
                    <div className="mx-2 flex items-center gap-1.5 rounded-t-xl bg-indigo-50/60 px-3 pb-1 pt-2 dark:bg-indigo-500/[0.07]">
                      <Link2 size={12} className="shrink-0 text-indigo-500 dark:text-indigo-400" />
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">
                        Mesma pessoa
                      </span>
                      <span className="text-[11px] text-indigo-400/80 dark:text-indigo-400/60">
                        · {groupSize} canais
                      </span>
                    </div>
                  )}
                  <ConversationRow
                    key={c.id}
                    conversation={c}
                    active={c.id === selectedId}
                    currentUserId={currentUserId}
                    groupedWithPrevious={
                      !!c.linkGroupId && c.linkGroupId === conversations[index - 1]?.linkGroupId
                    }
                    groupedWithNext={
                      !!c.linkGroupId && c.linkGroupId === conversations[index + 1]?.linkGroupId
                    }
                    // Abrir a conversa marca como lida e dispara o recibo de leitura para o
                    // contato. Com o chat desligado o operador não viu nada, então não seleciona.
                    disabled={!chatEnabled}
                    // Exclusão é irreversível e vale para o workspace inteiro: só dono/admin.
                    canDelete={hasFullAccess}
                    busy={archivingId === c.id || deletingId === c.id}
                    open={swipedRowId === c.id}
                    onOpenChange={(open) => setSwipedRowId(open ? c.id : null)}
                    onClick={() => handleSelectConversation(c.id)}
                    onArchive={() => handleArchive(c)}
                    onRequestDelete={() => {
                      setSwipedRowId(null);
                      setConversationToDelete(c);
                    }}
                  />
                </Fragment>);
              })
            )}
          </div>

          {/* Barra de status + configurações: o menu abre para cima. */}
          <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 p-2.5">
            {/* Alertas são de cada atendente: o atalho aparece para todo mundo. */}
            <AlertsQuickMenu />
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
                {chatEnabled ? 'Conversas ligadas' : 'Conversas desligadas'}
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
              <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Conversas desligadas</p>
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
                  <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Carregando mensagens">
                    {['w-2/3', 'w-1/2', 'w-4/5', 'w-2/5', 'w-3/5'].map((width, index) => (
                      <div key={width} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                        <Skeleton className={`h-10 ${width} ${index % 2 === 0 ? 'rounded-bl-sm' : 'rounded-br-sm'}`} />
                      </div>
                    ))}
                  </div>
                ) : (
                  dayGroups.map((group) => (
                    <section key={group.key} className="space-y-2">
                      <div className="sticky top-0 z-10 flex justify-center py-1">
                        <span className="rounded-full bg-slate-200/90 px-3 py-1 text-[11px] font-medium text-slate-600 backdrop-blur-sm dark:bg-slate-700/90 dark:text-slate-300">
                          {dayLabel(group.items[0]!.createdAt)}
                        </span>
                      </div>
                      {group.items.map((m) => {
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
                          <div
                            key={m.id}
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
                              {m.mediaType && (() => {
                                const galleryIndex = gallery.findIndex((item) => item.messageId === m.id);
                                return (
                                  <div className="mb-1">
                                    <MediaContent
                                      message={m}
                                      {...(galleryIndex >= 0 ? { onExpand: () => setLightboxIndex(galleryIndex) } : {})}
                                    />
                                  </div>
                                );
                              })()}
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
                                {m.editedAt ? 'editada · ' : ''}
                                {formatMessageTime(m.createdAt)}
                                <StatusTicks message={m} />
                              </span>
                            </div>
                            {m.direction === 'IN' && replyButton}
                          </div>
                        );
                      })}
                    </section>
                  ))
                )}
              </div>

              <footer className="border-t border-slate-100 dark:border-slate-700 p-3">
                {(attachError || error) && <p className="mb-2 text-xs text-rose-500">{attachError || error}</p>}
                {replyLocked ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5">
                    <Lock size={16} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Resposta indisponível por enquanto</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {selectedConversation.channelType === 'WHATSAPP_OFFICIAL'
                          ? 'Este cliente não fala com você há mais de 24h. Para chamar de novo, use um modelo aprovado em uma campanha.'
                          : 'Este cliente não fala com você há mais de 24h. Você poderá responder assim que ele mandar uma nova mensagem.'}
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
                      {/* Sem estado de carregando: quem mostra o envio em curso é a bolha
                          apagada no chat, e travar o botão impediria a mensagem seguinte,
                          que o enter já aceita. */}
                      <Button onClick={handleSend} disabled={!draft.trim() || recording} icon={<Send size={16} />} className="shrink-0 px-2.5 sm:px-4">
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
                conversations={conversations}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
                onResumeAi={handleResumeAi}
                onLink={(targetId) => { void linkConversation(selectedConversation.id, targetId); }}
                onUnlink={() => { void unlinkConversation(selectedConversation.id); }}
                onRenameContact={(name) => { void renameContact(selectedConversation.id, name); }}
              />
            </aside>
          </>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={!!conversationToDelete}
        onClose={() => setConversationToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={!!deletingId}
        title="Excluir conversa"
        message={`A conversa com ${conversationToDelete?.contactName || conversationToDelete?.contactIdentifier || 'este contato'} e todo o histórico dela saem do chat para toda a equipe. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir conversa"
      />

      {lightboxIndex !== null && gallery[lightboxIndex] && (
        <MediaLightbox
          items={gallery}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
