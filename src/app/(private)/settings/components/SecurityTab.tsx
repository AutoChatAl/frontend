'use client';
import { Loader2, Shield, ShieldCheck, ShieldOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';
import PasswordInput from '@/components/PasswordInput';
import SectionHeader from '@/components/SectionHeader';
import { useToast, ToastContainer } from '@/components/Toast';
import { authService } from '@/services/auth.service';

import TwoFactorModal from './TwoFactorModal';

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
    }
    catch {
    }
    finally {
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
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao alterar a senha.');
    }
    finally {
      setPasswordLoading(false);
    }
  };
  return (<div className="space-y-3">
    <Card className="p-4">
      <SectionHeader title="Alterar senha" hint="Você continua logado nos outros aparelhos depois de trocar."/>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PasswordInput label="Senha atual" placeholder="Digite sua senha atual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}/>
        <PasswordInput label="Nova senha" placeholder="Digite a nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}/>
      </div>
      <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-700">
        <Button onClick={handleChangePassword} loading={passwordLoading} loadingText="Alterando..." className="w-full justify-center sm:w-auto">
            Atualizar senha
        </Button>
      </div>
    </Card>

    <Card className="p-4">
      <SectionHeader
        title="Autenticação de dois fatores"
        hint="Além da senha, o login passa a pedir um código do seu aplicativo autenticador."
        action={twoFactorEnabled
          ? <Badge type="success" text="Ativado" icon={ShieldCheck} pill/>
          : <Badge type="neutral" text="Desativado" pill/>}
      />

      {loading2FA ? (
        <div className="flex items-center gap-2 py-2 text-[13px] text-slate-500 dark:text-slate-400">
          <Loader2 size={16} className="animate-spin"/>
            Carregando status do 2FA...
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
          <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
            {twoFactorEnabled
              ? 'Sua conta está protegida. Guarde os códigos de recuperação num lugar seguro — sem eles e sem o aplicativo, o acesso se perde.'
              : 'Sem o segundo fator, quem descobrir sua senha entra direto na conta.'}
          </p>
          <Button
            variant={twoFactorEnabled ? 'danger' : 'primary'}
            size="sm"
            onClick={() => setShow2FAModal(true)}
            icon={twoFactorEnabled ? <ShieldOff size={14}/> : <Shield size={14}/>}
            className="w-full shrink-0 justify-center py-2 sm:w-auto sm:py-1.5"
          >
            {twoFactorEnabled ? 'Desativar' : 'Configurar'}
          </Button>
        </div>
      )}
    </Card>

    <TwoFactorModal isOpen={show2FAModal} enabled={twoFactorEnabled} onClose={() => setShow2FAModal(false)} onSuccess={(enabled) => {
      setTwoFactorEnabled(enabled);
      addToast('success', enabled ? '2FA ativado com sucesso.' : '2FA desativado com sucesso.');
    }}/>

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
