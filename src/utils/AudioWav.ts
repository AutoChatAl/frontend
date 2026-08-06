export const AUDIO_WAV_MIME = 'audio/wav';
export const AUDIO_WAV_SAMPLE_RATE = 16000;

export const AUDIO_RECORDER_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];

export const AUDIO_RECORDER_FALLBACK_MIME = 'audio/webm';

export function pickAudioRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return AUDIO_RECORDER_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

export function encodeWavFromAudioBuffer(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const { sampleRate } = buffer;
  const samples = buffer.getChannelData(0);
  const dataLength = samples.length * 2;
  const arrayBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: AUDIO_WAV_MIME });
}

export async function blobToWavBase64(blob: Blob, sampleRate: number = AUDIO_WAV_SAMPLE_RATE): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioCtx();
  try {
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * sampleRate), sampleRate);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    const wavBlob = encodeWavFromAudioBuffer(rendered);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('read_error'));
      reader.readAsDataURL(wavBlob);
    });
    return dataUrl.split(',')[1] ?? '';
  } finally {
    void audioContext.close();
  }
}
