import type { Coupon, CouponPreview, CouponRedemption, CreateCouponPayload } from '@/types/Coupon';
import { apiClient } from '@/utils/ApiClient';
import { extractSubscriptionError } from '@/utils/ErrorHandling';

class CouponService {
  /** Valida um cupom para o plano escolhido (usuário final, no checkout). */
  public async validate(code: string, planSlug: string): Promise<CouponPreview> {
    const res = await apiClient.post<{ coupon: CouponPreview }>('/subscription/coupons/validate', { code, planSlug });
    if (!res.success || !res.data) {
      throw new Error(extractSubscriptionError(res) || 'Cupom inválido.');
    }
    return (res.data as { coupon: CouponPreview }).coupon;
  }

  // ——— Admin (role 'admin') ———

  public async create(payload: CreateCouponPayload): Promise<Coupon> {
    const res = await apiClient.post<{ coupon: Coupon }>('/admin/coupons', payload);
    if (!res.success || !res.data) {
      throw new Error(extractSubscriptionError(res) || 'Falha ao criar cupom.');
    }
    return (res.data as { coupon: Coupon }).coupon;
  }

  public async list(): Promise<Coupon[]> {
    const res = await apiClient.get<{ coupons: Coupon[] }>('/admin/coupons');
    if (!res.success || !res.data) {
      throw new Error('Falha ao buscar cupons.');
    }
    return (res.data as { coupons: Coupon[] }).coupons;
  }

  public async listRedemptions(couponId: string): Promise<CouponRedemption[]> {
    const res = await apiClient.get<{ redemptions: CouponRedemption[] }>(`/admin/coupons/${couponId}/redemptions`);
    if (!res.success || !res.data) {
      throw new Error('Falha ao buscar usos do cupom.');
    }
    return (res.data as { redemptions: CouponRedemption[] }).redemptions;
  }

  public async setActive(couponId: string, isActive: boolean): Promise<Coupon> {
    const res = await apiClient.patch<{ coupon: Coupon }>(`/admin/coupons/${couponId}`, { isActive });
    if (!res.success || !res.data) {
      throw new Error('Falha ao atualizar cupom.');
    }
    return (res.data as { coupon: Coupon }).coupon;
  }
}

export const couponService = new CouponService();
