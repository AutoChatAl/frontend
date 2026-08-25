'use client';
import { AlertTriangle, Check } from 'lucide-react';
import Link from 'next/link';

import Badge from '@/components/Badge';
import Card from '@/components/Card';
import type { FunnelStageDefinition } from '@/types/Funnel';

import AINote from './AINote';
import AISectionHeader from './AISectionHeader';
import AIToggleRow from './AIToggleRow';

interface AIFunnelSectionProps {
    funnelAutoMoveEnabled: boolean;
    stages: FunnelStageDefinition[];
    onToggle: (enabled: boolean) => void;
}
export default function AIFunnelSection({ funnelAutoMoveEnabled, stages, onToggle }: AIFunnelSectionProps) {
  const withoutCriteria = stages.filter((stage) => !stage.aiCriteria.trim());
  return (
    <div className="space-y-3">
      <Card className="p-4">
        <AISectionHeader
          title="Movimentação do funil pela IA"
          hint="A cada mensagem recebida, a IA lê a conversa e avança o lead para a etapa que bate com o critério da etapa."
        />
        <AIToggleRow
          title="Mover leads automaticamente"
          description="O lead nunca volta para uma etapa anterior de forma automática — a IA só avança."
          checked={funnelAutoMoveEnabled}
          onChange={onToggle}
          badge={<Badge type="beta" text="BETA" pill/>}
        >
        </AIToggleRow>
      </Card>

      {stages.length > 0 && (
        <Card className="p-4">
          <AISectionHeader
            title="Critérios por etapa"
            hint="É o critério que ensina a IA quando mover o lead. A edição fica na tela do funil."
            action={
              <Link href="/funnel" className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                Abrir funil
              </Link>
            }
          />

          {withoutCriteria.length > 0 && (
            <AINote tone="warning" className="mb-3">
              {withoutCriteria.length === 1
                ? `A etapa "${withoutCriteria[0]?.name}" não tem critério definido. Sem ele, a IA adivinha pelo nome da etapa e a precisão cai.`
                : `${withoutCriteria.length} etapas não têm critério definido. Sem ele, a IA adivinha pelo nome da etapa e a precisão cai.`}
            </AINote>
          )}

          <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {stages.map((stage) => {
              const hasCriteria = Boolean(stage.aiCriteria.trim());
              return (
                <li key={stage.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
                  <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    hasCriteria
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                  }`}>
                    {hasCriteria ? <Check size={10}/> : <AlertTriangle size={10}/>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{stage.name}</p>
                    <p className={`mt-0.5 text-xs leading-relaxed ${hasCriteria ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 italic dark:text-slate-500'}`}>
                      {hasCriteria ? stage.aiCriteria : 'Sem critério definido'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
