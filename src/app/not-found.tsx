'use client';
import { ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

import BrandLogo from '@/components/BrandLogo';
import Button from '@/components/Button';

export default function NotFound() {
  const router = useRouter();
  return (<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
    <div className="w-full max-w-md text-center space-y-6">
      <div className="flex items-center justify-center gap-2">
        <BrandLogo size={36}/>
        <span className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">Synq</span>
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
