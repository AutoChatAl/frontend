export interface Campaign {
  id: number;
  name: string;
  channel: 'whatsapp' | 'instagram';
  sent: number;
  opened: string;
  status: CampaignStatus;
  date: string;
}

export enum CampaignStatus {
  SUCCESS = 'success',
  PROCESSING = 'processing',
  WARNING = 'warning',
}
