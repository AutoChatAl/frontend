'use client';
import { useEffect, useMemo, useState } from 'react';

import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Checkbox from '@/components/Checkbox';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import Select from '@/components/Select';
import ToggleRow from '@/components/ToggleRow';
import type {
  CreateFunnelPayload,
  Funnel,
  FunnelStartingStages,
  LeadSourceChannel,
  UpdateFunnelPayload,
} from '@/types/Funnel';

import { SOURCE_CHANNEL_META, formatIdentifier } from './meta';

const NAME_MAX_LENGTH = 40;

const STARTING_STAGE_OPTIONS: { value: FunnelStartingStages; label: string; description: string }[] = [
  {
    value: 'POST_SALES',
    label: 'Pós-venda',
    description: 'Contrato fechado, documentos, andamento e conclusão.',
  },
  {
    value: 'SALES',
    label: 'Vendas',
    description: 'Novo lead, em contato, qualificado, negociação, ganho e perdido.',
  },
  {
    value: 'COPY',
    label: 'Copiar de outro funil',
    description: 'As mesmas colunas de um funil que você já tem.',
  },
  {
    value: 'BLANK',
    label: 'Em branco',
    description: 'Uma coluna de entrada; você monta o resto.',
  },
];

interface FunnelModalProps {
  isOpen: boolean;
  /** Nulo cria um funil novo. */
  funnel: Funnel | null;
  funnels: Funnel[];
  channels: LeadSourceChannel[];
  loading: boolean;
  onClose: () => void;
  onCreate: (payload: CreateFunnelPayload) => void;
  onUpdate: (funnelId: string, payload: UpdateFunnelPayload) => void;
  onDelete: (funnel: Funnel) => void;
}

function channelLabel(channel: LeadSourceChannel): string {
  return channel.name || formatIdentifier(channel.identifier) || SOURCE_CHANNEL_META[channel.type].label;
}

export default function FunnelModal({
  isOpen,
  funnel,
  funnels,
  channels,
  loading,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: FunnelModalProps) {
  const editing = funnel !== null;
  const isMain = funnel?.isMain ?? false;
  const mainFunnel = funnels.find((item) => item.isMain) ?? null;

  const [name, setName] = useState('');
  const [channelIds, setChannelIds] = useState<string[]>([]);
  const [aiAutoMove, setAiAutoMove] = useState(false);
  const [template, setTemplate] = useState<FunnelStartingStages>('POST_SALES');
  const [copyFromFunnelId, setCopyFromFunnelId] = useState('');
  const [moveExistingContacts, setMoveExistingContacts] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName(funnel?.name ?? '');
    setChannelIds(funnel?.channelIds ?? []);
    setAiAutoMove(funnel?.aiAutoMove ?? false);
    setTemplate('POST_SALES');
    setCopyFromFunnelId(mainFunnel?.id ?? '');
    setMoveExistingContacts(false);
    setError('');
  }, [isOpen, funnel, mainFunnel?.id]);

  /** Qual funil recebe cada canal hoje — para avisar quando um canal vai trocar de funil. */
  const ownerByChannel = useMemo(() => {
    const owners = new Map<string, Funnel>();
    for (const item of funnels) {
      if (item.isMain) continue;
      for (const channelId of item.channelIds) owners.set(channelId, item);
    }
    return owners;
  }, [funnels]);

  const addedChannelIds = useMemo(() => {
    const previous = new Set(funnel?.channelIds ?? []);
    return channelIds.filter((channelId) => !previous.has(channelId));
  }, [channelIds, funnel]);

  const toggleChannel = (channelId: string, checked: boolean) => {
    setChannelIds((prev) => (checked ? [...prev, channelId] : prev.filter((item) => item !== channelId)));
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('O nome deve ter ao menos 2 caracteres.');
      return;
    }
    const bringContacts = moveExistingContacts && addedChannelIds.length > 0;
    if (!editing) {
      onCreate({
        name: trimmed,
        channelIds,
        aiAutoMove,
        template,
        ...(template === 'COPY' && copyFromFunnelId ? { copyFromFunnelId } : {}),
        moveExistingContacts: bringContacts,
      });
      return;
    }
    onUpdate(funnel.id, {
      name: trimmed,
      aiAutoMove,
      ...(isMain ? {} : { channelIds, moveExistingContacts: bringContacts }),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Configurar funil' : 'Novo funil'} size="md">
      <div className="space-y-5">
        <Input
          label="Nome do funil"
          value={name}
          autoFocus
          maxLength={NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex: Pós-venda"
          error={error || undefined}
        />

        {!editing && (
          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Colunas iniciais</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Colunas iniciais do funil">
              {STARTING_STAGE_OPTIONS.map((option) => {
                const selected = template === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTemplate(option.value)}
                    className={`cursor-pointer rounded-lg border p-2.5 text-left transition-colors ${selected
                      ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500/60 dark:bg-indigo-500/10'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'}`}
                  >
                    <span className={`block text-[13px] font-medium ${selected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
            {template === 'COPY' && (
              <Select
                value={copyFromFunnelId}
                onChange={setCopyFromFunnelId}
                options={funnels.map((item) => ({ value: item.id, label: item.name }))}
              />
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dá para renomear, reordenar e criar colunas depois, como no funil de hoje.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Canais que alimentam este funil</span>
          {isMain ? (
            <Callout>
              O funil principal recebe todos os canais que não estão em outro funil. Para tirar um canal daqui,
              vincule-o a outro funil.
            </Callout>
          ) : channels.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nenhum canal conectado ainda. Você pode criar o funil agora e vincular os canais depois.
            </p>
          ) : (
            <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              {channels.map((channel) => {
                const meta = SOURCE_CHANNEL_META[channel.type];
                const Icon = meta.icon;
                const owner = ownerByChannel.get(channel.id);
                const movesFrom = owner && owner.id !== funnel?.id ? owner : null;
                const identifier = formatIdentifier(channel.identifier);
                const details = [meta.label, identifier && identifier !== channelLabel(channel) ? identifier : null]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <Checkbox
                    key={channel.id}
                    checked={channelIds.includes(channel.id)}
                    onChange={(checked) => toggleChannel(channel.id, checked)}
                    label={
                      <span className="flex items-center gap-1.5">
                        <Icon size={14} className={`shrink-0 ${meta.className}`} />
                        {channelLabel(channel)}
                      </span>
                    }
                    description={movesFrom ? `${details} · hoje alimenta o funil "${movesFrom.name}" e passa para este` : details}
                  />
                );
              })}
            </div>
          )}
          {!isMain && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Os contatos desses canais entram na primeira coluna deste funil. Só fica no principal quem a equipe ou a
              IA já tinha colocado numa coluna de lá. Canal sem funil cai no principal.
            </p>
          )}
          {!isMain && addedChannelIds.length > 0 && (
            <Checkbox
              checked={moveExistingContacts}
              onChange={setMoveExistingContacts}
              label="Trazer agora todos que já conversaram por esses canais"
              description="Inclui quem já está numa coluna de outro funil. Todos entram na primeira coluna deste funil."
            />
          )}
        </div>

        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <ToggleRow
            title="A IA pode mover os cards deste funil"
            description="Vale para conversas nos canais com IA ativa. Ela só avança o lead entre as colunas deste funil."
            checked={aiAutoMove}
            onChange={setAiAutoMove}
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
          <div>
            {editing && !isMain && (
              <Button variant="danger" onClick={() => onDelete(funnel)} disabled={loading}>
                Excluir funil
              </Button>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={loading} loadingText="Salvando...">
              {editing ? 'Salvar' : 'Criar funil'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
