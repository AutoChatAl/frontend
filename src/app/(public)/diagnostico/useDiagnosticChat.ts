'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

import { adLeadService } from '@/services/ad-lead.service';
import type { AdLeadAnswer, AdLeadSegment, AdLeadTracking, CreateAdLeadPayload } from '@/types/AdLead';

import { healthScore, PROFILES, rankProfiles } from './diagnosis';
import { ANALYZING_ITEMS, buildSequence, CLOSING_MESSAGE, INTRO_MESSAGE } from './questions';
import type {
  ChatMessage,
  ChoiceOption,
  ChoiceStep,
  ContactField,
  DiagnosisOutcome,
  InputStep,
  NewChatMessage,
  ProfileScores,
  Step,
} from './types';

const LEAD_SOURCE = 'diagnostico';

// Ritmo da conversa: rápido o bastante para o resultado chegar logo, com uma variação
// pequena no "digitando…" para não parecer robótico.
const TYPING_MS = 450;
const TYPING_JITTER_MS = 300;
const ANALYZING_MS = 1300;
const SAVE_RETRY_MS = 1500;

/**
 * Cada execução do roteiro carrega o seu token. Ao desmontar (ou no remonte do
 * StrictMode) o token morre, e toda espera pendente para de falar no chat.
 */
interface RunToken {
  alive: boolean;
}

interface EngineState {
  sessionId: string;
  cursor: number;
  segment?: AdLeadSegment;
  instagram: boolean;
  scores: ProfileScores;
  /** Perguntas que somaram pontos — a de tipo de negócio só escolhe o caminho. */
  scoredQuestions: number;
  answers: AdLeadAnswer[];
  contact: Partial<Record<ContactField, string>>;
  analyzed: boolean;
}

const wait = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

const clock = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const plainText = (text: string) => text.replace(/\*\*/g, '');

const firstName = (name?: string) => (name ?? '').trim().split(/\s+/)[0] ?? '';

// `randomUUID` só existe em contexto seguro; testando pelo IP da rede no celular (http) ele não está lá.
function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

function createEngine(): EngineState {
  return {
    sessionId: createSessionId(),
    cursor: 0,
    instagram: false,
    scores: { desorganizado: 0, instagram: 0, ferramenta: 0, manual: 0, engajamento: 0 },
    scoredQuestions: 0,
    answers: [],
    contact: {},
    analyzed: false,
  };
}

const TRACKING_PARAMS: [keyof AdLeadTracking, string, number][] = [
  ['utmSource', 'utm_source', 200],
  ['utmMedium', 'utm_medium', 200],
  ['utmCampaign', 'utm_campaign', 200],
  ['utmContent', 'utm_content', 200],
  ['utmTerm', 'utm_term', 200],
  ['fbclid', 'fbclid', 500],
];

/** De qual anúncio a pessoa veio — é o que diz qual campanha trouxe o lead. */
function readTracking(): AdLeadTracking {
  const params = new URLSearchParams(window.location.search);
  const tracking: AdLeadTracking = { landingUrl: window.location.href.slice(0, 1000) };
  for (const [field, param, max] of TRACKING_PARAMS) {
    const value = params.get(param);
    if (value) tracking[field] = value.slice(0, max);
  }
  if (document.referrer) tracking.referrer = document.referrer.slice(0, 1000);
  return tracking;
}

/**
 * Grava o lead sem travar a tela: o resultado aparece de qualquer jeito. Se a
 * rede falhar, tenta mais uma vez — o `sessionId` garante que não duplica.
 */
async function saveLead(state: EngineState, outcome: DiagnosisOutcome): Promise<void> {
  const { name, whatsapp } = state.contact;
  if (!name || !whatsapp) return;
  const payload: CreateAdLeadPayload = {
    sessionId: state.sessionId,
    source: LEAD_SOURCE,
    name,
    whatsapp: `55${whatsapp}`,
    segment: outcome.segment,
    consent: true,
    answers: state.answers,
    diagnosis: {
      primary: outcome.primary,
      secondary: outcome.secondary,
      healthScore: outcome.healthScore,
      scores: state.scores,
    },
    tracking: readTracking(),
  };
  try {
    await adLeadService.create(payload);
  } catch {
    await wait(SAVE_RETRY_MS);
    await adLeadService.create(payload).catch(() => undefined);
  }
}

interface UseDiagnosticChatReturn {
  messages: ChatMessage[];
  typing: boolean;
  /** Pergunta esperando resposta; `null` enquanto o Synq está falando. */
  step: Step | null;
  progress: number;
  outcome: DiagnosisOutcome | null;
  answerChoice: (step: ChoiceStep, option: ChoiceOption) => void;
  answerInput: (step: InputStep, value: string) => void;
}

export function useDiagnosticChat(): UseDiagnosticChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState<Step | null>(null);
  const [answered, setAnswered] = useState(0);
  const [total, setTotal] = useState(() => buildSequence({ instagram: false }).length);
  const [outcome, setOutcome] = useState<DiagnosisOutcome | null>(null);

  const engineRef = useRef<EngineState | null>(null);
  const tokenRef = useRef<RunToken>({ alive: false });
  const messageIdRef = useRef(0);

  const engine = useCallback((): EngineState => {
    if (!engineRef.current) engineRef.current = createEngine();
    return engineRef.current;
  }, []);

  const fill = useCallback((text: string) => {
    // O asterisco sai para o nome digitado não abrir um negrito no meio do balão.
    const name = firstName(engine().contact.name).replace(/\*/g, '');
    return text.replace(/\{primeiro\}/g, name);
  }, [engine]);

  const pushMessage = useCallback((message: NewChatMessage) => {
    messageIdRef.current += 1;
    const id = messageIdRef.current;
    setMessages((prev) => [...prev, { ...message, id }]);
  }, []);

  const say = useCallback(async (token: RunToken, text: string): Promise<boolean> => {
    setTyping(true);
    await wait(TYPING_MS + Math.random() * TYPING_JITTER_MS);
    if (!token.alive) return false;
    setTyping(false);
    pushMessage({ from: 'bot', text: fill(text), time: clock() });
    return true;
  }, [fill, pushMessage]);

  const finish = useCallback(async (token: RunToken) => {
    const state = engine();
    const result: DiagnosisOutcome = {
      ...rankProfiles(state.scores, state.instagram),
      healthScore: healthScore(state.scores, state.scoredQuestions),
      name: state.contact.name ?? '',
      segment: state.segment ?? 'outro',
    };
    void saveLead(state, result);
    window.dataLayer?.push({
      event: 'diagnostico_concluido',
      diagnostico_perfil: result.primary,
      diagnostico_saude: result.healthScore,
    });
    await wait(300);
    if (!token.alive || !(await say(token, CLOSING_MESSAGE))) return;
    await wait(500);
    if (!token.alive) return;
    setOutcome(result);
  }, [engine, say]);

  const askNext = useCallback(async (token: RunToken) => {
    const state = engine();
    const sequence = buildSequence(state);
    setTotal(sequence.length);
    const next = sequence[state.cursor];
    if (!next) {
      await finish(token);
      return;
    }
    // Antes de pedir o contato, o "analisando" dá a sensação de que o diagnóstico está sendo montado.
    if (next.kind === 'input' && !state.analyzed) {
      state.analyzed = true;
      pushMessage({ from: 'analyzing', items: ANALYZING_ITEMS });
      await wait(ANALYZING_MS);
      if (!token.alive) return;
    }
    if (!(await say(token, next.question))) return;
    await wait(200);
    if (!token.alive) return;
    setStep(next);
  }, [engine, finish, pushMessage, say]);

  const answerChoice = useCallback((current: ChoiceStep, option: ChoiceOption) => {
    const token = tokenRef.current;
    const state = engine();
    setStep(null);
    pushMessage({ from: 'me', text: option.label, time: clock() });
    state.answers.push({ key: current.key, question: plainText(fill(current.question)), answer: [option.label] });
    for (const profile of PROFILES) state.scores[profile] += option.points?.[profile] ?? 0;
    if (option.points) state.scoredQuestions += 1;
    if (option.segment) state.segment = option.segment;
    if (option.instagram !== undefined) state.instagram = option.instagram;
    state.cursor += 1;
    setAnswered((count) => count + 1);
    const { reaction } = option;
    void (async () => {
      await wait(reaction ? 250 : 350);
      if (!token.alive) return;
      // A reação liga a resposta ao que o Synq resolve antes de seguir para a próxima pergunta.
      if (reaction && !(await say(token, reaction))) return;
      if (token.alive) await askNext(token);
    })();
  }, [askNext, engine, fill, pushMessage, say]);

  const answerInput = useCallback((current: InputStep, value: string) => {
    const token = tokenRef.current;
    const state = engine();
    setStep(null);
    pushMessage({ from: 'me', text: value, time: clock() });
    state.contact[current.key] = current.inputType === 'tel' ? value.replace(/\D/g, '') : value;
    state.cursor += 1;
    setAnswered((count) => count + 1);
    void (async () => {
      await wait(300);
      if (token.alive) await askNext(token);
    })();
  }, [askNext, engine, pushMessage]);

  useEffect(() => {
    const token: RunToken = { alive: true };
    tokenRef.current = token;
    void (async () => {
      await wait(400);
      if (!token.alive || !(await say(token, INTRO_MESSAGE))) return;
      if (token.alive) await askNext(token);
    })();
    return () => {
      token.alive = false;
    };
  }, [askNext, say]);

  return {
    messages,
    typing,
    step,
    progress: Math.min(100, Math.round((answered / total) * 100)),
    outcome,
    answerChoice,
    answerInput,
  };
}
