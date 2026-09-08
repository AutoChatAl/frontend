'use client';
import { BellOff, BellRing, Loader2, SlidersHorizontal, Volume2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import ToggleSwitch from '@/components/ToggleSwitch';
import { useAttendantAlerts } from '@/contexts/AttendantAlertsContext';
import type { AlertPreferencesPatch } from '@/types/AlertPreferences';

import PopoverMenu from './PopoverMenu';

const SCOPE_OPTIONS = [
  { value: 'all', label: 'Todas as mensagens' },
  { value: 'new', label: 'Só conversas novas' },
] as const;

/**
 * Atalho dos alertas de atendimento na barra da caixa de entrada: liga e desliga,
 * som e alcance, sem sair do chat. A configuração completa (tipo de notificação,
 * toque, transferência) fica em Configurações → Notificações. Diferente do menu
 * do chat ao lado, aparece para todo mundo — a escolha é de cada atendente.
 */
export default function AlertsQuickMenu() {
  const { preferences, loaded, saving, updatePreferences, browserPermission, requestBrowserPermission, previewSound } = useAttendantAlerts();
  const [error, setError] = useState<string | null>(null);

  const save = async (patch: AlertPreferencesPatch) => {
    setError(null);
    try {
      await updatePreferences(patch);
    } catch {
      setError('Não foi possível salvar. Tente de novo.');
    }
  };

  const handlePreview = async () => {
    const played = await previewSound();
    setError(played ? null : 'O navegador ainda não liberou o som — clique em qualquer lugar da página e tente de novo.');
  };

  const { enabled } = preferences;
  const needsPermission = enabled && preferences.mode !== 'in-app' && browserPermission === 'default';
  const blockedPermission = enabled && preferences.mode !== 'in-app' && browserPermission === 'denied';
  const Icon = enabled ? BellRing : BellOff;

  return (<PopoverMenu side="up" align="start" widthClassName="w-72" label="Alertas de atendimento" trigger={(open) => (<span
    title={enabled ? 'Alertas de atendimento ligados' : 'Alertas de atendimento desligados'}
    className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${open
      ? 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
      : enabled
        ? 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
        : 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400'}`}>
    <Icon size={15}/>
  </span>)}>
    {() => (<div className="p-3 space-y-3">
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Alertas de atendimento</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Som e aviso quando chega conversa. Vale só para você.
          </p>
        </div>
        <div className="shrink-0 pt-0.5">
          {!loaded || saving
            ? (<Loader2 size={16} className="animate-spin text-slate-400"/>)
            : (<ToggleSwitch checked={enabled} onChange={(checked) => save({ enabled: checked })} ariaLabel="Alertas de atendimento"/>)}
        </div>
      </div>

      <div className={`space-y-2.5 border-t border-slate-100 dark:border-slate-700 pt-3 ${enabled ? '' : 'opacity-50'}`}>
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-slate-900 dark:text-white">Som</p>
          </div>
          <button
            type="button"
            onClick={handlePreview}
            disabled={!enabled || !preferences.sound}
            title="Ouvir o toque"
            aria-label="Ouvir o toque"
            className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Volume2 size={14}/>
          </button>
          <ToggleSwitch checked={preferences.sound} onChange={(checked) => save({ sound: checked })} disabled={!enabled || saving} ariaLabel="Som do alerta"/>
        </div>

        <div role="radiogroup" aria-label="Quais mensagens avisar" className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-1">
          {SCOPE_OPTIONS.map((option) => {
            const active = option.value === (preferences.newConversationsOnly ? 'new' : 'all');
            return (<button key={option.value} type="button" role="radio" aria-checked={active} disabled={!enabled || saving || !preferences.incomingMessages} onClick={() => {
              if (!active) save({ newConversationsOnly: option.value === 'new' });
            }} className={`rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${active
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs dark:shadow-none'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer'}`}>
              {option.label}
            </button>);
          })}
        </div>
        {!preferences.incomingMessages && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Aviso de mensagens recebidas desligado nas configurações.</p>
        )}
      </div>

      {needsPermission && (<button
        type="button"
        onClick={() => { void requestBrowserPermission(); }}
        className="w-full cursor-pointer rounded-md bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1.5 text-left text-[11px] font-medium text-indigo-700 dark:text-indigo-300 transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
      >
        Permitir notificações do navegador para ser avisado em outra aba.
      </button>)}
      {blockedPermission && (<p className="rounded-md bg-amber-50 dark:bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-700 dark:text-amber-300">
        O navegador bloqueou as notificações deste site. Libere no cadeado ao lado do endereço.
      </p>)}

      <Link href="/settings?tab=notifications" className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
        <SlidersHorizontal size={12}/> Todas as opções de alerta
      </Link>

      {error && (<p className="text-[11px] text-rose-500">{error}</p>)}
    </div>)}
  </PopoverMenu>);
}
