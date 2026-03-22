'use client';

import { FileText } from 'lucide-react';

import Card from '@/components/Card';

interface AIRulesSectionProps {
  customRules: string;
  onCustomRulesChange: (value: string) => void;
}

export default function AIRulesSection({ customRules, onCustomRulesChange }: AIRulesSectionProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
        <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
        Regras Personalizadas
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Adicione instruções extras para guiar o comportamento da IA. Exemplo: &quot;Nunca ofereça desconto&quot;, &quot;Sempre pergunte o nome do cliente&quot;.
      </p>
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
