/** Espelha `Referral.status` do backend (docs/PROGRAMA_INDICACAO.md). */
export type ReferralStatus = 'registered' | 'in_grace' | 'qualified' | 'on_hold' | 'disqualified' | 'revoked';
export type ReferralRewardStatus = 'pending' | 'available' | 'consumed' | 'on_hold' | 'canceled';
export type RefereeDiscountStatus = 'available' | 'reserved' | 'used' | 'forfeited';
export type ReferralAttachSource = 'checkout' | 'settings';

/** Página pública do convite (`/r/:code`) e validação no cadastro. */
export interface ReferralCodeInfo {
  code: string;
  referrerFirstName: string | null;
  refereePercent: number;
}

export interface ReferralRules {
  refereePercent: number;
  referrerPercentOfMonthly: number;
  maxTotalDiscountPercent: number;
  graceDays: number;
}

export interface ReferralCredits {
  /** Saldo em basis points sobre uma mensalidade (1000 = 10%). */
  availableBp: number;
  availablePercentOfMonthly: number;
  availableCentsEstimate: number | null;
  inGraceCount: number;
  nextReleaseAt: string | null;
}

export interface ReferralNextInvoice {
  appliesTo: 'renewal' | 'first_invoice';
  date: string | null;
  baseCents: number;
  estimatedCents: number;
  leftoverBp: number;
}

export interface ReferralListItem {
  id: string;
  /** Nome mascarado ("Ana S."). */
  name: string;
  status: ReferralStatus;
  createdAt: string;
  firstPaidAt: string | null;
  graceEndsAt: string | null;
  qualifiedAt: string | null;
  rewardStatus: ReferralRewardStatus;
  rewardRemainingBp: number;
}

export interface ReferralStats {
  registered: number;
  inGrace: number;
  qualified: number;
  disqualified: number;
  onHold: number;
}

export interface ReferredBy {
  referrerFirstName: string | null;
  code: string;
  status: ReferralStatus;
  refereeDiscountStatus: RefereeDiscountStatus;
  canChange: boolean;
}

export interface ReferralDashboard {
  code: string;
  isActive: boolean;
  link: string;
  rules: ReferralRules;
  credits: ReferralCredits;
  nextInvoice: ReferralNextInvoice | null;
  stats: ReferralStats;
  referrals: ReferralListItem[];
  referredBy: ReferredBy | null;
  canAttach: boolean;
}

/** Resumo do checkout com a mesma conta da cobrança (`POST /subscription/checkout-preview`). */
export interface CheckoutPreview {
  baseCents: number;
  couponDiscountCents: number;
  refereeDiscountCents: number;
  rewardDiscountCents: number;
  referralDiscountCents: number;
  totalCents: number;
  refereeEligible: boolean;
}

/** Linha do painel interno (admin). */
export interface AdminReferral {
  id: string;
  referrerWorkspaceId: string;
  refereeWorkspaceId: string;
  referrerWorkspaceName: string | null;
  refereeWorkspaceName: string | null;
  code: string;
  source: string;
  status: ReferralStatus;
  fraudSignals: string[];
  disqualifiedReason: string | null;
  firstPaidAt: string | null;
  graceEndsAt: string | null;
  qualifiedAt: string | null;
  createdAt: string;
  reward: { status: ReferralRewardStatus; totalBp: number; remainingBp: number };
  refereeDiscount: { status: RefereeDiscountStatus; amountCents: number | null };
}
