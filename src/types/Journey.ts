export type ClickDevice = 'MOBILE' | 'TABLET' | 'DESKTOP' | 'UNKNOWN';
export type ClickOs = 'IOS' | 'ANDROID' | 'WINDOWS' | 'MACOS' | 'LINUX' | 'OTHER';
export type ClickBrowser = 'CHROME' | 'SAFARI' | 'FIREFOX' | 'EDGE' | 'SAMSUNG' | 'OPERA' | 'OTHER';
export type ClickInApp = 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'LINKEDIN';
export type SiteEventType = 'PAGE_VIEW' | 'CLICK' | 'CUSTOM';
export type JourneyOrderEvent =
  | 'CART_ABANDONED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_DELAYED'
  | 'APPROVED'
  | 'COMPLETED'
  | 'CANCELED'
  | 'EXPIRED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED'
  | 'CHARGEBACK';

export interface ClickBreakdownItem {
  key: string;
  count: number;
}

export interface DailyClicks {
  date: string;
  clicks: number;
}

export interface ClickSummary {
  days: number;
  linksSent: number;
  humanClicks: number;
  botClicks: number;
  uniqueContacts: number;
  daily: DailyClicks[];
  sources: ClickBreakdownItem[];
  targets: ClickBreakdownItem[];
}

export interface RecentClick {
  id: string;
  at: string;
  contactId: string | null;
  contactName: string | null;
  source: string;
  campaign: string | null;
  target: string | null;
}

export interface JourneyContact {
  id: string;
  displayName: string | null;
  identifier: string | null;
  lastActivityAt: string | null;
  linkClicks: number;
  siteEvents: number;
}

interface JourneyEventBase {
  id: string;
  at: string;
}

export interface LinkSentEvent extends JourneyEventBase {
  type: 'LINK_SENT';
  source: string;
  campaign: string | null;
  target: string | null;
}

export interface LinkClickedEvent extends JourneyEventBase {
  type: 'LINK_CLICKED';
  source: string;
  campaign: string | null;
  target: string | null;
  device: ClickDevice;
  os: ClickOs;
  browser: ClickBrowser;
  inApp: ClickInApp | null;
  city: string | null;
  region: string | null;
  country: string | null;
}

export interface SiteJourneyEvent extends JourneyEventBase {
  type: 'SITE_EVENT';
  siteEvent: SiteEventType;
  sessionId: string;
  host: string;
  path: string;
  title: string | null;
  name: string | null;
  referrerHost: string | null;
  device: ClickDevice;
}

export interface OrderJourneyEvent extends JourneyEventBase {
  type: 'ORDER';
  orderEvent: JourneyOrderEvent;
  platform: string;
  productName: string | null;
  valueCents: number | null;
  currency: string | null;
}

export type JourneyEvent = LinkSentEvent | LinkClickedEvent | SiteJourneyEvent | OrderJourneyEvent;

export interface JourneyTimeline {
  contact: JourneyContact;
  events: JourneyEvent[];
}

export interface TrackingSite {
  publicKey: string;
  allowedDomains: string[];
  lastEventAt: string | null;
  eventsLastWeek: number;
}
