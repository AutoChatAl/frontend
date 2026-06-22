'use client';
import { ArrowRight, CheckCircle2, Loader2, Lock } from 'lucide-react';
import type { ReactNode } from 'react';

export type SetupStepAccent = 'emerald' | 'fuchsia' | 'indigo' | 'violet' | 'amber';
export type SetupStepStatus = 'pending' | 'done' | 'skipped';

interface SetupStepCardProps {
  icon: ReactNode;
  accent: SetupStepAccent;
  title: string;
  description: string;
  status: SetupStepStatus;
  actionLabel: string;
  onAction: () => void;
  onSkip: () => void;
  canSkip?: boolean;
  locked?: boolean;
  lockedHint?: string;
  actionLoading?: boolean;
}

const ACCENTS: Record<SetupStepAccent, { iconBg: string; btn: string }> = {
  emerald: {
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  fuchsia: {
    iconBg: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-400',
    btn: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white',
  },
  indigo: {
    iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
    btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  violet: {
    iconBg: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
    btn: 'bg-violet-600 hover:bg-violet-700 text-white',
  },
  amber: {
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    btn: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
};

export default function SetupStepCard({
  icon,
  accent,
  title,
  description,
  status,
  actionLabel,
  onAction,
  onSkip,
  canSkip = true,
  locked = false,
  lockedHint,
  actionLoading = false,
}: SetupStepCardProps) {
  const isDone = status === 'done';
  const isSkipped = status === 'skipped';
  const accentStyles = ACCENTS[accent];

  return (
    <div
      className={`group relative flex flex-col gap-4 rounded-2xl border bg-white p-4 transition-all dark:bg-slate-800 sm:flex-row sm:items-center sm:p-5 ${
        isDone
          ? 'border-emerald-200 dark:border-emerald-500/30'
          : 'border-slate-200 dark:border-slate-700'
      } ${locked && !isDone ? 'opacity-75' : ''}`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
          isDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' : accentStyles.iconBg
        }`}
      >
        {isDone ? <CheckCircle2 size={24} /> : icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          {isSkipped && !isDone && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
              Deixado para depois
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        {locked && !isDone && lockedHint && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Lock size={12} /> {lockedHint}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
        {isDone ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={16} /> Concluído
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={onAction}
              disabled={locked || actionLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                locked
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                  : `${accentStyles.btn} hover:scale-[1.02] active:scale-95`
              }`}
            >
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {actionLabel}
            </button>
            {canSkip && !isSkipped && (
              <button
                type="button"
                onClick={onSkip}
                className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
              >
                Deixar para depois
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
