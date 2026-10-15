'use client';
import { Loader2, Lock, Settings } from 'lucide-react';

import ToggleSwitch from '@/components/ToggleSwitch';
import { INBOX_RETENTION_OPTIONS, type InboxRetentionDays } from '@/types/Inbox';

import PopoverMenu from './PopoverMenu';

interface ChatSettingsMenuProps {
    enabled: boolean;
    retentionDays: InboxRetentionDays;
    loaded: boolean;
    saving: boolean;
    savingRetention: boolean;
    /** Somente o dono do workspace liga e desliga — a chave vale para todo mundo. */
    canToggle: boolean;
    error: string | null;
    onToggle: (next: boolean) => void;
    onRetentionChange: (days: InboxRetentionDays) => void;
}

export default function ChatSettingsMenu({
  enabled,
  retentionDays,
  loaded,
  saving,
  savingRetention,
  canToggle,
  error,
  onToggle,
  onRetentionChange,
}: ChatSettingsMenuProps) {
  const retentionDisabled = !loaded || !canToggle || savingRetention;

  return (<PopoverMenu side="up" align="start" widthClassName="w-72" label="Configurações das conversas" trigger={(open) => (<span className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${open
    ? 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
    : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
    <Settings size={15}/>
  </span>)}>
    {() => (<div className="p-3 space-y-3">
      <div className="flex items-start gap-2.5">

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Receber conversas</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Desligado, nada que chegar é gravado na caixa de entrada.
          </p>
        </div>
        <div className="shrink-0 pt-0.5">
          {saving ? (<Loader2 size={16} className="animate-spin text-slate-400"/>) : (<ToggleSwitch checked={enabled} onChange={onToggle} disabled={!loaded || !canToggle}/>)}
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
        <div className="flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Histórico</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Por quanto tempo as conversas ficam na caixa de entrada após a última mensagem.
            </p>
          </div>
          {savingRetention && (<Loader2 size={16} className="shrink-0 animate-spin text-slate-400 pt-0.5"/>)}
        </div>
        <div role="radiogroup" aria-label="Duração do histórico" className="grid grid-cols-4 gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-1">
          {INBOX_RETENTION_OPTIONS.map((option) => {
            const active = option.days === retentionDays;
            return (<button key={option.days} type="button" role="radio" aria-checked={active} disabled={retentionDisabled} onClick={() => {
              if (!active) onRetentionChange(option.days);
            }} className={`rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${active
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs dark:shadow-none'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer'}`}>
              {option.label}
            </button>);
          })}
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Se o cliente não fala com você há mais de 24h, a resposta por aqui fica bloqueada até ele mandar uma nova mensagem.
        </p>
      </div>

      {!canToggle && (<p className="flex items-start gap-1.5 rounded-md bg-slate-50 dark:bg-slate-900/60 px-2 py-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        <Lock size={11} className="mt-0.5 shrink-0"/>
          Só o administrador da conta pode alterar.
      </p>)}

      {error && (<p className="text-[11px] text-rose-500">{error}</p>)}
    </div>)}
  </PopoverMenu>);
}
