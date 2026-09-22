export type InboxChannelType = 'WHATSAPP' | 'INSTAGRAM' | 'WHATSAPP_OFFICIAL';
export type InboxDirection = 'IN' | 'OUT';
/** Opções da barra de filtros da lista. O arquivo não entra aqui: é uma vista à parte. */
export type InboxFilterId = InboxChannelType | 'ALL';
export type MessageDeliveryStatus = 'SENT' | 'DELIVERED' | 'READ';
export type MessageMediaType = 'image' | 'audio' | 'video' | 'document';

/** Conteúdo do próprio Instagram compartilhado no direct, e não um arquivo enviado. */
export type MessageShareKind = 'reel' | 'post';

export interface InboxConversation {
  id: string;
  workspaceId: string;
  contactId: string;
  channelId: string;
  channelType: InboxChannelType;
  contactName?: string | null;
  contactIdentifier?: string | null;
  avatarUrl?: string | null;
  lastMessageAt: string;
  lastInboundAt?: string | null;
  lastMessagePreview: string;
  lastMessageDirection: InboxDirection;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  /** Atendente responsável — quando preenchido, só ele e o dono do workspace veem a conversa. */
  assignedTo?: string | null;
  assignedToName?: string | null;
  assignedAt?: string | null;
  /** Estado de atendimento do contato, vindo do funil. */
  attendanceStatus?: string | null;
  /** O contato pediu atendimento humano e ainda não foi assumido. */
  awaitingHuman?: boolean;
  /** Até quando a IA está fora desta conversa. */
  aiPausedUntil?: string | null;
  /** Número/@ do canal que recebeu a mensagem — não o tipo do canal. */
  channelIdentifier?: string | null;
  channelName?: string | null;
  /** Preenchido = conversa arquivada, fora da caixa principal. */
  archivedAt?: string | null;
  /** Fim da janela de retenção configurada no workspace, calculado no servidor. */
  /**
   * Conversas com o mesmo valor são a mesma pessoa em canais diferentes. O
   * vínculo é só visual: o envio e a IA continuam presos ao canal da conversa.
   */
  linkGroupId?: string | null;
  expiresAt?: string;
  replyWindowExpiresAt?: string | null;
}

/** Membro do workspace que pode receber uma transferência. */
export interface InboxAgent {
  id: string;
  name: string;
  email: string;
  role: string;
}

/** Botão/card enviado ao contato (botão de URL no WhatsApp, template no Instagram). */
export interface InboxMessageInteractiveButton {
  label: string;
  url?: string | null;
}

export interface InboxMessageInteractive {
  /**
   * `buttons` — botão de URL anexado ao texto (WhatsApp).
   * `card` — generic template com título/imagem (Instagram).
   * `quick_replies` — chips de resposta rápida abaixo da mensagem.
   */
  kind: 'buttons' | 'card' | 'quick_replies';
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  buttons: InboxMessageInteractiveButton[];
  /** O card é a mensagem inteira — o corpo não deve ser repetido acima dele. */
  replacesBody?: boolean;
}

export interface InboxMessage {
  id: string;
  conversationId: string;
  contactId: string;
  channelId: string;
  channelType: InboxChannelType;
  direction: InboxDirection;
  body: string;
  mediaType?: MessageMediaType | null;
  /**
   * Reels ou publicação do Instagram compartilhada no direct. O balão anuncia o que é
   * em vez de soltar um player sem contexto — a mídia é de um post, não um arquivo
   * que o contato gravou.
   */
  shareKind?: MessageShareKind | null;
  mediaUrl?: string | null;
  /** Só em mensagens antigas — hoje o arquivo vem por `mediaPath`. */
  mediaBase64?: string | null;
  /** Caminho assinado da mídia na API, com validade própria. Relativo à base da API. */
  mediaPath?: string | null;
  mediaMimeType?: string | null;
  mediaFileName?: string | null;
  sentByAi?: boolean;
  sentByAutomation?: boolean;
  /** Transcrição do áudio, exibida sob demanda — o balão continua mostrando o áudio. */
  transcription?: string | null;
  deliveryStatus?: MessageDeliveryStatus;
  replyToMessageId?: string | null;
  replyToPreview?: string | null;
  replyToDirection?: InboxDirection | null;
  /** Presente quando a mensagem levou botão ou card — desenhado no balão. */
  interactive?: InboxMessageInteractive | null;
  readAt?: string | null;
  createdAt: string;
  /** Somente no cliente: mensagem otimista aguardando confirmação do envio. */
  pending?: boolean;
}

export interface InboxOutgoingMedia {
  mediaType: MessageMediaType;
  base64: string;
  mimeType: string;
  fileName?: string;
}

export interface InboxListFilters {
  channelType?: InboxChannelType;
  search?: string;
  /** `true` lista o arquivo em vez da caixa principal. */
  archived?: boolean;
}

export type InboxRetentionDays = 1 | 7 | 15 | 30;

export const INBOX_RETENTION_OPTIONS: ReadonlyArray<{ days: InboxRetentionDays; label: string }> = [
  { days: 1, label: '24h' },
  { days: 7, label: '7 dias' },
  { days: 15, label: '15 dias' },
  { days: 30, label: '30 dias' },
];

/** Interruptor do multichat no workspace: desligado, nada é gravado na inbox. */
export interface InboxSettings {
  enabled: boolean;
  retentionDays: InboxRetentionDays;
}

export interface UpdateInboxSettingsPayload {
  enabled?: boolean;
  retentionDays?: InboxRetentionDays;
}
