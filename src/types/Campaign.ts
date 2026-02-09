export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  message: string;
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
  id: string;
  campaignId: string;
  channelId: string;
  messageOverride?: string | null;
  pacingJson?: Record<string, unknown>;
  payloadJson?: Record<string, unknown>;
  createdAt: string;
  channel?: {
    id: string;
    name: string;
    type: 'WHATSAPP' | 'INSTAGRAM';
  };
}

export interface CampaignGroup {
  id: string;
  campaignId: string;
  groupId: string;
  createdAt: string;
  group?: {
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
  message: string;
  channelIds: string[];
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
}

export type UpdateCampaignInput = CreateCampaignInput;

export enum CampaignStatus {
  SUCCESS = 'success',
  PROCESSING = 'processing',
  WARNING = 'warning',
}
