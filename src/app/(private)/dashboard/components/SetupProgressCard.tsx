'use client';
import { ArrowRight, CheckCircle2, Circle, Rocket } from 'lucide-react';
import Link from 'next/link';

import { useSetupProgress } from '@/app/get-started/hooks/useSetupProgress';
import type { SetupStepId } from '@/app/get-started/setupSteps';
import Card from '@/components/Card';

const SHORT_TITLES: Record<SetupStepId, string> = {
  channel: 'Conectar um canal',
  ai: 'Contar para a IA sobre o negócio',
  'ai-test': 'Testar a IA',
  recipe: 'Ativar a primeira automação',
};

export default function SetupProgressCard() {
  const { loading, done, steps, completedCount, total, nextStep } = useSetupProgress();

  if (loading || !nextStep) return null;

  const percent = Math.round((completedCount / total) * 100);
  const remaining = total - completedCount;

  return (
    <Card className="relative overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <Rocket size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Primeiros passos {completedCount} de {total}
            </p>
            <h2 className="mt-0.5 text-base font-semibold text-slate-900 dark:text-white">
              Próximo: {SHORT_TITLES[nextStep]}
            </h2>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
              {remaining === 1 ? 'Falta 1 passo' : `Faltam ${remaining} passos`} para o Synq atender e vender por você.
            </p>
          </div>
        </div>
        <Link
          href="/get-started"
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-all hover:scale-105 hover:bg-indigo-700 active:scale-95 dark:shadow-none sm:w-auto"
        >
          Continuar <ArrowRight size={16} />
        </Link>
      </div>

      <div
        className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60"
        role="progressbar"
        aria-valuenow={completedCount}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Progresso dos primeiros passos"
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol className={`mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2 ${steps.length > 2 ? 'lg:grid-cols-4' : ''}`}>
        {steps.map((step) => (
          <li
            key={step}
            className={`flex min-w-0 items-center gap-1.5 text-xs ${
              done[step]
                ? 'text-slate-400 line-through dark:text-slate-500'
                : step === nextStep
                  ? 'font-medium text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {done[step] ? (
              <CheckCircle2 size={14} className="shrink-0 text-emerald-500 dark:text-emerald-400" />
            ) : (
              <Circle size={14} className={`shrink-0 ${step === nextStep ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`} />
            )}
            <span className="truncate">{SHORT_TITLES[step]}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
