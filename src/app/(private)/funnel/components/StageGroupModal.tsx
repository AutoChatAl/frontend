'use client';
import { useEffect, useState } from 'react';

import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { planLimitsService } from '@/services/plan-limits.service';
import type { FunnelStage } from '@/types/Funnel';

const GROUP_NAME_MAX_LENGTH = 80;

interface StageGroupModalProps {
  stage: FunnelStage;
  filtered: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

function resolveBlockedReason(stage: FunnelStage, filtered: boolean, maxContacts: number | null): string | null {
  if (filtered) return null;
  if (stage.total === 0) return 'Esta etapa ainda não tem leads.';
  if (maxContacts !== null && maxContacts !== -1 && stage.total > maxContacts) {
    return `Seu plano permite até ${maxContacts.toLocaleString('pt-BR')} contatos por grupo e esta etapa tem ${stage.total.toLocaleString('pt-BR')}.`;
  }
  return null;
}

export default function StageGroupModal({ stage, filtered, loading, onClose, onSubmit }: StageGroupModalProps) {
  const [name, setName] = useState(stage.name);
  const [error, setError] = useState('');
  const [maxContacts, setMaxContacts] = useState<number | null>(null);

  useEffect(() => {
    planLimitsService.getLimits().then((limits) => setMaxContacts(limits.maxContactsPerGroup));
  }, []);

  const blockedReason = resolveBlockedReason(stage, filtered, maxContacts);

  const handleSubmit = () => {
    if (blockedReason || loading) return;
    if (name.trim().length < 2) {
      setError('O nome deve ter ao menos 2 caracteres.');
      return;
    }
    onSubmit(name.trim());
  };

  return (
    <Modal isOpen onClose={onClose} title="Criar grupo da etapa" size="sm">
      <div className="space-y-5">
        <Input
          label="Nome do grupo"
          value={name}
          autoFocus
          maxLength={GROUP_NAME_MAX_LENGTH}
          error={error}
          onChange={(event) => {
            setName(event.target.value);
            setError('');
          }}
          onKeyDown={(event) => event.key === 'Enter' && handleSubmit()}
          placeholder="Ex: Leads em negociação"
        />

        <div className="space-y-1.5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filtered ? 'Todos os leads' : `Os ${stage.total.toLocaleString('pt-BR')} lead(s)`} da etapa{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">&quot;{stage.name}&quot;</span> entram no
            grupo{filtered ? ', inclusive os que os filtros do quadro estão escondendo' : ''}.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            O grupo é uma lista fixa: quem entrar na etapa depois não é adicionado.
          </p>
          {blockedReason && <p className="text-xs text-red-500">{blockedReason}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading} loadingText="Criando..." disabled={!!blockedReason}>
            Criar grupo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
