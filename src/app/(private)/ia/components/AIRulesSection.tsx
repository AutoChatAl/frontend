'use client';

import Callout from '@/components/Callout';
import Card from '@/components/Card';
import SectionHeader from '@/components/SectionHeader';
import Textarea from '@/components/Textarea';
import ToggleRow from '@/components/ToggleRow';
import { useSubscription } from '@/contexts/SubscriptionContext';
import type { AiTriggerSettings } from '@/types/AI';
import { LOCKED_FEATURES } from '@lib/featureFlags';

interface AIRulesSectionProps {
    customRules: string;
    triggerSettings: AiTriggerSettings;
    onCustomRulesChange: (value: string) => void;
    onToggleTrigger: (triggerKey: keyof AiTriggerSettings) => void;
    /** Limite vindo do GET /config. Tem prioridade sobre o da assinatura, que pode estar em cache. */
    maxChars?: number;
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
export default function AIRulesSection({ customRules, triggerSettings, onCustomRulesChange, onToggleTrigger, maxChars: maxCharsProp }: AIRulesSectionProps) {
  const { status } = useSubscription();
  const maxChars = maxCharsProp && maxCharsProp > 0 ? maxCharsProp : (status?.limits?.maxCustomRulesChars ?? 0);
  const overLimit = maxChars > 0 && customRules.length > maxChars;
  const remaining = maxChars - customRules.length;
  const locked = LOCKED_FEATURES.iaTriggers;
  return (
    <div className="space-y-3">
      <Card className="p-4">
        <SectionHeader
          title="Gatilhos prontos"
          hint="Comportamentos comuns já escritos para você. Todos começam desligados."
        />

        {locked && (
          <Callout tone="warning" className="mb-3">
            Os gatilhos prontos estão temporariamente indisponíveis enquanto ajustamos o comportamento deles. Use as regras
            personalizadas abaixo — elas continuam valendo normalmente.
          </Callout>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {triggerOptions.map((trigger) => (
            <ToggleRow
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
        <SectionHeader
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
          <p className={`mt-1.5 text-right text-[11px] tabular-nums ${
            overLimit
              ? 'text-red-500'
              : remaining <= maxChars * 0.1
                ? 'text-amber-500'
                : 'text-slate-400 dark:text-slate-500'
          }`}>
            {customRules.length.toLocaleString('pt-BR')} / {maxChars.toLocaleString('pt-BR')}
          </p>
        )}
      </Card>
    </div>
  );
}
