'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import DangerZone from '@/components/DangerZone';
import Input from '@/components/Input';
import SectionHeader from '@/components/SectionHeader';
import { SkeletonForm } from '@/components/Skeleton';
import { useToast, ToastContainer } from '@/components/Toast';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { authService } from '@/services/auth.service';

export default function AccountTab() {
  const router = useRouter();
  const { resetOnboarding } = useOnboarding();
  const [workspaceName, setWorkspaceName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resettingTour, setResettingTour] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  async function handleRestartTour() {
    setResettingTour(true);
    try {
      await resetOnboarding();
      addToast('success', 'Tour resetado! Voltando para o início…');
      // Vai para a home onde o welcome aparece de novo
      setTimeout(() => router.push('/dashboard'), 600);
    }
    catch {
      addToast('error', 'Não foi possível resetar o tour. Tente de novo.');
    }
    finally {
      setResettingTour(false);
    }
  }

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
    }
    catch {
      addToast('error', 'Erro ao salvar alterações. Tente novamente.');
    }
    finally {
      setSaving(false);
    }
  }
  async function handleClearData() {
    setClearLoading(true);
    try {
      await authService.clearData();
      setClearModalOpen(false);
      addToast('success', 'Dados da conta removidos com sucesso.');
    }
    catch {
      addToast('error', 'Erro ao remover dados. Tente novamente.');
    }
    finally {
      setClearLoading(false);
    }
  }
  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      await authService.deleteAccount();
      authService.logout();
      router.push('/login');
    }
    catch {
      addToast('error', 'Erro ao excluir conta. Tente novamente.');
      setDeleteLoading(false);
    }
  }
  if (loading) {
    return (<div className="animate-pulse space-y-3" aria-busy="true">
      <SkeletonForm fields={4}/>
    </div>);
  }
  return (<div className="space-y-3">
    {/* Coluna da esquerda com os dados, direita empilhando perigo e tour: assim o
        formulário estica junto e nenhuma das duas metades fica com sobra vazia. */}
    <div className="grid gap-3 lg:grid-cols-2">
      <Card className="flex flex-col p-4">
        <SectionHeader
          title="Informações da conta"
          hint="O nome aparece para a sua equipe e o e-mail recebe cobranças e avisos do sistema."
        />
        <div className="flex-1 space-y-4">
          <Input label="Nome da empresa" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="Minha Loja"/>
          <Input label="E-mail administrativo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@loja.com"/>
        </div>
        <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-700">
          <Button onClick={handleSave} loading={saving} loadingText="Salvando..." className="w-full justify-center sm:w-auto">
              Salvar alterações
          </Button>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <DangerZone actions={[
          {
            label: 'Remover dados da conta',
            description: 'Apaga histórico de mensagens, contatos, campanhas e grupos.',
            buttonLabel: 'Limpar dados',
            onClick: () => setClearModalOpen(true),
          },
          {
            label: 'Excluir conta',
            description: 'Encerra a assinatura e remove o acesso de todas as pessoas da empresa.',
            buttonLabel: 'Excluir conta',
            destructive: true,
            onClick: () => setDeleteModalOpen(true),
          },
        ]}/>

        {/* Botão ao lado do texto: em coluna o card ficava alto demais e a
            direita passava da altura do formulário da esquerda. */}
        <Card className="flex flex-1 items-center p-4">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Refazer tour guiado</h3>
              <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Reseta as explicações e mostra todas de novo, página por página.
              </p>
            </div>
            <Button variant="secondary" onClick={handleRestartTour} loading={resettingTour} loadingText="Resetando..." className="w-full shrink-0 justify-center sm:w-auto">
                Refazer tour
            </Button>
          </div>
        </Card>
      </div>
    </div>

    <ConfirmDeleteModal isOpen={clearModalOpen} onClose={() => setClearModalOpen(false)} onConfirm={handleClearData} title="Remover dados da conta" message="Isso apagará permanentemente todos os contatos, histórico de mensagens, campanhas e grupos. Esta ação não pode ser desfeita." confirmLabel="Limpar Dados" loading={clearLoading}/>

    <ConfirmDeleteModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDeleteAccount} title="Excluir conta" message="Sua conta e todos os dados associados serão excluídos permanentemente. Você será deslogado imediatamente." confirmLabel="Excluir Conta" loading={deleteLoading}/>

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
