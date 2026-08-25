'use client';
import type { ReactNode } from 'react';

interface AISectionHeaderProps {
    title: string;
    hint?: string | undefined;
    /** Ação à direita do título — botão, contador, link. */
    action?: ReactNode;
}

/** Cabeçalho de card das seções da IA. Mesma escala tipográfica de Agendamentos. */
export default function AISectionHeader({ title, hint, action }: AISectionHeaderProps) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        {hint && <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-auto">{action}</div>}
    </div>
  );
}
