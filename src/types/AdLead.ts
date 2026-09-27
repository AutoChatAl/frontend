/** Perfis que o diagnóstico da página de anúncio pode apontar. */
export type AdLeadProfile = 'desorganizado' | 'instagram' | 'ferramenta' | 'manual' | 'engajamento';

/** Tipo de negócio de quem respondeu — separa infoprodutor de empresa na hora de atender. */
export type AdLeadSegment = 'infoprodutor' | 'ambos' | 'loja' | 'servico' | 'outro';

export interface AdLeadAnswer {
  key: string;
  question: string;
  answer: string[];
}

export interface AdLeadDiagnosis {
  primary: AdLeadProfile;
  secondary: AdLeadProfile | null;
  healthScore: number;
  scores: Record<AdLeadProfile, number>;
}

export interface AdLeadTracking {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  referrer?: string;
  landingUrl?: string;
}

export interface CreateAdLeadPayload {
  sessionId: string;
  source: string;
  name: string;
  /** Só dígitos, com DDI (55 + DDD + número). */
  whatsapp: string;
  segment: AdLeadSegment;
  consent: true;
  answers: AdLeadAnswer[];
  diagnosis: AdLeadDiagnosis;
  tracking?: AdLeadTracking;
}
