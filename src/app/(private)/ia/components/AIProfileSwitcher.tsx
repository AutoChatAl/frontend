'use client';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import type { AiProfile } from '@/types/AI';

interface AIProfileSwitcherProps {
    profiles: AiProfile[];
    activeProfileId: string | null;
    maxProfiles: number;
    busy?: boolean;
    onSelect: (profileId: string) => void;
    onCreate: () => void;
    onRename: (profileId: string, name: string) => void;
    onDelete: (profileId: string) => void;
}

/**
 * Régua de perfis logo abaixo da navegação: cada quadrado é uma configuração de IA
 * completa e independente (identidade, regras, agendamento e canais). Fica colada na
 * nav porque trocar de perfil troca o conteúdo de todas as abas ao lado.
 */
export default function AIProfileSwitcher({
  profiles,
  activeProfileId,
  maxProfiles,
  busy = false,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: AIProfileSwitcherProps) {
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const active = profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];
  const limitReached = profiles.length >= maxProfiles;
  useEffect(() => {
    setRenaming(false);
  }, [activeProfileId]);
  useEffect(() => {
    if (renaming)
      inputRef.current?.focus();
  }, [renaming]);
  if (profiles.length === 0) {
    return null;
  }
  const startRename = () => {
    setDraftName(active?.customName || active?.name || '');
    setRenaming(true);
  };
  const commitRename = () => {
    const trimmed = draftName.trim();
    setRenaming(false);
    // Nome vazio volta o rótulo para "Perfil N", então também é uma renomeação válida.
    if (active && trimmed !== active.customName) {
      onRename(active.id, trimmed);
    }
  };
  return (
    <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700">
      <p className="mb-2 px-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
        Perfis de IA
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        {profiles.map((profile) => {
          const isActive = profile.id === active?.id;
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => onSelect(profile.id)}
              disabled={busy}
              aria-current={isActive ? 'true' : undefined}
              title={`${profile.name}${profile.activeChannelIds.length > 0 ? ` · ${profile.activeChannelIds.length} canal(is)` : ''}`}
              className={`relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border text-[13px] font-semibold tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                isActive
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50'
              }`}
            >
              {profile.order}
              {profile.enabled && (
                <span
                  aria-hidden
                  className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800"
                />
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onCreate}
          disabled={busy || limitReached}
          title={limitReached
            ? `Seu plano de IA permite ${maxProfiles} ${maxProfiles === 1 ? 'perfil' : 'perfis'}. Exclua um perfil ou faça upgrade para criar outro.`
            : 'Adicionar perfil'}
          aria-label="Adicionar perfil de IA"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-500 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:bg-transparent disabled:hover:text-slate-500 dark:border-slate-600 dark:text-slate-400 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
        >
          <Plus size={16}/>
        </button>
      </div>

      {active && (
        <div className="mt-2 px-1">
          {renaming ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                value={draftName}
                maxLength={40}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter')
                    commitRename();
                  if (e.key === 'Escape')
                    setRenaming(false);
                }}
                placeholder={`Perfil ${active.order}`}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={commitRename}
                aria-label="Salvar nome do perfil"
                className="cursor-pointer rounded-md p-1 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
              >
                <Check size={14}/>
              </button>
              <button
                type="button"
                onClick={() => setRenaming(false)}
                aria-label="Cancelar"
                className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
              >
                <X size={14}/>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                {active.name}
              </p>
              <button
                type="button"
                onClick={startRename}
                disabled={busy}
                aria-label="Renomear perfil"
                className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-700/50 dark:hover:text-slate-200"
              >
                <Pencil size={13}/>
              </button>
              {profiles.length > 1 && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy}
                  aria-label="Excluir perfil"
                  className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                >
                  <Trash2 size={13}/>
                </button>
              )}
            </div>
          )}
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
            {active.activeChannelIds.length === 0
              ? 'Nenhum canal atendido por este perfil'
              : `${active.activeChannelIds.length} ${active.activeChannelIds.length === 1 ? 'canal atendido' : 'canais atendidos'}`}
          </p>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (active)
            onDelete(active.id);
        }}
        title="Excluir perfil de IA"
        message={`As configurações de "${active?.name ?? ''}" serão apagadas e os canais dele voltam a ser atendidos só por você. Os produtos cadastrados neste perfil passam para o primeiro perfil. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir perfil"
        loading={busy}
      />
    </div>
  );
}
