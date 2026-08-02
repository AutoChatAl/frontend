'use client';
import { Check, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import Button from '@/components/Button';
import Modal from '@/components/Modal';
import type { StageColor } from '@/types/Funnel';

import { STAGE_COLOR_META, STAGE_COLOR_OPTIONS } from './meta';

const AI_CRITERIA_MAX_LENGTH = 300;

interface StageModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialName?: string;
  initialColor?: StageColor;
  initialAiCriteria?: string;
  loading: boolean;
  onClose: () => void;
  onSubmit: (name: string, color: StageColor, aiCriteria: string) => void;
}

export default function StageModal({
  isOpen,
  mode,
  initialName = '',
  initialColor = 'indigo',
  initialAiCriteria = '',
  loading,
  onClose,
  onSubmit,
}: StageModalProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<StageColor>(initialColor);
  const [aiCriteria, setAiCriteria] = useState(initialAiCriteria);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setColor(initialColor);
      setAiCriteria(initialAiCriteria);
      setError('');
    }
  }, [isOpen, initialName, initialColor, initialAiCriteria]);

  const handleSubmit = () => {
    if (name.trim().length < 2) {
      setError('O nome deve ter ao menos 2 caracteres.');
      return;
    }
    onSubmit(name.trim(), color, aiCriteria.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create' ? 'Nova etapa' : 'Editar etapa'} size="sm">
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="stage-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Nome da etapa
          </label>
          <input
            id="stage-name"
            value={name}
            autoFocus
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSubmit()}
            placeholder="Ex: Proposta enviada"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cor</span>
          <div className="flex flex-wrap gap-2">
            {STAGE_COLOR_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                className={`flex h-8 w-8 items-center justify-center rounded-full ${STAGE_COLOR_META[option].dot} transition-transform hover:scale-110 ${color === option ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-800' : ''}`}
              >
                {color === option && <Check size={14} className="text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="stage-ai-criteria" className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Sparkles size={14} className="text-indigo-500 dark:text-indigo-400" />
            Critério para a IA
            <span className="font-normal text-slate-400 dark:text-slate-500">(opcional)</span>
          </label>
          <textarea
            id="stage-ai-criteria"
            value={aiCriteria}
            rows={3}
            maxLength={AI_CRITERIA_MAX_LENGTH}
            onChange={(event) => setAiCriteria(event.target.value)}
            placeholder="Ex: cliente pediu orçamento ou perguntou sobre formas de pagamento"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
          />
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Descreva quando um lead deve entrar nesta etapa. A IA usa este texto para mover o lead automaticamente.
            </p>
            <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
              {aiCriteria.length}/{AI_CRITERIA_MAX_LENGTH}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading} loadingText="Salvando...">
            {mode === 'create' ? 'Criar etapa' : 'Salvar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
