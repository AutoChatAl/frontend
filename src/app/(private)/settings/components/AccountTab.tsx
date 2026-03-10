'use client';

import { AlertTriangle } from 'lucide-react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import FormField from '@/components/FormField';

export default function AccountTab() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Informações da Conta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nome da Empresa" defaultValue="Minha Loja" />
          <FormField label="Email Admin" type="email" defaultValue="admin@loja.com" />
        </div>
        <div className="flex justify-end mt-6">
          <Button>Salvar Alterações</Button>
        </div>
      </Card>

      <Card className="p-6 border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
        <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} /> Zona de Perigo
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-red-100 dark:border-red-900/30">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">Remover Dados da Conta</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Apaga histórico de mensagens e contatos. Irreversível.</p>
            </div>
            <button className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20">
              Limpar Dados
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">Excluir Conta</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Encerra assinatura e remove todos os acessos.</p>
            </div>
            <button className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">
              Excluir Conta
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
