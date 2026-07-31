'use client';
import { AlertTriangle, ArrowRight, Check, Trello } from 'lucide-react';
import Link from 'next/link';

import Badge from '@/components/Badge';
import type { FunnelStageDefinition } from '@/types/Funnel';

interface AIFunnelSectionProps {
    funnelAutoMoveEnabled: boolean;
    stages: FunnelStageDefinition[];
    onToggle: (enabled: boolean) => void;
}
export default function AIFunnelSection({ funnelAutoMoveEnabled, stages, onToggle }: AIFunnelSectionProps) {
  const withoutCriteria = stages.filter((stage) => !stage.aiCriteria.trim());
  return (<div className="space-y-6">
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-2">
        <Trello size={20} className="text-indigo-600 dark:text-indigo-400"/>
        <h3 className="text-base font-bold text-slate-800 dark:text-white">Movimentação do funil por IA</h3>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Permita que a IA mova os leads entre as etapas do funil automaticamente, conforme os critérios que você define em cada etapa.
      </p>

      <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 mt-0.5">
          <ArrowRight size={20} className="text-indigo-600 dark:text-indigo-400"/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mover leads automaticamente</h4>
              <Badge type="beta" text="BETA" pill/>
            </div>
            <button
              onClick={() => onToggle(!funnelAutoMoveEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${funnelAutoMoveEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform" style={{ transform: funnelAutoMoveEnabled ? 'translateX(22px)' : 'translateX(0)' }}/>
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              A cada mensagem recebida, a IA analisa a conversa e avança o lead para a etapa que combina com o critério definido. O lead nunca volta para uma etapa anterior de forma automática.
          </p>
          {funnelAutoMoveEnabled && (<div className="mt-3 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-900/20">
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
                Movimentações feitas pela IA aparecem no funil com o motivo da mudança. Etapas de ganho e perda exigem confirmação ou recusa explícita do cliente.
            </p>
          </div>)}
        </div>
      </div>
    </div>

    {stages.length > 0 && (<div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Critérios por etapa</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              É o critério que ensina a IA quando mover o lead. Edite cada etapa na tela do funil.
          </p>
        </div>
        <Link href="/funnel" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
            Abrir funil
        </Link>
      </div>

      {withoutCriteria.length > 0 && (<div className="flex items-start gap-2 mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5"/>
        <p className="text-xs text-amber-700 dark:text-amber-300">
          {withoutCriteria.length === 1
            ? `A etapa "${withoutCriteria[0]?.name}" não tem critério definido. Sem ele, a IA precisa adivinhar pelo nome da etapa e a precisão cai.`
            : `${withoutCriteria.length} etapas não têm critério definido. Sem ele, a IA precisa adivinhar pelo nome da etapa e a precisão cai.`}
        </p>
      </div>)}

      <ul className="space-y-2">
        {stages.map((stage) => {
          const hasCriteria = Boolean(stage.aiCriteria.trim());
          return (<li key={stage.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${hasCriteria ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-200 dark:bg-slate-600'}`}>
              {hasCriteria
                ? <Check size={12} className="text-emerald-600 dark:text-emerald-400"/>
                : <AlertTriangle size={12} className="text-slate-500 dark:text-slate-400"/>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{stage.name}</p>
              <p className={`text-xs mt-0.5 leading-relaxed ${hasCriteria ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500 italic'}`}>
                {hasCriteria ? stage.aiCriteria : 'Sem critério definido'}
              </p>
            </div>
          </li>);
        })}
      </ul>
    </div>)}
  </div>);
}
