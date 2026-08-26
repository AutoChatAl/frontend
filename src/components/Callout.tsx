'use client';
import type { ReactNode } from 'react';

type NoteTone = 'info' | 'warning' | 'success';

const TONES: Record<NoteTone, string> = {
  info: 'border-indigo-100 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300',
  warning: 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  success: 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
};

interface CalloutProps {
    tone?: NoteTone;
    children: ReactNode;
    className?: string;
}

/** Aviso curto abaixo de um controle: consequência de ligar, bloqueio de plano, recomendação. */
export default function Callout({ tone = 'info', children, className = '' }: CalloutProps) {
  return (
    <div className={`rounded-lg border px-2.5 py-1.5 text-xs leading-relaxed ${TONES[tone]} ${className}`}>
      {children}
    </div>
  );
}
