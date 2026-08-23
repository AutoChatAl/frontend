'use client';
import { Loader2, Lock, Settings } from 'lucide-react';

import ToggleSwitch from '@/components/ToggleSwitch';

import PopoverMenu from './PopoverMenu';

interface ChatSettingsMenuProps {
    enabled: boolean;
    loaded: boolean;
    saving: boolean;
    /** Somente o dono do workspace liga e desliga — a chave vale para todo mundo. */
    canToggle: boolean;
    error: string | null;
    onToggle: (next: boolean) => void;
}

export default function ChatSettingsMenu({ enabled, loaded, saving, canToggle, error, onToggle }: ChatSettingsMenuProps) {
  return (<PopoverMenu side="up" align="start" widthClassName="w-72" label="Configurações do chat" trigger={(open) => (<span className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${open
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

      {!canToggle && (<p className="flex items-start gap-1.5 rounded-md bg-slate-50 dark:bg-slate-900/60 px-2 py-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        <Lock size={11} className="mt-0.5 shrink-0"/>
          Só o dono do workspace pode alterar.
      </p>)}

      {error && (<p className="text-[11px] text-rose-500">{error}</p>)}
    </div>)}
  </PopoverMenu>);
}
