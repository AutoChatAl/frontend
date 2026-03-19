'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import DangerZone from '@/components/DangerZone';
import Input from '@/components/Input';
import { useToast, ToastContainer } from '@/components/Toast';
import { authService } from '@/services/auth.service';

export default function AccountTab() {
  const [workspaceName, setWorkspaceName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    authService
      .fetchMe()
      .then((user) => {
        setEmail(user.email ?? '');
        setWorkspaceName(user.workspace?.name ?? '');
      })
      .catch(() => {
        addToast('error', 'Não foi possível carregar os dados da conta.');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await authService.updateAccount({ workspaceName, email });
      addToast('success', 'Dados atualizados com sucesso.');
    } catch {
      addToast('error', 'Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Informações da Conta</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nome da Empresa"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="Minha Loja"
          />
          <Input
            label="Email Admin"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@loja.com"
          />
        </div>

        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSave}
            loading={saving}
            loadingText="Salvando..."
            disabled={saving}
          >
            Salvar Alterações
          </Button>
        </div>
      </Card>

      <DangerZone
        actions={[
          {
            label: 'Remover Dados da Conta',
            description: 'Apaga histórico de mensagens e contatos. Irreversível.',
            buttonLabel: 'Limpar Dados',
          },
          {
            label: 'Excluir Conta',
            description: 'Encerra assinatura e remove todos os acessos.',
            buttonLabel: 'Excluir Conta',
            destructive: true,
          },
        ]}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
