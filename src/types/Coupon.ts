import type { BillingCycle } from './Subscription';

export type CouponType = 'recurring' | 'first_month' | 'repeating';
export type CouponDiscountType = 'percent' | 'amount';

/** Preview retornado pela validação no checkout. */
export interface CouponPreview {
  code: string;
  /** Ciclo sobre o qual o desconto foi calculado. */
  billingCycle: BillingCycle;
  /** Meses cobrados de uma vez nesse ciclo. */
  months: number;
  type: CouponType;
  discountType: CouponDiscountType;
  value: number;
  durationInMonths: number | null;
  originalCents: number;
  discountedCents: number;
  label: string;
}

/** Cupom completo — visível apenas no painel admin. */
export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  discountType: CouponDiscountType;
  value: number;
  durationInMonths: number | null;
  stripeCouponId: string;
  maxRedemptions: number | null;
  redemptionsCount: number;
  expiresAt: string | null;
  isActive: boolean;
  note: string | null;
  createdAt: string;
}

export interface CouponRedemption {
  id: string;
  code: string;
  planSlug: string;
  redeemedAt: string;
  workspaceId: string;
  workspaceName: string | null;
  userName: string | null;
  userEmail: string | null;
}

export interface CreateCouponPayload {
  code: string;
  type: CouponType;
  discountType: CouponDiscountType;
  value: number;
  durationInMonths?: number | null;
  maxRedemptions?: number | null;
  expiresAt?: string | null;
  note?: string | null;
}
