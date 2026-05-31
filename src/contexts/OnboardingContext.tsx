'use client';

import { usePathname } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  findTourByPathname,
  ONBOARDING_VERSION,
  TOURS,
  type TourConfig,
  type TourStep,
} from '@/components/onboarding/tours';
import { useSidebar } from '@/contexts/SidebarContext';
import { authService } from '@/services/auth.service';
import { onboardingService, type OnboardingState } from '@/services/onboarding.service';

const MOBILE_BREAKPOINT = 768;
const SIDEBAR_SELECTOR_PREFIX = '[data-tour="sidebar-';
const VERSION_KEY = 'onboarding_version';

interface OnboardingContextValue {
  /** Estado bruto vindo do backend (steps concluídos, tours pulados etc.). */
  state: OnboardingState;
  /** Indica se mostramos o modal inicial de boas-vindas. */
  showWelcome: boolean;
  /** Tour ativo da página atual (ou null se nenhum tour roda nesta página). */
  activeTour: TourConfig | null;
  /** Step atual do tour ativo (ou null). */
  activeStep: TourStep | null;
  /** Índice 0-based do step ativo dentro do tour. */
  activeIndex: number;
  /** Total de steps do tour ativo (apenas os que ainda valem para este usuário). */
  totalSteps: number;
  /** Próximo step. Se for o último, conclui o tour. */
  next: () => void;
  /** Voltar para o step anterior (se houver). */
  prev: () => void;
  /** Pula todo o tour ativo (não aparece mais nessa página). */
  skipTour: () => void;
  /** Fecha o welcome e segue para o tour da home. */
  startTour: () => void;
  /** Pula o welcome + todos os tours. */
  skipAll: () => void;
  /** Reseta o onboarding no backend e localmente (botão "Refazer tour"). */
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

const LOCAL_KEY = 'onboarding_dismissed_v1';

function readLocalDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeLocalDismissed(set: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore quota / private mode */
  }
}

interface OnboardingProviderProps {
  children: ReactNode;
  enabled: boolean;
}

export function OnboardingProvider({ children, enabled }: OnboardingProviderProps) {
  const pathname = usePathname();
  const { setMobileMenuOpen } = useSidebar();

  const [state, setState] = useState<OnboardingState>({
    completedSteps: [],
    skippedTours: [],
    welcomeCompletedAt: null,
    finishedAt: null,
  });
  const [loaded, setLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const dismissedRef = useRef<Set<string>>(new Set());
  // Lembra se o tour foi quem abriu o drawer mobile, para fechar depois
  const openedMobileMenuRef = useRef<boolean>(false);

  // Carrega o estado do backend uma vez (e fallback do localStorage).
  // Antes disso, compara a versão salva com a versão atual dos tours —
  // se mudou, reseta automaticamente para que melhorias/reordenações
  // apareçam para o usuário sem ele precisar fazer nada.
  useEffect(() => {
    if (!enabled) return;
    dismissedRef.current = readLocalDismissed();
    let cancelled = false;

    const versionMatches =
      typeof window !== 'undefined' &&
      localStorage.getItem(VERSION_KEY) === ONBOARDING_VERSION;

    const ensureLoaded = async () => {
      try {
        const fresh = versionMatches
          ? await onboardingService.fetch()
          : await onboardingService.reset();
        if (cancelled) return;
        setState(fresh);
        if (!versionMatches && typeof window !== 'undefined') {
          // Limpa o "welcome dismissed" local também, pra mostrar o modal de novo
          dismissedRef.current = new Set();
          writeLocalDismissed(dismissedRef.current);
          localStorage.setItem(VERSION_KEY, ONBOARDING_VERSION);
        }
      } catch {
        /* mantém estado inicial */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    ensureLoaded();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Decide se mostra o modal de boas-vindas: usuário novo, nunca completou welcome,
  // não pulou tudo, e está autenticado.
  useEffect(() => {
    if (!enabled || !loaded) return;
    const dismissed = dismissedRef.current.has('welcome');
    const finished = !!state.finishedAt;
    const welcomeDone = !!state.welcomeCompletedAt;
    setShowWelcome(!dismissed && !finished && !welcomeDone);
  }, [enabled, loaded, state.welcomeCompletedAt, state.finishedAt]);

  const activeTour = useMemo<TourConfig | null>(() => {
    if (!enabled || !loaded) return null;
    if (showWelcome) return null;
    const tour = findTourByPathname(pathname || '');
    if (!tour) return null;

    // Permissão (colaboradores podem não ver alguns tours)
    if (tour.permission) {
      const user = authService.getUser();
      const role = user?.role;
      const perms = user?.permissions ?? [];
      if (role && role !== 'owner' && !perms.includes(tour.permission)) {
        return null;
      }
    }

    if (state.skippedTours.includes(tour.id)) return null;
    if (state.finishedAt) return null;

    // Tem pelo menos um step não-concluído?
    const remaining = tour.steps.filter((s) => !state.completedSteps.includes(s.id));
    if (remaining.length === 0) return null;
    return tour;
  }, [enabled, loaded, pathname, showWelcome, state.skippedTours, state.completedSteps, state.finishedAt]);

  // Snapshot estável dos steps do tour ativo. É CRÍTICO que essa lista NÃO
  // recalcule a cada `markStepCompleted`, senão o array encolhe a cada clique
  // em "Próximo" e o `activeIndex` acaba pulando steps (foi o que estava
  // acontecendo: Visão Geral pulava direto pra Canais).
  //
  // Tiramos o snapshot apenas quando o tour ATIVA (id muda) — capturamos os
  // steps que ainda não foram concluídos naquele momento. A partir daí, a
  // ordem e o tamanho ficam congelados até o usuário sair do tour.
  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);

  useEffect(() => {
    if (!activeTour) {
      setTourSteps([]);
      setActiveIndex(0);
      return;
    }
    const remaining = activeTour.steps.filter((s) => !state.completedSteps.includes(s.id));
    setTourSteps(remaining);
    setActiveIndex(0);
    // Intencionalmente só dependemos do id do tour — não de state.completedSteps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTour?.id]);

  const activeStep = tourSteps[activeIndex] ?? null;
  const totalSteps = tourSteps.length;

  // Persistência otimista: marca um step como concluído no backend
  const markStepCompleted = useCallback(async (stepId: string) => {
    setState((prev) =>
      prev.completedSteps.includes(stepId)
        ? prev
        : { ...prev, completedSteps: [...prev.completedSteps, stepId] },
    );
    try {
      const updated = await onboardingService.update({ completeStep: stepId });
      setState(updated);
    } catch {
      /* mantém estado otimista */
    }
  }, []);

  const next = useCallback(() => {
    if (!activeTour || !activeStep) return;
    const isLast = activeIndex >= tourSteps.length - 1;
    // Marca como concluído no backend (otimista). Como `tourSteps` é um
    // snapshot estável, o array NÃO encolhe quando `completedSteps` atualiza —
    // por isso podemos avançar com segurança incrementando o índice.
    void markStepCompleted(activeStep.id);
    if (isLast) {
      setActiveIndex(0);
    } else {
      setActiveIndex((i) => i + 1);
    }
  }, [activeTour, activeStep, activeIndex, tourSteps.length, markStepCompleted]);

  const prev = useCallback(() => {
    setActiveIndex((i) => Math.max(0, i - 1));
  }, []);

  const skipTour = useCallback(() => {
    if (!activeTour) return;
    const tourId = activeTour.id;
    setState((prev) => ({
      ...prev,
      skippedTours: prev.skippedTours.includes(tourId)
        ? prev.skippedTours
        : [...prev.skippedTours, tourId],
    }));
    setActiveIndex(0);
    onboardingService.update({ skipTour: tourId }).then(setState).catch(() => {});
  }, [activeTour]);

  const startTour = useCallback(() => {
    dismissedRef.current.add('welcome');
    writeLocalDismissed(dismissedRef.current);
    setShowWelcome(false);
    onboardingService
      .update({ welcomeCompleted: true })
      .then(setState)
      .catch(() => {});
  }, []);

  const skipAll = useCallback(() => {
    dismissedRef.current.add('welcome');
    writeLocalDismissed(dismissedRef.current);
    setShowWelcome(false);
    const allTourIds = TOURS.map((t) => t.id);
    setState((prev) => ({
      ...prev,
      skippedTours: Array.from(new Set([...prev.skippedTours, ...allTourIds])),
      welcomeCompletedAt: prev.welcomeCompletedAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    }));
    onboardingService
      .update({ welcomeCompleted: true, finished: true })
      .then(setState)
      .catch(() => {});
  }, []);

  // Em mobile, quando o step ativo aponta para um item da sidebar, abre o
  // drawer mobile automaticamente — senão o seletor nunca acharia o elemento.
  // Quando o step deixa de apontar para a sidebar (ou o tour acaba), fecha o
  // drawer, mas só se foi o tour quem abriu (não fechamos um drawer que o
  // usuário já tinha aberto manualmente).
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    if (window.innerWidth >= MOBILE_BREAKPOINT) return;

    const needsSidebar = !!activeStep?.selector?.startsWith(SIDEBAR_SELECTOR_PREFIX);
    if (needsSidebar) {
      if (!openedMobileMenuRef.current) {
        openedMobileMenuRef.current = true;
        setMobileMenuOpen(true);
      } else {
        // garante que continua aberto entre steps
        setMobileMenuOpen(true);
      }
    } else if (openedMobileMenuRef.current) {
      openedMobileMenuRef.current = false;
      setMobileMenuOpen(false);
    }
  }, [enabled, activeStep, setMobileMenuOpen]);

  const resetOnboarding = useCallback(async () => {
    dismissedRef.current = new Set();
    writeLocalDismissed(dismissedRef.current);
    if (typeof window !== 'undefined') {
      localStorage.setItem(VERSION_KEY, ONBOARDING_VERSION);
    }
    try {
      const fresh = await onboardingService.reset();
      setState(fresh);
      setShowWelcome(true);
      setActiveIndex(0);
    } catch {
      /* ignora */
    }
  }, []);

  const value: OnboardingContextValue = {
    state,
    showWelcome,
    activeTour,
    activeStep,
    activeIndex,
    totalSteps,
    next,
    prev,
    skipTour,
    startTour,
    skipAll,
    resetOnboarding,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding precisa estar dentro de OnboardingProvider');
  return ctx;
}
