import type { ReactNode } from 'react';

type StepTone = 'emerald' | 'fuchsia';

const TONES: Record<StepTone, string> = {
  emerald: 'bg-emerald-500 dark:bg-emerald-600',
  fuchsia: 'bg-fuchsia-500 dark:bg-fuchsia-600',
};

interface ConnectStepListProps {
    steps: ReactNode[];
    tone?: StepTone;
}

export function StepHighlight({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-slate-900 dark:text-white">{children}</span>;
}

export default function ConnectStepList({ steps, tone = 'emerald' }: ConnectStepListProps) {
  return (<ol className="space-y-2.5">
    {steps.map((step, index) => (<li key={index} className="flex items-start gap-3">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${TONES[tone]}`} aria-hidden>
        {index + 1}
      </span>
      <p className="pt-0.5 text-sm text-slate-600 dark:text-slate-300">{step}</p>
    </li>))}
  </ol>);
}
