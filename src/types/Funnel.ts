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
  lastInteractionAt: string | null;
  awaitingHuman: boolean;
  awaitingHumanSince: string | null;
  createdAt: string | null;
  boardOrder: number;
  score: number;
  temperature: LeadTemperature;
  conversionProbability: number;
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
  total: number;
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
}
