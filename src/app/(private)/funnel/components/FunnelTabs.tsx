'use client';
import { Settings2 } from 'lucide-react';

import type { Funnel } from '@/types/Funnel';

interface FunnelTabsProps {
  funnels: Funnel[];
  activeId: string;
  onSelect: (funnelId: string) => void;
  onConfigure: (funnel: Funnel) => void;
}

/**
 * Uma aba por funil. Só aparece com dois ou mais: quem tem apenas o principal vê o
 * quadro como sempre foi.
 */
export default function FunnelTabs({ funnels, activeId, onSelect, onConfigure }: FunnelTabsProps) {
  const active = funnels.find((funnel) => funnel.id === activeId) ?? null;
  return (
    <div className="flex items-end gap-2 border-b border-slate-200 dark:border-slate-700">
      <div role="tablist" aria-label="Funis" className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto">
        {funnels.map((funnel) => {
          const selected = funnel.id === activeId;
          return (
            <button
              key={funnel.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onSelect(funnel.id)}
              className={`shrink-0 cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                selected
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {funnel.name}
            </button>
          );
        })}
      </div>
      {active && (
        <button
          type="button"
          onClick={() => onConfigure(active)}
          className="mb-1.5 flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200"
        >
          <Settings2 size={14} />
          Configurar funil
        </button>
      )}
    </div>
  );
}
