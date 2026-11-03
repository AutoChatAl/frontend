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
  | 'TELEGRAM'
  | 'IMPORT';
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
  /** Pode vir `null`: no contato o default do campo é nulo. */
  origin: LeadOrigin | null;
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

/**
 * Por que o contato não aparece em coluna nenhuma do quadro.
 * `REMOVED` — tirado do funil à mão; volta na próxima interação.
 * `AWAITING_REPLY` — importado e ainda sem resposta; entra quando responder.
 */
export type FunnelOffBoardReason = 'REMOVED' | 'AWAITING_REPLY';

/** Em que coluna do quadro o contato está agora — é o que a conversa mostra. */
export interface FunnelLeadPlacement {
  /** Funil do contato: as colunas que a conversa oferece saem dele. */
  funnelId: string;
  /** Nulo quando o quadro não mostra o contato em coluna nenhuma. */
  stageId: string | null;
  /** Nulo também quando a etapa gravada deixou de existir. */
  offBoardReason: FunnelOffBoardReason | null;
  stageEnteredAt: string | null;
  stageMovedBy: StageMovedBy | null;
  stageMoveReason: string | null;
}

/**
 * Evento do stream do workspace: um lead mudou de coluna ou saiu do quadro (pela
 * tela, pela IA ou por um fluxo). Traz só `{ contactId }` — a etapa vem da API.
 */
export const FUNNEL_LEAD_MOVED_EVENT = 'funnel.lead_moved';

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
  funnelId: string;
  stages: FunnelStage[];
  columns: Record<string, FunnelColumn>;
}

export interface BoardFilters {
  /** Sem id, o funil principal. */
  funnelId?: string;
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
  funnelId: string;
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

/** Colunas com que um funil novo nasce. `COPY` repete as de outro funil. */
export type FunnelStartingStages = 'POST_SALES' | 'SALES' | 'BLANK' | 'COPY';

/**
 * Um quadro do funil. O principal sempre existe, não guarda canais — recebe todos os
 * que não estão em outro funil — e não pode ser excluído.
 */
export interface Funnel {
  id: string;
  name: string;
  isMain: boolean;
  /** Canais que alimentam o funil. Vazio no principal. */
  channelIds: string[];
  /** A IA pode mover os cards entre as colunas deste funil. */
  aiAutoMove: boolean;
  order: number;
  stages: FunnelStageDefinition[];
}

export interface FunnelList {
  funnels: Funnel[];
  /** Canais do workspace, para vincular a um funil. */
  channels: LeadSourceChannel[];
  /** Quantos funis além do principal a conta pode ter. */
  maxExtraFunnels: number;
}

export interface CreateFunnelPayload {
  name: string;
  channelIds: string[];
  aiAutoMove: boolean;
  template: FunnelStartingStages;
  copyFromFunnelId?: string;
  /** Traz também quem já conversou pelos canais escolhidos. */
  moveExistingContacts: boolean;
}

export interface UpdateFunnelPayload {
  name?: string;
  channelIds?: string[];
  aiAutoMove?: boolean;
  /** Vale só para os canais que entram agora no funil. */
  moveExistingContacts?: boolean;
}
