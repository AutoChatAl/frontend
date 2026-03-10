'use client';

import { CheckCircle, Download } from 'lucide-react';

import Button from '@/components/Button';
import Card from '@/components/Card';

const INVOICES = [
  { date: '01/05/2024', amount: 'R$ 199,90', id: 202400 },
  { date: '01/04/2024', amount: 'R$ 199,90', id: 202401 },
  { date: '01/03/2024', amount: 'R$ 199,90', id: 202402 },
];

export default function BillingTab() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider font-semibold">Plano Atual</p>
            <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">Plano Pro</h3>
          </div>
          <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-medium">
            R$ 199,90/mês
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Consumo de Mensagens</span>
            <span>7.500 / 10.000</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full w-[75%] shadow-sm" />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button className="flex-1 justify-center">Alterar Plano</Button>
          <Button variant="secondary" className="flex-1 justify-center">Gerenciar Assinatura</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Histórico de Faturas</h3>
        <div className="space-y-2">
          {INVOICES.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">Fatura #{invoice.id}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{invoice.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{invoice.amount}</span>
                <button className="text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 p-1">
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
