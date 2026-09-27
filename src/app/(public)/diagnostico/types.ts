import type { AdLeadProfile, AdLeadSegment } from '@/types/AdLead';

export type ProfileScores = Record<AdLeadProfile, number>;

export interface ChoiceOption {
  label: string;
  points?: Partial<ProfileScores>;
  /** Resposta do Synq logo depois da escolha: liga o problema ao que o produto resolve. */
  reaction?: string;
  /** Tipo de negócio — decide se o quiz segue pelo caminho do infoprodutor ou da empresa. */
  segment?: AdLeadSegment;
  /** Vende pelo Instagram — libera as opções do canal. */
  instagram?: boolean;
  /** Só aparece para quem vende pelo Instagram. */
  instagramOnly?: boolean;
}

export interface ChoiceStep {
  kind: 'choice';
  key: string;
  label: string;
  question: string;
  options: ChoiceOption[];
}

export type ContactField = 'name' | 'whatsapp';

export interface InputStep {
  kind: 'input';
  key: ContactField;
  label: string;
  question: string;
  placeholder: string;
  inputType: 'text' | 'tel';
  autoComplete: string;
  maxLength: number;
  validate: (value: string) => boolean;
  error: string;
  /** Pede a autorização da LGPD junto do campo — vai no último, antes de enviar. */
  requiresConsent?: boolean;
}

export type Step = ChoiceStep | InputStep;

export type ChatMessage =
  | { id: number; from: 'bot'; text: string; time: string }
  | { id: number; from: 'me'; text: string; time: string }
  | { id: number; from: 'analyzing'; items: string[] };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type NewChatMessage = DistributiveOmit<ChatMessage, 'id'>;

export interface DiagnosisOutcome {
  primary: AdLeadProfile;
  secondary: AdLeadProfile | null;
  healthScore: number;
  name: string;
  segment: AdLeadSegment;
}
