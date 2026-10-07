export type AutomationResultKind = 'DM' | 'COMMENT' | 'LIVE' | 'FLOW';

export interface AutomationResult {
  automationId: string;
  kind: AutomationResultKind;
  triggers: number;
  lastTriggeredAt: string | null;
  linksSent: number;
  clicks: number;
  uniqueClickers: number;
}

export type AutomationDraftKind = 'DM' | 'COMMENT' | 'LIVE';

export interface AutomationDraftSuggestion {
  kind: AutomationDraftKind;
  keywords: string[];
  triggerOnAnyComment: boolean;
  commentReplyMessages: string[];
  message: string;
  linkUrl: string;
  linkLabel: string;
}
