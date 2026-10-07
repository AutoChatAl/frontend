'use client';
import { ArrowRight, Loader2, Plus } from 'lucide-react';

import { FLOW_TEMPLATES, type FlowTemplate } from './templates';

interface FlowTemplatePickerProps {
  onPick: (template: FlowTemplate) => void;
  onBlank: () => void;
  busyId?: string | null;
  className?: string;
}

const CARD = 'group flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60';

export default function FlowTemplatePicker({ onPick, onBlank, busyId = null, className = '' }: FlowTemplatePickerProps) {
  const busy = busyId !== null;
  return (
    <div className={`grid gap-2 sm:grid-cols-2 ${className}`}>
      {FLOW_TEMPLATES.map((template) => {
        const Icon = template.icon;
        return (
          <button
            key={template.id}
            type="button"
            disabled={busy}
            onClick={() => onPick(template)}
            className={`${CARD} border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              {busyId === template.id ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-900 dark:text-white">{template.name}</span>
              <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">{template.description}</span>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                Usar este modelo
                <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </span>
          </button>
        );
      })}
      <button
        type="button"
        disabled={busy}
        onClick={onBlank}
        className={`${CARD} border-dashed border-slate-300 bg-transparent hover:border-indigo-400 dark:border-slate-600 dark:hover:border-indigo-500/50 sm:col-span-2`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400">
          {busyId === 'blank' ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900 dark:text-white">Começar do zero</span>
          <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">
            Um quadro em branco para montar o fluxo bloco a bloco.
          </span>
        </span>
      </button>
    </div>
  );
}
