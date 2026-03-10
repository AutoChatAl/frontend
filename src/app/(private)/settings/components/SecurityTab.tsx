'use client';

import { Shield } from 'lucide-react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import FormField from '@/components/FormField';

export default function SecurityTab() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Shield size={20} className="text-indigo-600 dark:text-indigo-400" /> Segurança de Acesso
        </h3>
        <div className="flex items-center justify-between py-4 border-b border-slate-50 dark:border-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-white">Autenticação de Dois Fatores (2FA)</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Adicione uma camada extra de segurança à sua conta.</p>
          </div>
          <Button variant="secondary" size="sm">Ativar 2FA</Button>
        </div>
        <div className="pt-4 space-y-4">
          <p className="text-sm font-medium text-slate-800 dark:text-white">Alterar Senha</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="" placeholder="Senha Atual" type="password" />
            <FormField label="" placeholder="Nova Senha" type="password" />
          </div>
          <div className="flex justify-end">
            <Button>Atualizar Senha</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
