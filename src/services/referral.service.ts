import type {
  AdminReferral,
  ReferralAttachSource,
  ReferralCodeInfo,
  ReferralDashboard,
  ReferralStatus,
} from '@/types/Referral';
import { apiClient } from '@/utils/ApiClient';
import { extractSubscriptionError } from '@/utils/ErrorHandling';

class ReferralService {
  /** Rota pública: valida o código e diz quem convidou. Devolve null para código inválido. */
  public async getCodeInfo(code: string): Promise<ReferralCodeInfo | null> {
    const res = await apiClient.get<ReferralCodeInfo>(`/referrals/codes/${encodeURIComponent(code)}`);
    if (res.statusCode === 404) return null;
    if (!res.success || !res.data) {
      throw new Error(extractSubscriptionError(res) || 'Não foi possível validar o código de indicação.');
    }
    return res.data as ReferralCodeInfo;
  }

  public async getDashboard(): Promise<ReferralDashboard> {
    const res = await apiClient.get<ReferralDashboard>('/referrals/me');
    if (!res.success || !res.data) {
      throw new Error('Não foi possível carregar suas indicações.');
    }
    return res.data as ReferralDashboard;
  }

  /** Aplica um código depois do cadastro (antes da 1ª fatura paga). */
  public async attach(code: string, source: ReferralAttachSource): Promise<void> {
    const res = await apiClient.post('/referrals/attribution', { code, source });
    if (!res.success) {
      throw new Error(extractSubscriptionError(res) || 'Não foi possível aplicar o código de indicação.');
    }
  }

  public async detach(): Promise<void> {
    const res = await apiClient.delete('/referrals/attribution');
    if (!res.success) {
      throw new Error(extractSubscriptionError(res) || 'Não foi possível remover o código de indicação.');
    }
  }

  // ——— Admin (role 'admin') ———

  public async adminList(status?: ReferralStatus): Promise<AdminReferral[]> {
    const res = await apiClient.get<{ referrals: AdminReferral[] }>(`/admin/referrals${status ? `?status=${status}` : ''}`);
    if (!res.success || !res.data) {
      throw new Error('Falha ao buscar indicações.');
    }
    return (res.data as { referrals: AdminReferral[] }).referrals;
  }

  public async adminApprove(id: string): Promise<void> {
    const res = await apiClient.post(`/admin/referrals/${id}/approve`);
    if (!res.success) {
      throw new Error(extractSubscriptionError(res) || 'Falha ao aprovar a indicação.');
    }
  }

  public async adminRevoke(id: string, reason: string): Promise<void> {
    const res = await apiClient.post(`/admin/referrals/${id}/revoke`, { reason: reason || null });
    if (!res.success) {
      throw new Error(extractSubscriptionError(res) || 'Falha ao revogar a indicação.');
    }
  }

  public async adminAttribute(refereeWorkspaceId: string, code: string): Promise<void> {
    const res = await apiClient.post('/admin/referrals/attribute', { refereeWorkspaceId, code });
    if (!res.success) {
      throw new Error(extractSubscriptionError(res) || 'Falha ao atribuir a indicação.');
    }
  }
}

export const referralService = new ReferralService();
