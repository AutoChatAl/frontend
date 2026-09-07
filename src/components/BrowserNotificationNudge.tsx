'use client';
import { BellRing, X } from 'lucide-react';

interface BrowserNotificationNudgeProps {
  onEnable: () => void;
  onDismiss: () => void;
  requesting?: boolean | undefined;
}

/**
 * Convite para liberar as notificações do navegador. Sem elas, o aviso de conversa
 * nova só existe dentro da aba do Synq — e o atendente em outra aba ou programa não
 * vê nada. O navegador só mostra o pedido de permissão em resposta a um clique, por
 * isso é um botão e não um pedido automático ao carregar.
 */
export default function BrowserNotificationNudge({ onEnable, onDismiss, requesting = false }: BrowserNotificationNudgeProps) {
  return (
    <div
      role="status"
      className="pointer-events-auto flex items-start gap-3 rounded-xl border border-indigo-200 bg-white p-3 shadow-lg dark:border-indigo-500/30 dark:bg-slate-800 animate-in slide-in-from-right-4 duration-300"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
        <BellRing size={16}/>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Receber avisos fora desta aba?</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Libere as notificações do navegador para ser avisado de conversa nova mesmo em outra aba ou programa.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onEnable}
            disabled={requesting}
            className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {requesting ? 'Aguardando o navegador…' : 'Ativar notificações'}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Agora não
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar"
        className="shrink-0 cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
      >
        <X size={14}/>
      </button>
    </div>
  );
}
