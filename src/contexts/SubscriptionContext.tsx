'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { subscriptionService } from '@/services/subscription.service';
import type { SubscriptionStatus_Full, UsageSummary, Plan, AiPlan } from '@/types/Subscription';

interface SubscriptionContextType {
  status: SubscriptionStatus_Full | null;
  usage: UsageSummary | null;
  loading: boolean;
  refresh: () => Promise<void>;
  /**
   * Used after a paid subscription action. Polls /status until the plan id or
   * trial flag change, then updates state. This protects against the brief
   * window where the Stripe webhook hasn't reflected the new plan yet.
   */
  refreshAfterPurchase: (opts?: { expectPlanId?: string; expectActive?: boolean; tries?: number }) => Promise<void>;
  // Derived
  isTrialing: boolean;
  trialDaysRemaining: number;
  planName: string;
  hasAiPlan: boolean;
  isActive: boolean;
  plan: Plan | null;
  aiPlan: AiPlan | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SubscriptionStatus_Full | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    subscriptionService.clearCache();
    try {
      const [s, u] = await Promise.all([
        subscriptionService.getStatus(),
        subscriptionService.getUsage(),
      ]);
      setStatus(s);
      setUsage(u);
    } catch (err) {
      // Handle error (optional: you might want to set an error state here)
      console.error('Failed to refresh subscription data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAfterPurchase = useCallback(
    async (opts?: { expectPlanId?: string; expectActive?: boolean; tries?: number }) => {
      const maxTries = opts?.tries ?? 5;
      const delay = 600;
      for (let i = 0; i < maxTries; i++) {
        subscriptionService.clearCache();
        try {
          const [s, u] = await Promise.all([
            subscriptionService.getStatus(),
            subscriptionService.getUsage(),
          ]);
          setStatus(s);
          setUsage(u);
          const sub = s?.subscription;
          const trialActive = !!(sub?.trialEnd && new Date(sub.trialEnd) > new Date());
          const planMatches = opts?.expectPlanId ? sub?.planId === opts.expectPlanId : true;
          const activeMatches = opts?.expectActive ? sub?.status === 'active' && !trialActive : true;
          if (planMatches && activeMatches) {
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Failed to refresh subscription data:', err);
        }
        await new Promise((r) => setTimeout(r, delay));
      }
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const derived = useMemo(() => {
    const sub = status?.subscription;
    const isTrialing = !!(sub?.status === 'active' && sub?.trialEnd && new Date(sub.trialEnd) > new Date());
    const isActive = sub?.status === 'active';

    let trialDaysRemaining = 0;
    if (isTrialing && sub?.trialEnd) {
      const diff = new Date(sub.trialEnd).getTime() - Date.now();
      trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return {
      isTrialing,
      trialDaysRemaining,
      planName: status?.plan?.name ?? 'Sem plano',
      hasAiPlan: !!status?.aiPlan || !!status?.plan?.aiIncluded,
      isActive,
      plan: status?.plan ?? null,
      aiPlan: status?.aiPlan ?? null,
    };
  }, [status]);

  const value = useMemo(
    () => ({ status, usage, loading, refresh, refreshAfterPurchase, ...derived }),
    [status, usage, loading, refresh, refreshAfterPurchase, derived],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}

export function usePlanLimitCheck(resource: keyof UsageSummary) {
  const { usage } = useSubscription();
  const entry = usage?.[resource];
  if (!entry) return { used: 0, limit: 0, remaining: 0, isAtLimit: false, percentage: 0 };

  const isUnlimited = entry.limit === -1;
  const remaining = isUnlimited ? Infinity : Math.max(0, entry.limit - entry.used);
  const percentage = isUnlimited ? 0 : entry.limit > 0 ? Math.min(100, Math.round((entry.used / entry.limit) * 100)) : 0;

  return {
    used: entry.used,
    limit: entry.limit,
    remaining,
    isAtLimit: !isUnlimited && entry.used >= entry.limit,
    percentage,
  };
}
