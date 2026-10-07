'use client';
import { ArrowRight, CheckCircle2, Loader2, Lock } from 'lucide-react';
import type { ReactNode } from 'react';

export type SetupStepAccent = 'emerald' | 'fuchsia' | 'indigo' | 'violet' | 'amber';

export interface SetupStepAction {
  label: string;
  onClick: () => void;
  accent?: SetupStepAccent;
  icon?: ReactNode;
  loading?: boolean;
  outline?: boolean;
  hint?: string;
}

interface SetupStepCardProps {
  step: number;
  icon: ReactNode;
  accent: SetupStepAccent;
  title: string;
  description: string;
  done: boolean;
  current?: boolean;
  actions: SetupStepAction[];
  locked?: boolean;
  lockedHint?: string;
  doneHint?: string;
  doneAction?: { label: string; onClick: () => void };
  children?: ReactNode;
}

const ACCENTS: Record<SetupStepAccent, { iconBg: string; label: string; btn: string; outline: string }> = {
  emerald: {
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    label: 'text-emerald-600 dark:text-emerald-400',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500',
    outline: 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10',
  },
  fuchsia: {
    iconBg: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-400',
    label: 'text-fuchsia-600 dark:text-fuchsia-400',
    btn: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white dark:bg-fuchsia-600 dark:hover:bg-fuchsia-500',
    outline: 'border border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-50 dark:border-fuchsia-500/30 dark:text-fuchsia-400 dark:hover:bg-fuchsia-500/10',
  },
  indigo: {
    iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
    label: 'text-indigo-600 dark:text-indigo-400',
    btn: 'bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500',
    outline: 'border border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-400 dark:hover:bg-indigo-500/10',
  },
  violet: {
    iconBg: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
    label: 'text-violet-600 dark:text-violet-400',
    btn: 'bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-600 dark:hover:bg-violet-500',
    outline: 'border border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-500/30 dark:text-violet-400 dark:hover:bg-violet-500/10',
  },
  amber: {
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    label: 'text-amber-600 dark:text-amber-400',
    btn: 'bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-500 dark:hover:bg-amber-400',
    outline: 'border border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-400 dark:hover:bg-amber-500/10',
  },
};

export default function SetupStepCard({
  step,
  icon,
  accent,
  title,
  description,
  done,
  current = false,
  actions,
  locked = false,
  lockedHint,
  doneHint,
  doneAction,
  children,
}: SetupStepCardProps) {
  const accentStyles = ACCENTS[accent];
  const blocked = locked && !done;

  return (
    <div
      className={`relative flex gap-4 rounded-lg border bg-white p-4 shadow-xs transition-all dark:bg-slate-800 dark:shadow-none sm:p-5 ${
        done
          ? 'border-emerald-200 dark:border-emerald-500/30'
          : current
            ? 'border-indigo-300 ring-2 ring-indigo-500/15 dark:border-indigo-500/50 dark:ring-indigo-400/15'
            : 'border-slate-200 dark:border-slate-700'
      } ${blocked ? 'opacity-75' : ''}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 ${
          done ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' : accentStyles.iconBg
        }`}
      >
        {done ? <CheckCircle2 size={22} /> : icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`text-xs font-semibold uppercase tracking-wider ${done ? 'text-emerald-600 dark:text-emerald-400' : accentStyles.label}`}>
            Passo {step}
          </span>
          {done && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={12} /> Concluído
            </span>
          )}
          {!done && current && !blocked && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
              Próximo passo
            </span>
          )}
        </div>
        <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{done && doneHint ? doneHint : description}</p>

        {children && <div className="mt-3">{children}</div>}

        {blocked && lockedHint && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Lock size={12} /> {lockedHint}
          </p>
        )}

        {done ? (
          doneAction && (
            <button
              type="button"
              onClick={doneAction.onClick}
              className="mt-3 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
            >
              {doneAction.label} <ArrowRight size={12} />
            </button>
          )
        ) : (
          actions.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
              {actions.map((action) => {
                const actionAccent = ACCENTS[action.accent ?? accent];
                const disabled = blocked || action.loading === true;
                return (
                  <div key={action.label} className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={action.onClick}
                      disabled={disabled}
                      className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all sm:w-auto ${
                        blocked
                          ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                          : `${action.outline ? `bg-white dark:bg-slate-800 ${actionAccent.outline}` : actionAccent.btn} hover:scale-105 active:scale-95 disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100`
                      }`}
                    >
                      {action.loading ? <Loader2 size={16} className="animate-spin" /> : action.icon ?? <ArrowRight size={16} />}
                      {action.label}
                    </button>
                    {action.hint && !blocked && (
                      <span className="text-center text-xs text-slate-500 dark:text-slate-400 sm:text-left">{action.hint}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
