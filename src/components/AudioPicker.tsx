'use client';

import { AlertCircle, Loader2, Mic, Square, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import AudioPlayer, { formatAudioTime } from '@/components/AudioPlayer';
import {
  AUDIO_RECORDER_FALLBACK_MIME,
  AUDIO_WAV_MIME,
  blobToWavBase64,
  pickAudioRecorderMimeType,
} from '@/utils/AudioWav';

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
      const mimeType = pickAudioRecorderMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stopStream();
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || AUDIO_RECORDER_FALLBACK_MIME });
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
          onChange({ base64, mimeType: AUDIO_WAV_MIME, fileName: `gravacao-${Date.now()}.wav` });
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
            <AudioPlayer src={`data:${value.mimeType};base64,${value.base64}`} />
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
            Gravando… {formatAudioTime(elapsed)}
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
