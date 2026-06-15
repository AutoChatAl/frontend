'use client';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

import Button from '@/components/Button';
import Modal from '@/components/Modal';
import type { StageColor } from '@/types/Funnel';

import { STAGE_COLOR_META, STAGE_COLOR_OPTIONS } from './meta';

interface StageModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialName?: string;
  initialColor?: StageColor;
  loading: boolean;
  onClose: () => void;
  onSubmit: (name: string, color: StageColor) => void;
}

export default function StageModal({
  isOpen,
  mode,
  initialName = '',
  initialColor = 'indigo',
  loading,
  onClose,
  onSubmit,
}: StageModalProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<StageColor>(initialColor);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setColor(initialColor);
      setError('');
    }
  }, [isOpen, initialName, initialColor]);

  const handleSubmit = () => {
    if (name.trim().length < 2) {
      setError('O nome deve ter ao menos 2 caracteres.');
      return;
    }
    onSubmit(name.trim(), color);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create' ? 'Nova etapa' : 'Renomear etapa'} size="sm">
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
