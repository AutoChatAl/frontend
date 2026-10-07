'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSubscription } from '@/contexts/SubscriptionContext';
import { setupOnboardingService } from '@/services/setup-onboarding.service';
import type { BusinessType } from '@/types/BusinessType';

import {
  activeSetupSteps,
  hasAnyAutomation,
  hasConfiguredAi,
  hasConnectedChannel,
  LEGACY_STEP_IDS,
  SETUP_STEP_IDS,
  trackStepCompleted,
  type SetupStepId,
} from '../setupSteps';

export type SetupStepFlags = Record<SetupStepId, boolean>;

const NONE: SetupStepFlags = { channel: false, ai: false, 'ai-test': false, recipe: false };

interface UseSetupProgressOptions {
  liveDone?: Partial<SetupStepFlags>;
}

export interface UseSetupProgressReturn {
  loading: boolean;
  businessType: BusinessType | null;
  finished: boolean;
  done: SetupStepFlags;
  steps: SetupStepId[];
  completedCount: number;
  total: number;
  nextStep: SetupStepId | null;
  refresh: () => Promise<void>;
  markStepDone: (step: SetupStepId) => void;
  chooseBusinessType: (type: BusinessType) => Promise<boolean>;
  markFinished: () => Promise<void>;
}

export function useSetupProgress({ liveDone }: UseSetupProgressOptions = {}): UseSetupProgressReturn {
  const { hasAiPlan, loading: subscriptionLoading } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [finished, setFinished] = useState(false);
  const [detected, setDetected] = useState<SetupStepFlags>(NONE);
  const [manual, setManual] = useState<SetupStepFlags>(NONE);
  const persistedRef = useRef<Set<string>>(new Set());
  const legacyRef = useRef<Set<SetupStepId>>(new Set());
  const businessTypeRef = useRef<BusinessType | null>(null);
  const loadedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const state = await setupOnboardingService.fetch().catch(() => null);
    const persisted = persistedRef.current;
    state?.completedSteps.forEach((step) => persisted.add(step));

    const savedDone = (step: SetupStepId): boolean => {
      if (persisted.has(step)) return true;
      const legacy = LEGACY_STEP_IDS[step].some((id) => persisted.has(id));
      if (legacy) legacyRef.current.add(step);
      return legacy;
    };

    const [channel, ai, recipe] = await Promise.all([
      savedDone('channel') ? Promise.resolve(true) : hasConnectedChannel(),
      savedDone('ai') ? Promise.resolve(true) : hasConfiguredAi(),
      savedDone('recipe') ? Promise.resolve(true) : hasAnyAutomation(),
    ]);
    if (!mountedRef.current) return;

    if (!loadedRef.current && state) {
      businessTypeRef.current = state.businessType;
      setBusinessType(state.businessType);
      setFinished(!!state.finishedAt);
      loadedRef.current = true;
    }
    setDetected({ channel, ai, 'ai-test': savedDone('ai-test'), recipe });
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const liveChannel = liveDone?.channel === true;
  const liveAi = liveDone?.ai === true;
  const liveAiTest = liveDone?.['ai-test'] === true;
  const liveRecipe = liveDone?.recipe === true;

  const done = useMemo<SetupStepFlags>(() => ({
    channel: detected.channel || manual.channel || liveChannel,
    ai: detected.ai || manual.ai || liveAi,
    'ai-test': detected['ai-test'] || manual['ai-test'] || liveAiTest,
    recipe: detected.recipe || manual.recipe || liveRecipe,
  }), [detected, manual, liveChannel, liveAi, liveAiTest, liveRecipe]);

  useEffect(() => {
    if (loading) return;
    const persisted = persistedRef.current;
    const newlyDone = SETUP_STEP_IDS.filter((step) => done[step] && !persisted.has(step));
    newlyDone.forEach((step) => {
      persisted.add(step);
      if (!legacyRef.current.has(step)) trackStepCompleted(step, businessTypeRef.current);
      setupOnboardingService.update({ completeStep: step }).catch(() => {});
    });
  }, [done, loading]);

  const markStepDone = useCallback((step: SetupStepId) => {
    setManual((prev) => (prev[step] ? prev : { ...prev, [step]: true }));
  }, []);

  const chooseBusinessType = useCallback(async (type: BusinessType): Promise<boolean> => {
    const saved = await setupOnboardingService.update({ businessType: type }).catch(() => null);
    if (!saved || saved.businessType !== type) return false;
    businessTypeRef.current = type;
    if (mountedRef.current) setBusinessType(type);
    return true;
  }, []);

  const markFinished = useCallback(async () => {
    if (finished) return;
    await setupOnboardingService.update({ finished: true }).catch(() => null);
    if (mountedRef.current) setFinished(true);
  }, [finished]);

  const steps = useMemo(() => activeSetupSteps(subscriptionLoading || hasAiPlan), [subscriptionLoading, hasAiPlan]);
  const completedCount = steps.filter((step) => done[step]).length;
  const nextStep = steps.find((step) => !done[step]) ?? null;

  return {
    loading: loading || subscriptionLoading,
    businessType,
    finished,
    done,
    steps,
    completedCount,
    total: steps.length,
    nextStep,
    refresh,
    markStepDone,
    chooseBusinessType,
    markFinished,
  };
}
