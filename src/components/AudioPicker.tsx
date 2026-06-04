'use client';

import { AlertCircle, Loader2, Mic, Pause, Play, Square, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface AudioPickerValue {
  base64: string;
  mimeType: string;
  fileName: string;
}

interface UploadValidationResult {
  ok: boolean;
  mimeType?: string;
  message?: string;
}

interface AudioPickerProps {
  value: AudioPickerValue | null;
  onChange: (value: AudioPickerValue | null) => void;
  maxBytes: number;
  accept: string;
  validateUpload: (file: File) => UploadValidationResult;
  error?: string | undefined;
}

const AUDIO_PICKER_CONFIG = {
  waveformBars: 44,
  minBarHeightPct: 12,
  placeholderBar: { base: 0.35, amplitude: 0.3 },
  recordSampleRate: 16000,
  recordedMimeType: 'audio/wav',
  recorderFallbackType: 'audio/webm',
  recorderMimeCandidates: ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'],
};

function encodeWavFromAudioBuffer(buffer: AudioBuffer): Blob {
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

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

async function blobToWavBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioCtx();
  try {
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const targetRate = AUDIO_PICKER_CONFIG.recordSampleRate;
    const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * targetRate), targetRate);
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

function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return AUDIO_PICKER_CONFIG.recorderMimeCandidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function formatTime(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.floor(totalSeconds) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function extractWaveform(src: string, buckets: number): Promise<number[]> {
  const response = await fetch(src);
  const arrayBuffer = await response.arrayBuffer();
  const AudioCtx =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioCtx();
  try {
    const decoded = await audioContext.decodeAudioData(arrayBuffer);
    const data = decoded.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(data.length / buckets));
    const peaks: number[] = [];
    let max = 0;
    for (let i = 0; i < buckets; i += 1) {
      const start = i * blockSize;
      let sumSquares = 0;
      for (let j = 0; j < blockSize; j += 1) {
        const sample = data[start + j] ?? 0;
        sumSquares += sample * sample;
      }
      const rms = Math.sqrt(sumSquares / blockSize);
      peaks.push(rms);
      if (rms > max) max = rms;
    }
    return peaks.map((peak) => (max > 0 ? peak / max : 0));
  } finally {
    void audioContext.close();
  }
}

function AudioPreview({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);

  useEffect(() => {
    let active = true;
    extractWaveform(src, AUDIO_PICKER_CONFIG.waveformBars)
      .then((result) => {
        if (active) setPeaks(result);
      })
      .catch(() => {
        if (active) setPeaks([]);
      });
    return () => {
      active = false;
    };
  }, [src]);

  const togglePlay = (): void => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else void el.play();
  };

  const handleMetadata = (): void => {
    const value = audioRef.current?.duration ?? 0;
    setDuration(Number.isFinite(value) ? value : 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Number(e.target.value);
    setCurrent(Number(e.target.value));
  };

  const progressRatio = duration > 0 ? current / duration : 0;
  const placeholderBars = Array.from(
    { length: AUDIO_PICKER_CONFIG.waveformBars },
    (_, i) => AUDIO_PICKER_CONFIG.placeholderBar.base + AUDIO_PICKER_CONFIG.placeholderBar.amplitude * Math.abs(Math.sin(i)),
  );
  const bars = peaks.length ? peaks : placeholderBars;

  return (
    <div className="flex items-center gap-2.5">
      <audio
        ref={audioRef}
        src={src}
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={handleMetadata}
      />
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? 'Pausar' : 'Reproduzir'}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700"
      >
        {playing ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
      </button>
      <div className="relative flex-1">
        <div className="flex h-8 items-center justify-between gap-px" aria-hidden="true">
          {bars.map((peak, i) => {
            const filled = bars.length > 0 && i / bars.length <= progressRatio;
            return (
              <span
                key={i}
                style={{ height: `${Math.max(AUDIO_PICKER_CONFIG.minBarHeightPct, peak * 100)}%` }}
                className={`min-w-0 flex-1 rounded-full transition-colors ${
                  filled ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            );
          })}
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={handleSeek}
          aria-label="Posição do áudio"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      <span className="shrink-0 text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
        {formatTime(current)} / {formatTime(duration)}
      </span>
    </div>
  );
}

export default function AudioPicker({ value, onChange, maxBytes, accept, validateUpload, error }: AudioPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [internalError, setInternalError] = useState('');

  const maxLabel = `${Math.round(maxBytes / (1024 * 1024))}MB`;

  const stopStream = (): void => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInternalError('');
    const result = validateUpload(file);
    if (!result.ok) {
      setInternalError(result.message ?? 'Formato de áudio não suportado.');
      return;
    }
    if (file.size > maxBytes) {
      setInternalError(`O áudio deve ter no máximo ${maxLabel}.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1] ?? '';
      onChange({ base64, mimeType: result.mimeType ?? file.type, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async (): Promise<void> => {
    setInternalError('');
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setInternalError('Seu navegador não suporta gravação de áudio.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = pickRecorderMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stopStream();
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || AUDIO_PICKER_CONFIG.recorderFallbackType });
        if (blob.size === 0) {
          return;
        }
        setProcessing(true);
        try {
          const base64 = await blobToWavBase64(blob);
          const sizeBytes = Math.floor((base64.length * 3) / 4);
          if (sizeBytes > maxBytes) {
            setInternalError(`A gravação ficou acima de ${maxLabel}. Grave um áudio mais curto.`);
            return;
          }
          onChange({ base64, mimeType: AUDIO_PICKER_CONFIG.recordedMimeType, fileName: `gravacao-${Date.now()}.wav` });
        } catch {
          setInternalError('Não foi possível processar a gravação. Tente novamente.');
        } finally {
          setProcessing(false);
        }
      };
      recorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    } catch {
      setInternalError('Permissão de microfone negada ou indisponível.');
      stopStream();
    }
  };

  const stopRecording = (): void => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleRemove = (): void => {
    setInternalError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onChange(null);
  };

  const shownError = internalError || error;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Áudio</label>
      <input ref={fileInputRef} type="file" accept={accept} onChange={handleUpload} className="hidden" />

      {value ? (
        <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl">
          <Mic size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <AudioPreview src={`data:${value.mimeType};base64,${value.base64}`} />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-red-400 hover:text-red-600 transition-colors shrink-0"
            aria-label="Remover áudio"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : recording ? (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800 rounded-xl">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
          </span>
          <span className="text-sm font-medium text-rose-600 dark:text-rose-400 flex-1">
            Gravando… {formatTime(elapsed)}
          </span>
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-rose-700"
          >
            <Square size={14} /> Parar
          </button>
        </div>
      ) : processing ? (
        <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm font-medium">Processando áudio…</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
          >
            <Upload size={18} />
            <span className="text-sm font-medium">Enviar arquivo</span>
          </button>
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
          >
            <Mic size={18} />
            <span className="text-sm font-medium">Gravar áudio</span>
          </button>
        </div>
      )}

      {!value && !recording && !processing && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Máx. {maxLabel}</p>
      )}
      {shownError && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} /> {shownError}
        </p>
      )}
    </div>
  );
}
