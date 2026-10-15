'use client';
import { RotateCcw, XCircle } from 'lucide-react';
import Link from 'next/link';

import Button from '@/components/Button';

export default function OAuthCallbackError({ reset }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}) {
  return (<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
    <div className="w-full max-w-md space-y-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 text-center shadow-xl dark:shadow-none">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400">
          <XCircle size={36}/>
        </div>
      </div>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Algo deu errado nesta página</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Não conseguimos terminar a conexão. Tente de novo ou volte aos canais para começar outra vez.
      </p>
      <div className="flex flex-col gap-2 pt-1">
        <Button variant="primary" onClick={reset} icon={<RotateCcw size={16}/>} className="w-full justify-center">
          Tentar de novo
        </Button>
        <Link href="/channels" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
          Voltar aos canais
        </Link>
      </div>
    </div>
  </div>);
}
