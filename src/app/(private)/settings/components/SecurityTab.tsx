'use client';

import {
  Shield,
  Loader2,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import TwoFactorModal from './TwoFactorModal';

import Button from '@/components/Button';
import Card from '@/components/Card';
import PasswordInput from '@/components/PasswordInput';
import { useToast, ToastContainer } from '@/components/Toast';
import { authService } from '@/services/auth.service';

export default function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading2FA, setLoading2FA] = useState(true);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const fetch2FAStatus = useCallback(async () => {
    try {
      const user = await authService.fetchMe();
      setTwoFactorEnabled(!!user.twoFactorEnabled);
    } catch {
      // fallback: ignore
    } finally {
      setLoading2FA(false);
    }
  }, []);

  useEffect(() => {
    fetch2FAStatus();
  }, [fetch2FAStatus]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      addToast('error', 'Preencha ambos os campos de senha.');
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      addToast('success', 'Senha alterada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao alterar a senha.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Shield size={20} className="text-indigo-600 dark:text-indigo-400" />
          Alterar Senha
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PasswordInput
            label="Senha Atual"
            placeholder="Digite sua senha atual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <PasswordInput
            label="Nova Senha"
            placeholder="Digite a nova senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className="flex justify-end mt-6">
          <Button
            onClick={handleChangePassword}
            loading={passwordLoading}
            loadingText="Alterando..."
          >
            Atualizar Senha
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <ShieldCheck size={20} className="text-indigo-600 dark:text-indigo-400" />
          Autenticação de Dois Fatores (2FA)
        </h3>

        {loading2FA ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-4">
            <Loader2 size={16} className="animate-spin" />
            Carregando status do 2FA...
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                twoFactorEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-slate-100 dark:bg-slate-800'
              }`}>
                <ShieldCheck size={20} className={twoFactorEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {twoFactorEnabled ? '2FA Ativado' : '2FA Desativado'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {twoFactorEnabled
                    ? 'Sua conta está protegida com autenticação de dois fatores.'
                    : 'Adicione uma camada extra de segurança à sua conta.'}
                </p>
              </div>
            </div>
            <Button
              variant={twoFactorEnabled ? 'danger' : 'secondary'}
              onClick={() => setShow2FAModal(true)}
              icon={twoFactorEnabled ? <ShieldOff size={16} /> : <Shield size={16} />}
            >
              {twoFactorEnabled ? 'Desativar' : 'Configurar'}
            </Button>
          </div>
        )}
      </Card>

      <TwoFactorModal
        isOpen={show2FAModal}
        enabled={twoFactorEnabled}
        onClose={() => setShow2FAModal(false)}
        onSuccess={(enabled) => {
          setTwoFactorEnabled(enabled);
          addToast('success', enabled ? '2FA ativado com sucesso.' : '2FA desativado com sucesso.');
        }}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
