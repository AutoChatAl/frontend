'use client';

import { Plus, Trash2 } from 'lucide-react';

import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import Textarea from '@/components/Textarea';
import ToggleSwitch from '@/components/ToggleSwitch';
import type { RecoveryStep } from '@/types/CartRecovery';

import { formatDelay, MESSAGE_VARIABLES } from './platformGuides';

const MAX_STEPS = 10;
const MAX_DELAY_MINUTES = 43200;

interface RecoveryStepsEditorProps {
  steps: RecoveryStep[];
  onChange: (steps: RecoveryStep[]) => void;
  newStepTemplate: string;
}

export function MessageVariablesHint() {
  return (
    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
      Você pode usar estes campos, que trocamos pelos dados do cliente:{' '}
      {MESSAGE_VARIABLES.map((variable) => (
        <code key={variable} className="mr-1 rounded bg-slate-100 px-1 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
          {variable}
        </code>
      ))}
    </p>
  );
}

export default function RecoveryStepsEditor({ steps, onChange, newStepTemplate }: RecoveryStepsEditorProps) {
  const handleAdd = () => {
    if (steps.length >= MAX_STEPS) return;
    const last = steps[steps.length - 1];
    onChange([
      ...steps,
      {
        delayMinutes: last ? Math.min(last.delayMinutes * 2, MAX_DELAY_MINUTES) : 30,
        messageTemplate: newStepTemplate,
        enabled: true,
      },
    ]);
  };

  const handleUpdate = (index: number, patch: Partial<RecoveryStep>) => {
    onChange(steps.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  };

  const handleRemove = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div
          key={index}
          className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white dark:bg-indigo-500">
                {index + 1}
              </span>
              <span>Enviar depois de</span>
              <input
                type="number"
                min={1}
                max={MAX_DELAY_MINUTES}
                value={step.delayMinutes}
                aria-label={`Minutos de espera da mensagem ${index + 1}`}
                onChange={(e) => handleUpdate(index, { delayMinutes: Math.max(1, Number(e.target.value) || 1) })}
                className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <span>minutos</span>
              <span className="text-slate-400 dark:text-slate-500">({formatDelay(step.delayMinutes)})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">{step.enabled !== false ? 'Ligada' : 'Desligada'}</span>
              <ToggleSwitch
                checked={step.enabled !== false}
                onChange={(checked) => handleUpdate(index, { enabled: checked })}
                ariaLabel={`Ligar mensagem ${index + 1}`}
              />
              <IconButton
                icon={<Trash2 size={14} />}
                onClick={() => handleRemove(index)}
                variant="danger"
                title="Remover mensagem"
              />
            </div>
          </div>
          <Textarea
            value={step.messageTemplate}
            onChange={(e) => handleUpdate(index, { messageTemplate: e.target.value })}
            rows={3}
            maxLength={4000}
            placeholder="Mensagem que será enviada..."
            aria-label={`Texto da mensagem ${index + 1}`}
          />
        </div>
      ))}

      <Button
        variant="secondary"
        size="sm"
        icon={<Plus size={14} />}
        onClick={handleAdd}
        disabled={steps.length >= MAX_STEPS}
      >
        Adicionar mensagem
      </Button>
    </div>
  );
}
