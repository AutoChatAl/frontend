'use client';

import { FileText } from 'lucide-react';

import Card from '@/components/Card';
import type { AiTriggerSettings } from '@/types/AI';

import AIRuleToggle from './AIRuleToggle';

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

export default function AIRulesSection({
  customRules,
  triggerSettings,
  onCustomRulesChange,
  onToggleTrigger,
}: AIRulesSectionProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
        <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
        Gatilhos e Regras
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Ative gatilhos prontos para comportamentos comuns da IA. Todos começam desativados por padrão.
      </p>

      <div className="mb-3">
        {triggerOptions.map((trigger) => (
          <AIRuleToggle
            key={trigger.key}
            title={trigger.title}
            description={trigger.description}
            enabled={triggerSettings[trigger.key]}
            onToggle={() => onToggleTrigger(trigger.key)}
          />
        ))}
      </div>

      <div className="mb-4 border-t border-slate-200 dark:border-slate-700 pt-4">
        <p className="text-sm font-semibold text-slate-800 dark:text-white">
        Regras personalizadas adicionais
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Escreva regras específicas para o comportamento da IA que não estejam cobertas pelos gatilhos acima. Use uma regra por linha.
        </p>
      </div>

      <textarea
        rows={6}
        value={customRules}
        onChange={(e) => onCustomRulesChange(e.target.value)}
        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
        placeholder="Ex: Sempre responda em português. Não ofereça descontos sem aprovação. Encaminhe reclamações para o suporte humano..."
      />
    </Card>
  );
}
