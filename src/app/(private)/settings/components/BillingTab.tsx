'use client';

import { CheckCircle, Download } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import { type MessageUsage, planLimitsService } from '@/services/plan-limits.service';

export default function BillingTab() {
  const pathname = usePathname();
  const [usage, setUsage] = useState<MessageUsage | null>(null);
  const [showUnavailable, setShowUnavailable] = useState(false);

  const fetchUsage = useCallback(async () => {
    try {
      const data = await planLimitsService.getMessageUsage();
      setUsage(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    const refreshOnFocus = () => {
      fetchUsage();
    };

    const refreshOnVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchUsage();
      }
    };

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnVisibility);

    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnVisibility);
    };
  }, [fetchUsage]);

  useEffect(() => {
    fetchUsage();
  }, [pathname, fetchUsage]);

  const formatNumber = (n: number) => n.toLocaleString('pt-BR');
  const count = usage?.count ?? 0;
  const limit = usage?.limit ?? 0;
  const progress = limit > 0 ? Math.min(Math.round((count / limit) * 100), 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 sm:gap-0 mb-4 sm:mb-6">
          <div>
            <p className="text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider font-semibold">Plano Atual</p>
            <h3 className="text-xl sm:text-2xl font-bold mt-1 text-slate-900 dark:text-white">Plano Basic</h3>
          </div>
          <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-medium self-start">
            R$ 69,90/mês
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Consumo de Mensagens</span>
            <span>{formatNumber(count)} / {formatNumber(limit)}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full shadow-sm transition-all duration-500 ${progress >= 90 ? 'bg-red-500' : progress >= 70 ? 'bg-amber-500' : 'bg-indigo-600 dark:bg-indigo-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button className="flex-1 justify-center" onClick={() => setShowUnavailable(true)}>Alterar Plano</Button>
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowUnavailable(true)}>Gerenciar Assinatura</Button>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-4">Histórico de Faturas</h3>
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <CheckCircle size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">Fatura #202600</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">22/03/2026</p>
              </div>
            </div>
            <div className="flex items-center gap-4 ml-11 sm:ml-0">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">R$ 0,00</span>
              <button className="text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 p-1">
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Modal isOpen={showUnavailable} onClose={() => setShowUnavailable(false)} title="Funcionalidade Indisponível" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            O gerenciamento de planos e assinaturas ainda não está disponível.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setShowUnavailable(false)} size="md">Entendi</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
