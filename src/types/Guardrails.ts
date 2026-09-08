/** O que fazer quando a resposta que a IA escreveu viola uma regra. */
export type GuardrailViolationAction = 'HANDOFF' | 'FALLBACK';

export interface AiGuardrails {
  id: string;
  enabled: boolean;
  /** Termos na mensagem do cliente que passam a conversa direto para uma pessoa. */
  handoffKeywords: string[];
  /** Termos que não podem sair na resposta da IA. */
  forbiddenPhrases: string[];
  /** Assuntos que a IA deve evitar, injetados no prompt como regra. */
  blockedTopics: string[];
  blockSensitiveData: boolean;
  onViolation: GuardrailViolationAction;
  fallbackMessage: string;
}

export interface UpdateGuardrailsPayload {
  enabled?: boolean;
  handoffKeywords?: string[];
  forbiddenPhrases?: string[];
  blockedTopics?: string[];
  blockSensitiveData?: boolean;
  onViolation?: GuardrailViolationAction;
  fallbackMessage?: string;
}

export interface GuardrailSuggestions {
  handoffKeywords: string[];
  forbiddenPhrases: string[];
}

export interface GuardrailsResponse {
  guardrails: AiGuardrails;
  suggestions: GuardrailSuggestions;
}

/** Resultado de testar um texto contra as regras, sem envolver a IA. */
export interface GuardrailPreview {
  enabled: boolean;
  inbound: { reason: string; matched: string } | null;
  outbound: { reason: string; matched: string } | null;
  onViolation?: GuardrailViolationAction;
}
