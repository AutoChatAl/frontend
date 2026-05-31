'use client';

import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { TourPlacement, TourStep } from '@/components/onboarding/tours';
import { useOnboarding } from '@/contexts/OnboardingContext';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;
const MAX_TOOLTIP_WIDTH = 360;
const TOOLTIP_GAP = 14;
const VIEWPORT_MARGIN = 12;
const MOBILE_BREAKPOINT = 768;

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getTooltipWidth(): number {
  if (typeof window === 'undefined') return MAX_TOOLTIP_WIDTH;
  return Math.min(MAX_TOOLTIP_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
}

function getRect(selector: string | null): Rect | null {
  if (!selector || typeof window === 'undefined') return null;
  const els = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  for (const el of els) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return {
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      };
    }
  }
  return null;
}

function pickPlacement(rect: Rect | null, preferred: TourPlacement | undefined): TourPlacement {
  if (!rect) return 'center';
  const tooltipWidth = getTooltipWidth();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mobile = isMobile();

  // Em mobile, priorizamos bottom/top — não há espaço lateral suficiente.
  if (mobile) {
    const spaceBelow = vh - (rect.top + rect.height);
    const spaceAbove = rect.top;
    if (spaceBelow >= 220) return 'bottom';
    if (spaceAbove >= 220) return 'top';
    return 'bottom';
  }

  if (preferred && preferred !== 'center') {
    // Verifica se a posição preferida tem espaço; se não, cai no fallback
    if (preferred === 'right' && rect.left + rect.width + TOOLTIP_GAP + tooltipWidth < vw) return 'right';
    if (preferred === 'left' && rect.left - TOOLTIP_GAP - tooltipWidth > 0) return 'left';
    if (preferred === 'bottom' || preferred === 'top') return preferred;
  }
  // Tenta direita; se não couber, esquerda; se não, bottom
  if (rect.left + rect.width + TOOLTIP_GAP + tooltipWidth < vw) return 'right';
  if (rect.left - TOOLTIP_GAP - tooltipWidth > 0) return 'left';
  return 'bottom';
}

function getTooltipPos(rect: Rect | null, placement: TourPlacement): { top: number; left: number } {
  const tooltipWidth = getTooltipWidth();
  const vw = typeof window !== 'undefined' ? window.innerWidth : MAX_TOOLTIP_WIDTH;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 600;
  const estimatedHeight = 240; // estimativa generosa do card

  if (!rect || placement === 'center') {
    const top = Math.max(VIEWPORT_MARGIN, vh / 2 - estimatedHeight / 2);
    const left = Math.max(VIEWPORT_MARGIN, vw / 2 - tooltipWidth / 2);
    return { top, left };
  }

  let top = 0;
  let left = 0;

  switch (placement) {
  case 'right':
    top = rect.top + rect.height / 2 - estimatedHeight / 3;
    left = rect.left + rect.width + TOOLTIP_GAP;
    break;
  case 'left':
    top = rect.top + rect.height / 2 - estimatedHeight / 3;
    left = rect.left - TOOLTIP_GAP - tooltipWidth;
    break;
  case 'bottom':
    top = rect.top + rect.height + TOOLTIP_GAP;
    left = rect.left + rect.width / 2 - tooltipWidth / 2;
    break;
  case 'top':
    top = rect.top - TOOLTIP_GAP - estimatedHeight;
    left = rect.left + rect.width / 2 - tooltipWidth / 2;
    break;
  }

  // Clamp na viewport (em mobile prende com mais margem)
  left = Math.min(Math.max(VIEWPORT_MARGIN, left), vw - tooltipWidth - VIEWPORT_MARGIN);
  top = Math.min(Math.max(VIEWPORT_MARGIN, top), vh - estimatedHeight - VIEWPORT_MARGIN);
  return { top, left };
}

function WelcomeModal({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onSkip} />
      <div className="relative w-full max-w-lg bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Topo: grid pattern + glow esverdeado no estilo Vercel/Linear */}
        <div className="relative h-44 bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
              maskImage: 'radial-gradient(ellipse 70% 90% at 50% 30%, rgba(0,0,0,0.85), transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 90% at 50% 30%, rgba(0,0,0,0.85), transparent 80%)',
            }}
          />
          {/* Glow esverdeado no topo central */}
          <div className="absolute left-1/2 -top-24 -translate-x-1/2 w-[70%] h-44 bg-emerald-500/30 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute left-1/2 -top-10 -translate-x-1/2 w-[40%] h-24 bg-emerald-400/20 blur-2xl rounded-full pointer-events-none" />
          {/* Vignette nas bordas */}
          <div className="absolute inset-0 bg-radial-gradient pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(2,6,23,0.9) 100%)' }} />

          {/* Bot icon central */}
          <div className="relative w-20 h-20 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/15 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
            <Bot size={40} className="text-white" />
            <Sparkles size={12} className="absolute -top-1 -right-1 text-emerald-300 animate-pulse" />
          </div>
        </div>

        <div className="p-7 bg-slate-950 text-white">
          <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">
            Bem-vindo ao Synq! 🚀
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Em poucos passos você vai conhecer tudo que dá pra fazer aqui: conectar Instagram e
            WhatsApp, disparar campanhas em massa, criar auto-respostas inteligentes e configurar
            um chatbot com IA que conversa por você 24/7.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {[
              { icon: '📡', label: 'Conectar canais' },
              { icon: '📨', label: 'Disparos em massa' },
              { icon: '⚡', label: 'Auto-respostas' },
              { icon: '🤖', label: 'IA conversacional' },
            ].map((it) => (
              <div
                key={it.label}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10"
              >
                <span className="text-lg leading-none">{it.icon}</span>
                <span className="text-xs font-medium text-slate-200">{it.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 mt-6">
            <button
              onClick={onStart}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-2.5 rounded-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all transform hover:-translate-y-0.5"
            >
              <Wand2 size={16} />
              Começar tour guiado
            </button>
            <button
              onClick={onSkip}
              className="inline-flex items-center justify-center text-sm font-medium text-slate-400 hover:text-slate-200 px-4 py-2.5 rounded-lg transition-colors"
            >
              Pular por agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StepCardProps {
  step: TourStep;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

function StepCard({ step, index, total, onNext, onPrev, onSkip }: StepCardProps) {
  const [rect, setRect] = useState<Rect | null>(() => getRect(step.selector));
  const [placement, setPlacement] = useState<TourPlacement>('center');
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  /**
   * Depois do card montar (e depois de cada mudança de step), mede a altura
   * real e re-clampa a posição vertical pra ele NUNCA sair da viewport. Sem
   * isso, descrições longas (como o step de Contatos em mobile) faziam o
   * footer com os botões ficar abaixo da dobra.
   */
  const reclampPosition = (currentRect: Rect | null, currentPlacement: TourPlacement) => {
    if (typeof window === 'undefined') return;
    const card = cardRef.current;
    if (!card) return;
    const cardHeight = card.offsetHeight;
    const vh = window.innerHeight;

    // Calcula a posição "ideal" usando a altura REAL do card
    let nextTop = pos.top;
    if (currentRect && currentPlacement !== 'center') {
      if (currentPlacement === 'bottom') {
        nextTop = currentRect.top + currentRect.height + TOOLTIP_GAP;
      } else if (currentPlacement === 'top') {
        nextTop = currentRect.top - TOOLTIP_GAP - cardHeight;
      } else {
        nextTop = currentRect.top + currentRect.height / 2 - cardHeight / 3;
      }
    } else {
      nextTop = vh / 2 - cardHeight / 2;
    }

    // Garante que o card cabe na viewport
    nextTop = Math.min(Math.max(VIEWPORT_MARGIN, nextTop), vh - cardHeight - VIEWPORT_MARGIN);
    if (Math.abs(nextTop - pos.top) > 1) {
      setPos((p) => ({ ...p, top: nextTop }));
    }
  };

  // Atualiza o retângulo do alvo (com retry se o elemento ainda não está no DOM)
  useLayoutEffect(() => {
    setVisible(false);
    let cancelled = false;
    let attempts = 0;

    const tryLocate = () => {
      const r = getRect(step.selector);
      if (r) {
        if (!cancelled) {
          setRect(r);
          const p = pickPlacement(r, step.placement);
          setPlacement(p);
          setPos(getTooltipPos(r, p));
          setVisible(true);
        }
        return;
      }
      if (step.allowMissingTarget) {
        if (!cancelled) {
          setRect(null);
          setPlacement('center');
          setPos(getTooltipPos(null, 'center'));
          setVisible(true);
        }
        return;
      }
      if (attempts < 30) {
        attempts += 1;
        setTimeout(tryLocate, 100);
      } else {
        // desistimos: mostra centralizado
        if (!cancelled) {
          setRect(null);
          setPlacement('center');
          setPos(getTooltipPos(null, 'center'));
          setVisible(true);
        }
      }
    };

    tryLocate();
    return () => {
      cancelled = true;
    };
  }, [step.selector, step.placement, step.allowMissingTarget]);

  // Re-posiciona em scroll/resize
  useEffect(() => {
    if (!visible) return;
    const update = () => {
      const r = getRect(step.selector);
      const p = pickPlacement(r, step.placement);
      setRect(r);
      setPlacement(p);
      setPos(getTooltipPos(r, p));
    };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [visible, step.selector, step.placement]);

  // Depois que o card monta com altura real, reclampa pra garantir que cabe
  // (importante quando a descrição é longa em mobile).
  useLayoutEffect(() => {
    if (!visible) return;
    reclampPosition(rect, placement);
    // ResizeObserver detecta mudanças do conteúdo (ex.: texto reflowing)
    const card = cardRef.current;
    if (!card || typeof ResizeObserver === 'undefined') return;
    const obs = new ResizeObserver(() => reclampPosition(rect, placement));
    obs.observe(card);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, step.id, rect?.top, rect?.left, placement]);

  // Scroll do alvo para a viewport
  useEffect(() => {
    if (!step.selector) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [step.selector]);

  if (!visible) return null;

  const isLast = index >= total - 1;

  // Overlay: 4 retângulos escuros ao redor do alvo (se houver alvo).
  // Em mobile o overlay é mais denso pra esconder a borda direita do drawer
  // e qualquer outra div que estava aparecendo através do semi-transparente.
  const mobile = isMobile();
  const overlayBg = mobile ? 'rgba(2, 6, 23, 0.9)' : 'rgba(15, 23, 42, 0.62)';
  const overlays: { top: number; left: number; width: number; height: number }[] = [];
  if (rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // top
    overlays.push({ top: 0, left: 0, width: vw, height: Math.max(0, rect.top) });
    // bottom
    overlays.push({
      top: rect.top + rect.height,
      left: 0,
      width: vw,
      height: Math.max(0, vh - (rect.top + rect.height)),
    });
    // left
    overlays.push({ top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height });
    // right
    overlays.push({
      top: rect.top,
      left: rect.left + rect.width,
      width: Math.max(0, vw - (rect.left + rect.width)),
      height: rect.height,
    });
  }

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none animate-in fade-in duration-200">
      {/* Overlays escurecendo o resto da tela */}
      {rect ? (
        overlays.map((o, i) => (
          <div
            key={i}
            className="absolute pointer-events-auto transition-all duration-300"
            style={{
              top: o.top,
              left: o.left,
              width: o.width,
              height: o.height,
              background: overlayBg,
              backdropFilter: 'blur(2px)',
            }}
            onClick={onSkip}
          />
        ))
      ) : (
        <div
          className="absolute inset-0 pointer-events-auto"
          style={{ background: overlayBg, backdropFilter: 'blur(4px)' }}
          onClick={onSkip}
        />
      )}

      {/* Anel de destaque ao redor do alvo. Em mobile usamos apenas um ring
          fino, sem glow espalhado, pra não vazar pelos lados da sidebar
          mobile (que tem largura limitada — w-64). */}
      {rect && (
        <div
          className="absolute pointer-events-none transition-all duration-300"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: mobile ? 10 : 14,
            boxShadow: mobile
              ? '0 0 0 2px rgba(129, 140, 248, 0.95), 0 0 0 4px rgba(99, 102, 241, 0.25)'
              : '0 0 0 3px rgba(99, 102, 241, 0.95), 0 0 0 8px rgba(99, 102, 241, 0.30), 0 0 36px 8px rgba(139, 92, 246, 0.45)',
          }}
        >
          {!mobile && (
            <div
              className="absolute inset-0 rounded-[14px] animate-ping"
              style={{ boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.6)' }}
            />
          )}
        </div>
      )}

      {/* Tooltip card — flex column com footer sticky para que os botões NUNCA
          fiquem escondidos em mobile, mesmo com descrições longas. */}
      <div
        ref={cardRef}
        className="absolute pointer-events-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col"
        style={{
          top: pos.top,
          left: pos.left,
          width: getTooltipWidth(),
          maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
          maxHeight: `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
        }}
      >
        {/* barra de progresso */}
        <div className="h-1 bg-slate-100 dark:bg-slate-700 shrink-0">
          <div
            className="h-full bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-500"
            style={{ width: `${((index + 1) / Math.max(1, total)) * 100}%` }}
          />
        </div>

        {/* Cabeçalho (passo X de Y + fechar) */}
        <div className="px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-linear-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Passo {index + 1} de {total}
              </span>
            </div>
            <button
              onClick={onSkip}
              className="text-slate-300 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300 transition-colors shrink-0"
              aria-label="Pular tour"
              title="Pular este tour"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Corpo scrollável (título + descrição). Em mobile com texto longo,
            é essa área que rola — o footer fica sempre visível. */}
        <div className="px-5 pb-4 overflow-y-auto flex-1 min-h-0">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-snug">
            {step.title}
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Footer fixo com botões — separador visual e sombra superior pra dar
            sensação de que o conteúdo continua acima quando ele é rolável. */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={onSkip}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors px-1"
          >
            Pular tour
          </button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                onClick={onPrev}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={14} />
                Voltar
              </button>
            )}
            <button
              onClick={onNext}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              {isLast ? 'Concluir' : 'Próximo'}
              {!isLast && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OnboardingTour() {
  const {
    showWelcome,
    activeStep,
    activeIndex,
    totalSteps,
    next,
    prev,
    skipTour,
    startTour,
    skipAll,
  } = useOnboarding();

  // Guard duplo: `mounted` garante que NUNCA renderizamos nada no servidor
  // nem na primeira pass do cliente (antes da hidratação completa). Só
  // depois disso criamos o container DOM e ativamos o portal. Isso evita:
  //   1. Hydration mismatch (porque servidor e primeira render do cliente
  //      retornam ambos `null` — totalmente equivalentes).
  //   2. "Cannot read properties of null (reading 'removeChild')" que
  //      acontecia quando o portal era reconciliado contra um body já
  //      modificado por outro código.
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;

    // Reutiliza um container existente (importante no HMR), senão cria novo.
    let div = document.getElementById('onboarding-portal-root') as HTMLDivElement | null;
    let createdHere = false;
    if (!div) {
      div = document.createElement('div');
      div.id = 'onboarding-portal-root';
      document.body.appendChild(div);
      createdHere = true;
    }
    setContainer(div);

    return () => {
      // Só remove se foi este efeito que criou — assim evitamos disputa entre
      // múltiplas montagens (StrictMode dispara o efeito 2x em dev).
      if (createdHere && div && div.parentNode) {
        try {
          div.parentNode.removeChild(div);
        } catch {
          /* nó já desanexado por outro motivo — ignora */
        }
      }
      setContainer(null);
    };
  }, [mounted]);

  // SSR + primeira pass do client = null. Sem chance de mismatch.
  if (!mounted || !container) return null;

  const node = (
    <>
      {showWelcome && <WelcomeModal onStart={startTour} onSkip={skipAll} />}
      {!showWelcome && activeStep && (
        <StepCard
          key={activeStep.id}
          step={activeStep}
          index={activeIndex}
          total={totalSteps}
          onNext={next}
          onPrev={prev}
          onSkip={skipTour}
        />
      )}
    </>
  );

  return createPortal(node, container);
}

export default OnboardingTour;
