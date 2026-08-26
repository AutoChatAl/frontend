'use client';
import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';

import ToggleSwitch from '@/components/ToggleSwitch';

interface ToggleRowProps {
    title: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean | undefined;
    /** Motivo do bloqueio: liga o cadeado, desativa o switch e vira tooltip. */
    lockReason?: string | undefined;
    badge?: ReactNode;
    /** Avisos que só fazem sentido no estado atual do toggle. */
    children?: ReactNode;
}

/**
 * Linha de toggle rotulada com switch à direita. Nasceu de três versões
 * escritas à mão que divergiram no tamanho do switch e no espaçamento. Feita
 * para viver dentro de uma lista `divide-y`.
 */
export default function ToggleRow({ title, description, checked, onChange, disabled, lockReason, badge, children }: ToggleRowProps) {
  const locked = Boolean(lockReason);
  const isDisabled = Boolean(disabled) || locked;
  return (
    <div className={`py-3 first:pt-0 last:pb-0 ${disabled && !locked ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        {/* Trava a medida do texto: numa tela larga a descrição corria 1400px até o switch. */}
        <div className="min-w-0 max-w-2xl">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{title}</p>
            {locked && <Lock size={12} className="shrink-0 text-amber-500"/>}
            {badge}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <div className="shrink-0 pt-0.5" {...(lockReason ? { title: lockReason } : {})}>
          <ToggleSwitch checked={checked} onChange={onChange} disabled={isDisabled} ariaLabel={title}/>
        </div>
      </div>
      {children && <div className="mt-2 space-y-1.5">{children}</div>}
    </div>
  );
}
