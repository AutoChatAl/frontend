'use client';

import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';

import Button from '@/components/Button';

export default function PlansCancelPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <XCircle size={32} className="text-slate-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Assinatura cancelada</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Você cancelou o processo de assinatura. Pode tentar novamente quando quiser.</p>
      <div className="flex gap-3">
        <Button onClick={() => router.push('/plans')}>Tentar Novamente</Button>
        <Button variant="secondary" onClick={() => router.push('/dashboard')}>Voltar ao Dashboard</Button>
      </div>
    </div>
  );
}
