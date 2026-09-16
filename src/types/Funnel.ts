export type LeadTemperature = 'COLD' | 'WARM' | 'HOT' | 'ON_FIRE';
export type AttendanceStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED';
export type LeadOrigin =
  | 'WHATSAPP'
  | 'INSTAGRAM'
  | 'CART_RECOVERY'
  | 'COMMENT'
  | 'CAMPAIGN'
  | 'MANUAL'
  | 'TIKTOK'
  | 'TELEGRAM';
export type ChannelType = 'WHATSAPP' | 'INSTAGRAM';
export type StageColor = 'indigo' | 'violet' | 'blue' | 'emerald' | 'amber' | 'rose' | 'fuchsia' | 'slate';

export interface FunnelLeadTag {
  id: string;
  name: string;
}

export type StageMovedBy = 'AI' | 'USER';

/**
 * `outcome` — medida em leads que realmente chegaram ao fim do funil.
 * `shape` — ninguém chegou ainda; a base veio do ritmo de avanço entre etapas.
 */
export type ConversionBasis = 'outcome' | 'shape';

export type ConversionConfidence = 'high' | 'medium' | 'low';

/** Um sinal que empurrou a probabilidade para cima ou para baixo. */
export interface ConversionDriver {
  label: string;
  impact: 'up' | 'down';
}

export type SourceChannelType = 'WHATSAPP' | 'INSTAGRAM' | 'WHATSAPP_OFFICIAL';

/** O canal do negócio por onde o lead entrou. */
export interface LeadSourceChannel {
  id: string;
  type: SourceChannelType;
  /** `@conta` no Instagram, número no WhatsApp. */
  identifier: string | null;
  name: string | null;
}

export interface FunnelLead {
  id: string;
  displayName: string | null;
  funnelStageId: string | null;
  attendanceStatus: AttendanceStatus;
  origin: LeadOrigin;
  notes: string;
  tags: FunnelLeadTag[];
  channels: ChannelType[];
  identifier: string | null;
  sourceChannel: LeadSourceChannel | null;
  lastInteractionAt: string | null;
  awaitingHuman: boolean;
  awaitingHumanSince: string | null;
  createdAt: string | null;
  stageEnteredAt: string | null;
  stageMovedBy: StageMovedBy | null;
  stageMoveReason: string | null;
  boardOrder: number;
  score: number;
  temperature: LeadTemperature;
  conversionProbability: number;
  conversionBasis: ConversionBasis;
  conversionConfidence: ConversionConfidence;
  conversionDrivers: ConversionDriver[];
  salesCount: number;
  salesValueCents: number;
  abandonedCount: number;
  abandonedValueCents: number;
}

export interface FunnelStage {
  id: string;
  name: string;
  color: StageColor;
  order: number;
  isWon: boolean;
  isLost: boolean;
  /** Destino do funil: `isWon` quando existe, senão a última etapa não-perdida. */
  isGoal: boolean;
  /** Onde lead novo entra. Sempre existe uma — apagar colunas nunca deixa o funil sem. */
  isEntry: boolean;
  aiCriteria: string;
  total: number;
  /** % dos leads que chegaram nesta etapa e terminaram em uma etapa de ganho. */
  conversionRate: number;
  /** Extremos do intervalo de credibilidade de 95%, em %. */
  conversionLow: number;
  conversionHigh: number;
  /** Quantos leads sustentam a taxa. */
  conversionSample: number;
  conversionBasis: ConversionBasis;
  conversionConfidence: ConversionConfidence;
}

export interface FunnelColumn {
  leads: FunnelLead[];
  total: number;
  hasMore: boolean;
}

export interface FunnelBoard {
  stages: FunnelStage[];
  columns: Record<string, FunnelColumn>;
}

export interface BoardFilters {
  search?: string;
  channelType?: ChannelType;
  origin?: LeadOrigin;
}

export interface UpdateLeadPayload {
  attendanceStatus?: AttendanceStatus;
  origin?: LeadOrigin;
  notes?: string;
  tagIds?: string[];
  scoreOverride?: number | null;
}

export interface FunnelStageDefinition {
  id: string;
  name: string;
  color: StageColor;
  order: number;
  isWon: boolean;
  isLost: boolean;
  aiCriteria: string;
}

export interface StagePayload {
  name?: string;
  color?: StageColor;
  aiCriteria?: string;
}
