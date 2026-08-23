export type InboxChannelType = 'WHATSAPP' | 'INSTAGRAM' | 'WHATSAPP_OFFICIAL';
export type InboxDirection = 'IN' | 'OUT';
export type MessageDeliveryStatus = 'SENT' | 'DELIVERED' | 'READ';
export type MessageMediaType = 'image' | 'audio' | 'video' | 'document';

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
  /** Fim da janela de retenção (24h sobre a última mensagem), calculado no servidor. */
  expiresAt?: string;
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
  mediaUrl?: string | null;
  mediaBase64?: string | null;
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
}

/** Interruptor do multichat no workspace: desligado, nada é gravado na inbox. */
export interface InboxSettings {
  enabled: boolean;
}
