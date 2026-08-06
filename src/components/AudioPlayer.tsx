'use client';
import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const AUDIO_PLAYER_CONFIG = {
  waveformBars: 44,
  minBarHeightPct: 12,
  placeholderBar: { base: 0.35, amplitude: 0.3 },
};

/** `accent` é para fundos sólidos escuros (balão enviado do chat), onde o indigo não contrasta. */
export type AudioPlayerVariant = 'default' | 'accent';

interface AudioPlayerProps {
  src: string;
  variant?: AudioPlayerVariant;
  /**
   * Barras da onda. Em espaços estreitos use menos: com muitas barras elas afinam
   * até o limite do gap e a onda vira um bloco sólido.
   */
  bars?: number;
  className?: string;
}

const VARIANT_STYLES: Record<AudioPlayerVariant, {
  button: string;
  barFilled: string;
  barEmpty: string;
  time: string;
}> = {
  default: {
    button: 'bg-indigo-600 text-white hover:bg-indigo-700',
    barFilled: 'bg-indigo-500 dark:bg-indigo-400',
    barEmpty: 'bg-slate-300 dark:bg-slate-600',
    time: 'text-slate-500 dark:text-slate-400',
  },
  accent: {
    button: 'bg-white/20 text-white hover:bg-white/30',
    barFilled: 'bg-white',
    barEmpty: 'bg-indigo-300/50',
    time: 'text-indigo-200',
  },
};

export function formatAudioTime(totalSeconds: number): string {
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

export default function AudioPlayer({
  src,
  variant = 'default',
  bars: barCount = AUDIO_PLAYER_CONFIG.waveformBars,
  className = '',
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);

  const styles = VARIANT_STYLES[variant];

  useEffect(() => {
    let active = true;
    // Mídia de CDN externo costuma barrar o fetch por CORS — sem picos, cai na onda genérica.
    extractWaveform(src, barCount)
      .then((result) => {
        if (active) setPeaks(result);
      })
      .catch(() => {
        if (active) setPeaks([]);
      });
    return () => {
      active = false;
    };
  }, [src, barCount]);

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
    { length: barCount },
    (_, i) => AUDIO_PLAYER_CONFIG.placeholderBar.base + AUDIO_PLAYER_CONFIG.placeholderBar.amplitude * Math.abs(Math.sin(i)),
  );
  const bars = peaks.length ? peaks : placeholderBars;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
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
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${styles.button}`}
      >
        {playing ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
      </button>
      <div className="relative flex-1">
        <div className="flex h-8 items-center justify-between gap-0.5" aria-hidden="true">
          {bars.map((peak, i) => {
            const filled = bars.length > 0 && i / bars.length <= progressRatio;
            return (
              <span
                key={i}
                style={{ height: `${Math.max(AUDIO_PLAYER_CONFIG.minBarHeightPct, peak * 100)}%` }}
                className={`min-w-0.5 flex-1 rounded-full transition-colors ${filled ? styles.barFilled : styles.barEmpty}`}
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
      <span className={`shrink-0 text-xs font-medium tabular-nums ${styles.time}`}>
        {formatAudioTime(current)} / {formatAudioTime(duration)}
      </span>
    </div>
  );
}
