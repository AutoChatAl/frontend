import type { SupportChatStatus } from '@/types/SupportChat';

export const MAX_SUPPORT_CHAT_IMAGE_BYTES = 2 * 1024 * 1024;

const SUPPORT_CHAT_STATUS_LABELS: Record<SupportChatStatus, string> = {
  OPEN: 'Aberta',
  WAITING_AGENT: 'Aguardando suporte',
  WAITING_USER: 'Aguardando usuÃ¡rio',
  CLOSED: 'Encerrada',
};

const SUPPORT_CHAT_REASON_MESSAGES: Record<string, string> = {
  SUPPORT_CHAT_EMPTY_MESSAGE: 'Envie uma mensagem ou anexe uma imagem para continuar.',
  SUPPORT_CHAT_INVALID_IMAGE_TYPE: 'Envie uma imagem em PNG, JPEG ou WebP.',
  SUPPORT_CHAT_IMAGE_TOO_LARGE: 'NÃ£o sÃ£o permitidas imagens acima de 2 MB.',
  SUPPORT_CHAT_CLOSED: 'Este atendimento foi encerrado. Envie uma nova mensagem para iniciar outro chat.',
  SUPPORT_CHAT_NOT_FOUND: 'Atendimento anterior expirou. Envie uma nova mensagem para iniciar novamente.',
};

export function getSupportChatStatusLabel(status: SupportChatStatus): string {
  return SUPPORT_CHAT_STATUS_LABELS[status] ?? status;
}

export function getSupportChatErrorMessage(reason?: string, fallback?: string): string | undefined {
  if (reason && SUPPORT_CHAT_REASON_MESSAGES[reason]) {
    return SUPPORT_CHAT_REASON_MESSAGES[reason];
  }

  return fallback;
}

export function formatSupportChatClosure(value?: string | null): string {
  if (!value) return '';

  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function getSupportChatPreviewText(value?: string | null): string {
  if (!value) return 'Sem mensagens ainda.';
  if (value === '[Imagem]') return 'ðŸ“· Imagem';
  return value;
}
