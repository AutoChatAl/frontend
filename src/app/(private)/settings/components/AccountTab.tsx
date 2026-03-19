'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import DangerZone from '@/components/DangerZone';
import Input from '@/components/Input';
import { useToast, ToastContainer } from '@/components/Toast';
import { authService } from '@/services/auth.service';

export default function AccountTab() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
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

  async function handleClearData() {
    setClearLoading(true);
    try {
      await authService.clearData();
      setClearModalOpen(false);
      addToast('success', 'Dados da conta removidos com sucesso.');
    } catch {
      addToast('error', 'Erro ao remover dados. Tente novamente.');
    } finally {
      setClearLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      await authService.deleteAccount();
      authService.logout();
      router.push('/login');
    } catch {
      addToast('error', 'Erro ao excluir conta. Tente novamente.');
      setDeleteLoading(false);
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
            onClick: () => setClearModalOpen(true),
          },
          {
            label: 'Excluir Conta',
            description: 'Encerra assinatura e remove todos os acessos.',
            buttonLabel: 'Excluir Conta',
            destructive: true,
            onClick: () => setDeleteModalOpen(true),
          },
        ]}
      />

      <ConfirmDeleteModal
        isOpen={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        onConfirm={handleClearData}
        title="Remover dados da conta"
        message="Isso apagará permanentemente todos os contatos, histórico de mensagens, campanhas e grupos. Esta ação não pode ser desfeita."
        confirmLabel="Limpar Dados"
        loading={clearLoading}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Excluir conta"
        message="Sua conta e todos os dados associados serão excluídos permanentemente. Você será deslogado imediatamente."
        confirmLabel="Excluir Conta"
        loading={deleteLoading}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
