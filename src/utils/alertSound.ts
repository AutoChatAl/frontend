import type { AlertTone } from '@/types/AlertPreferences';

/**
 * Toques de alerta sintetizados com Web Audio.
 *
 * Gerar o som em vez de servir um arquivo tira uma requisição do caminho crítico
 * (o toque precisa sair no instante do evento, não depois de um download) e
 * dispensa licenciar áudio. Cada toque é uma sequência curta de notas com
 * envelope de decaimento — nada passa de meio segundo.
 */

interface Note {
  /** Hz. */
  frequency: number;
  /** Quando começa, em segundos a partir do início do toque. */
  at: number;
  /** Duração até o silêncio, em segundos. */
  duration: number;
  type: OscillatorType;
  /** Volume de pico (0–1). Ondas quadradas soam mais altas; compensa-se aqui. */
  peak: number;
}

const TONES: Record<AlertTone, Note[]> = {
  // Duas notas ascendentes em seno — chama atenção sem assustar.
  soft: [
    { frequency: 659.25, at: 0, duration: 0.22, type: 'sine', peak: 0.22 },
    { frequency: 880, at: 0.14, duration: 0.32, type: 'sine', peak: 0.2 },
  ],
  // "Ding-dong" em triângulo, o toque de campainha clássico.
  classic: [
    { frequency: 987.77, at: 0, duration: 0.24, type: 'triangle', peak: 0.26 },
    { frequency: 783.99, at: 0.2, duration: 0.36, type: 'triangle', peak: 0.24 },
  ],
  // Três bipes curtos e agudos — para ambiente barulhento.
  alert: [
    { frequency: 1046.5, at: 0, duration: 0.1, type: 'square', peak: 0.08 },
    { frequency: 1046.5, at: 0.16, duration: 0.1, type: 'square', peak: 0.08 },
    { frequency: 1318.5, at: 0.32, duration: 0.16, type: 'square', peak: 0.08 },
  ],
};

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (context) return context;
  const Ctor = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

/**
 * O navegador só deixa tocar som depois de um gesto do usuário na página. Chamado
 * no primeiro clique ou tecla, cria o contexto e o tira do estado suspenso, para o
 * toque do primeiro evento não sair mudo.
 */
export function primeAlertAudio(): void {
  const ctx = getContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * Toca o toque escolhido. Devolve false quando o navegador ainda não liberou o
 * áudio (nenhum gesto na página desde o carregamento) ou não suporta Web Audio.
 */
export async function playAlertTone(tone: AlertTone): Promise<boolean> {
  const ctx = getContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') {
    await ctx.resume().catch(() => {});
    // O TypeScript estreita `state` para 'suspended' e não enxerga que `resume` muda
    // o valor — daí a releitura pelo objeto, e não pela variável já estreitada.
    if ((ctx as BaseAudioContext).state !== 'running') return false;
  }

  const start = ctx.currentTime + 0.02;
  for (const note of TONES[tone]) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = note.type;
    oscillator.frequency.setValueAtTime(note.frequency, start + note.at);
    // Ataque curtíssimo e decaimento exponencial: sem o ataque estala, sem o
    // decaimento soa como buzina.
    gain.gain.setValueAtTime(0.0001, start + note.at);
    gain.gain.exponentialRampToValueAtTime(note.peak, start + note.at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.at + note.duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start + note.at);
    oscillator.stop(start + note.at + note.duration + 0.03);
  }
  return true;
}
