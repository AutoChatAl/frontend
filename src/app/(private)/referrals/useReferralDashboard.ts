import { useCallback, useEffect, useState } from 'react';

import { referralService } from '@/services/referral.service';
import type { ReferralDashboard } from '@/types/Referral';

interface UseReferralDashboardReturn {
  dashboard: ReferralDashboard | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useReferralDashboard(): UseReferralDashboardReturn {
  const [dashboard, setDashboard] = useState<ReferralDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setError(null);
    try {
      setDashboard(await referralService.getDashboard());
    }
    catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar suas indicações.');
    }
    finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { dashboard, loading, error, reload };
}
