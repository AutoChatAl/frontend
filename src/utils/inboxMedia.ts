import type { InboxChannelType, MessageMediaType } from '@/types/Inbox';

const MB = 1024 * 1024;

/**
 * Teto por tipo de anexo do chat, em bytes do arquivo original.
 *
 * É o menor entre o que as plataformas aceitam — a Cloud API do WhatsApp é a mais
 * restritiva, com 5 MB em imagem e 16 MB em áudio/vídeo — e o que cabe no corpo da
 * requisição depois do inchaço de ~33% do base64. Precisa ficar igual ao
 * `inboxMediaLimits` do backend: aqui o erro aparece antes do upload, lá é a
 * checagem que vale.
 */
export const INBOX_MEDIA_MAX_BYTES: Record<MessageMediaType, number> = {
  image: 5 * MB,
  audio: 16 * MB,
  video: 16 * MB,
  document: 16 * MB,
};

const MEDIA_SUBJECT: Record<MessageMediaType, string> = {
  image: 'A imagem',
  audio: 'O áudio',
  video: 'O vídeo',
  document: 'O documento',
};

/** Canais sem envio de vídeo na API — o anexo é barrado antes do upload. */
const VIDEO_UNSUPPORTED: Partial<Record<InboxChannelType, string>> = {
  INSTAGRAM: 'O Instagram não aceita envio de vídeo pela API de mensagens diretas.',
};

export function formatBytes(bytes: number): string {
  if (bytes >= MB) {
    const mb = bytes / MB;
    // Sem casa decimal quando o número é redondo: "16 MB", não "16,0 MB".
    return `${Number.isInteger(mb) ? mb : mb.toFixed(1).replace('.', ',')} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function mediaTypeFromMime(mime: string): MessageMediaType {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  return 'document';
}

/** Mensagem de erro pronta para a barra do rodapé, ou null quando o anexo passa. */
export function validateInboxMedia(
  file: File,
  mediaType: MessageMediaType,
  channelType: InboxChannelType,
): string | null {
  if (mediaType === 'video' && VIDEO_UNSUPPORTED[channelType]) {
    return VIDEO_UNSUPPORTED[channelType]!;
  }
  const max = INBOX_MEDIA_MAX_BYTES[mediaType];
  if (file.size > max) {
    return `${MEDIA_SUBJECT[mediaType]} tem ${formatBytes(file.size)} e o limite é ${formatBytes(max)}.`;
  }
  if (file.size === 0) {
    return 'O arquivo está vazio.';
  }
  return null;
}
