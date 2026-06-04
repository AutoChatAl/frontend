export interface AudioUploadValidation {
  ok: boolean;
  mimeType?: string;
  message?: string;
}

export const AUDIO_UPLOAD = {
  autoReply: {
    maxBytes: 5 * 1024 * 1024,
    accept: 'audio/*',
  },
  comment: {
    maxBytes: 25 * 1024 * 1024,
    accept: '.mp3,.m4a,.wav,.aac,.mp4,audio/mpeg,audio/mp4,audio/m4a,audio/x-m4a,audio/aac,audio/wav',
    acceptedMimes: ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav'],
    acceptedExtensions: /\.(mp3|m4a|wav|aac|mp4)$/i,
    fallbackMime: 'audio/mp4',
    formatError: 'Formato não suportado pelo Instagram. Use MP3, M4A, AAC, WAV ou MP4.',
    audioError: 'O arquivo deve ser um áudio.',
  },
};

export function validateAudioFile(file: File): AudioUploadValidation {
  return file.type.startsWith('audio/')
    ? { ok: true, mimeType: file.type }
    : { ok: false, message: AUDIO_UPLOAD.comment.audioError };
}

export function validateCommentAudioFile(file: File): AudioUploadValidation {
  const lowerType = (file.type || '').toLowerCase();
  const lowerName = (file.name || '').toLowerCase();
  const isAcceptedMime = AUDIO_UPLOAD.comment.acceptedMimes.includes(lowerType);
  const isAcceptedExt = AUDIO_UPLOAD.comment.acceptedExtensions.test(lowerName);
  if (!isAcceptedMime && !isAcceptedExt) {
    return { ok: false, message: AUDIO_UPLOAD.comment.formatError };
  }
  return { ok: true, mimeType: isAcceptedMime ? lowerType : AUDIO_UPLOAD.comment.fallbackMime };
}
