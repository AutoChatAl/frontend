export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  message: string;
  linkUrl?: string;
  linkLabel?: string;
  messageType: 'TEXT' | 'GENERIC_TEMPLATE';
  messageMeta?: Record<string, unknown>;
  messageTag?: 'HUMAN_AGENT' | null;
  createdAt: string;
  updatedAt: string;
  channels?: CampaignChannel[];
  groups?: CampaignGroup[];
  schedule?: CampaignSchedule | null;
  runs?: CampaignRun[];
}

export interface CampaignChannel {
  campaignId: string;
  channelId: string;
  messageOverride?: string | null;
  pacingJson?: Record<string, unknown> | null;
  payloadJson?: Record<string, unknown> | null;
  channel: {
    id: string;
    name: string;
    type: 'WHATSAPP' | 'INSTAGRAM';
    status: string;
  };
}

export interface CampaignGroup {
  campaignId: string;
  groupId: string;
  group: {
    id: string;
    name: string;
    type: string;
  };
}

export interface CampaignSchedule {
  id: string;
  campaignId: string;
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  startAt: string;
  endAt?: string | null;
  cron?: string | null;
  createdAt: string;
}

export interface CampaignRun {
  id: string;
  campaignId: string;
  scheduledFor: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  sourceType: 'CHANNEL' | 'GROUP';
  message: string;
  linkUrl?: string;
  linkLabel?: string;
  channelIds: string[];
  groupId?: string;
  contactIds: string[];
  messageType?: 'TEXT' | 'GENERIC_TEMPLATE';
  messageMeta?: {
    buttons?: Array<{
      title: string;
      url: string;
    }>;
    ctaTitle?: string;
    ctaSubtitle?: string;
    ctaImageUrl?: string;
    ctaDefaultActionUrl?: string;
  };
  messageTag?: 'HUMAN_AGENT';
  frequency?: 'DAILY' | 'ONCE';
  scheduledDate?: string | undefined;
  executionHour?: number;
}

export type UpdateCampaignInput = CreateCampaignInput;

export enum CampaignStatus {
  SUCCESS = 'success',
  PROCESSING = 'processing',
  WARNING = 'warning',
}
