'use client';

import Card from '@/components/Card';
import Textarea from '@/components/Textarea';
import { useSubscription } from '@/contexts/SubscriptionContext';
import type { AiTriggerSettings } from '@/types/AI';
import { LOCKED_FEATURES } from '@lib/featureFlags';

import AINote from './AINote';
import AISectionHeader from './AISectionHeader';
import AIToggleRow from './AIToggleRow';

interface AIRulesSectionProps {
    customRules: string;
    triggerSettings: AiTriggerSettings;
    onCustomRulesChange: (value: string) => void;
    onToggleTrigger: (triggerKey: keyof AiTriggerSettings) => void;
}
const triggerOptions: Array<{
    key: keyof AiTriggerSettings;
    title: string;
    description: string;
}> = [
  {
    key: 'qualifyLead',
    title: 'Qualificar lead automaticamente',
    description: 'Faz perguntas curtas de necessidade e prazo antes da recomendação.',
  },
  {
    key: 'prioritizeScheduling',
    title: 'Priorizar convite para agendamento',
    description: 'Quando houver intenção clara, a IA puxa para o próximo passo de agenda.',
  },
  {
    key: 'recoveryAfterNoReply',
    title: 'Retomar conversa sem resposta',
    description: 'Envia retomada curta quando o cliente some no meio do atendimento.',
  },
  {
    key: 'detectUrgency',
    title: 'Responder com urgência',
    description: 'Prioriza acolhimento e orientação direta em mensagens urgentes.',
  },
];
export default function AIRulesSection({ customRules, triggerSettings, onCustomRulesChange, onToggleTrigger }: AIRulesSectionProps) {
  const { status } = useSubscription();
  const maxChars = status?.limits?.maxCustomRulesChars ?? 0;
  const overLimit = maxChars > 0 && customRules.length > maxChars;
  const locked = LOCKED_FEATURES.iaTriggers;
  return (
    <div className="space-y-3">
      <Card className="p-4">
        <AISectionHeader
          title="Gatilhos prontos"
          hint="Comportamentos comuns já escritos para você. Todos começam desligados."
        />

        {locked && (
          <AINote tone="warning" className="mb-3">
            Os gatilhos prontos estão temporariamente indisponíveis enquanto ajustamos o comportamento deles. Use as regras
            personalizadas abaixo — elas continuam valendo normalmente.
          </AINote>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {triggerOptions.map((trigger) => (
            <AIToggleRow
              key={trigger.key}
              title={trigger.title}
              description={trigger.description}
              checked={triggerSettings[trigger.key]}
              onChange={() => onToggleTrigger(trigger.key)}
              disabled={locked}
            />
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <AISectionHeader
          title="Regras personalizadas"
          hint="Uma regra por linha. Entram no prompt exatamente como você escrever, então seja direto."
        />
        <Textarea
          rows={7}
          value={customRules}
          onChange={(e) => onCustomRulesChange(e.target.value)}
          {...(overLimit ? { error: `Passou do limite de ${maxChars.toLocaleString('pt-BR')} caracteres do seu plano — corte o texto antes de salvar.` } : {})}
          placeholder={'Sempre responda em português.\nNão ofereça descontos sem aprovação.\nEncaminhe reclamações para o suporte humano.'}
        />
        {maxChars > 0 && (
          <p className={`mt-1.5 text-right text-[11px] tabular-nums ${overLimit ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
            {customRules.length.toLocaleString('pt-BR')} / {maxChars.toLocaleString('pt-BR')}
          </p>
        )}
      </Card>
    </div>
  );
}
