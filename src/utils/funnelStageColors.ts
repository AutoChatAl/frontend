import type { StageColor } from '@/types/Funnel';

/** Tons de uma etapa do funil. O quadro e a conversa desenham a etapa com as mesmas cores. */
export interface StageColorMeta {
  dot: string;
  text: string;
  soft: string;
  bar: string;
}

export const STAGE_COLOR_META: Record<StageColor, StageColorMeta> = {
  indigo: { dot: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', soft: 'bg-indigo-50 dark:bg-indigo-500/10', bar: 'bg-indigo-500' },
  violet: { dot: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400', soft: 'bg-violet-50 dark:bg-violet-500/10', bar: 'bg-violet-500' },
  blue: { dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', soft: 'bg-blue-50 dark:bg-blue-500/10', bar: 'bg-blue-500' },
  emerald: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', soft: 'bg-emerald-50 dark:bg-emerald-500/10', bar: 'bg-emerald-500' },
  amber: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', soft: 'bg-amber-50 dark:bg-amber-500/10', bar: 'bg-amber-500' },
  rose: { dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', soft: 'bg-rose-50 dark:bg-rose-500/10', bar: 'bg-rose-500' },
  fuchsia: { dot: 'bg-fuchsia-500', text: 'text-fuchsia-600 dark:text-fuchsia-400', soft: 'bg-fuchsia-50 dark:bg-fuchsia-500/10', bar: 'bg-fuchsia-500' },
  slate: { dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-300', soft: 'bg-slate-100 dark:bg-slate-700/40', bar: 'bg-slate-400' },
};

export function stageColorMeta(color: StageColor): StageColorMeta {
  return STAGE_COLOR_META[color] ?? STAGE_COLOR_META.indigo;
}
