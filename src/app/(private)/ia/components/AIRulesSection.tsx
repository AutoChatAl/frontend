'use client';

import AIRuleToggle from './AIRuleToggle';

import Card from '@/components/Card';
import type { AIRule } from '@/types/AI';

interface AIRulesSectionProps {
  rules: AIRule[];
  onToggleRule: (id: string) => void;
}

export default function AIRulesSection({ rules, onToggleRule }: AIRulesSectionProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Regras de Ativação</h3>
      <div className="space-y-4">
        {rules.map((rule) => (
          <AIRuleToggle
            key={rule.id}
            title={rule.title}
            description={rule.description}
            enabled={rule.enabled}
            onToggle={() => onToggleRule(rule.id)}
          />
        ))}
      </div>
    </Card>
  );
}
