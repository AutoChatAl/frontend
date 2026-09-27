import { BadgeCheck } from 'lucide-react';

import BrandLogo from '@/components/BrandLogo';

interface ChatHeaderProps {
  progress: number;
}

/** Topo da conversa no formato de um contato do WhatsApp, com a barra de progresso logo abaixo. */
export default function ChatHeader({ progress }: ChatHeaderProps) {
  return (
    <header className="shrink-0">
      <div className="bg-emerald-700 text-white dark:bg-slate-800">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-700">
            <BrandLogo size={26} alt="Synq" priority />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-base font-semibold leading-tight">
              Synq
              <BadgeCheck size={16} className="fill-blue-500 text-white" aria-label="Conta verificada" />
            </p>
            <p className="mt-0.5 text-xs text-emerald-100 dark:text-slate-400">Diagnóstico de operação · online</p>
          </div>
        </div>
      </div>
      <div
        role="progressbar"
        aria-label="Progresso do diagnóstico"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="h-1 bg-slate-200 dark:bg-slate-700"
      >
        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </header>
  );
}
