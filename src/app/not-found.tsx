'use client';
import { ArrowLeft, Bot, Compass, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

import Button from '@/components/Button';

export default function NotFound() {
  const router = useRouter();
  return (<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
    <div className="w-full max-w-md text-center space-y-6">
      <div className="flex items-center justify-center gap-2">
        <div className="w-9 h-9 bg-linear-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-200 dark:shadow-none">
          <Bot size={20} className="text-white"/>
        </div>
        <span className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">Synq</span>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Compass size={32} className="text-indigo-600 dark:text-indigo-400"/>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-5xl font-bold text-slate-900 dark:text-white tracking-tight">404</p>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Página não encontrada</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            A página que você procura não existe, foi movida ou você não tem permissão para acessá-la.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button variant="secondary" icon={<ArrowLeft size={16}/>} onClick={() => router.back()}>
            Voltar
        </Button>
        <Button variant="primary" icon={<Home size={16}/>} onClick={() => router.push('/')}>
            Ir para o início
        </Button>
      </div>
    </div>
  </div>);
}
