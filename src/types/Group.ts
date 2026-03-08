import type { Contact } from './Contact';

export interface DynamicRule {
  channelIds?: string[];
  tagNames?: string[];
  lastInteractionWithinDays?: number;
}

export interface Group {
  id: string;
  workspaceId: string;
  name: string;
  type: 'MANUAL' | 'DYNAMIC';
  ruleJson?: DynamicRule;
  memberContactIds: string[];
  memberCount: number;
  channelTypes?: string[];
  createdAt: string;
}

export interface GroupWithContacts extends Group {
  contacts: Contact[];
}

export interface CreateGroupInput {
  name: string;
  type: 'MANUAL' | 'DYNAMIC';
  rule?: DynamicRule;
}

export interface UpdateGroupInput {
  name?: string;
  rule?: DynamicRule;
}
