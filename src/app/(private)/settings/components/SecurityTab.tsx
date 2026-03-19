'use client';

import {
  Shield,
  Loader2,
  Check,
  ShieldCheck,
  ShieldOff,
  Copy,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import PasswordInput from '@/components/PasswordInput';
import { useToast, ToastContainer } from '@/components/Toast';
import { authService } from '@/services/auth.service';

export default function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading2FA, setLoading2FA] = useState(true);
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
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

  const handleSetup2FA = async () => {
    setSetupLoading(true);
    try {
      const data = await authService.setup2FA();
      setSetupData(data);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao configurar 2FA.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!totpCode || totpCode.length !== 6) {
      addToast('error', 'Insira o código de 6 dígitos.');
      return;
    }

    setVerifyLoading(true);
    try {
      await authService.verify2FA(totpCode);
      setTwoFactorEnabled(true);
      setSetupData(null);
      setTotpCode('');
      addToast('success', '2FA ativado com sucesso.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Código inválido.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!totpCode || totpCode.length !== 6) {
      addToast('error', 'Insira o código de 6 dígitos para desativar.');
      return;
    }

    setVerifyLoading(true);
    try {
      await authService.disable2FA(totpCode);
      setTwoFactorEnabled(false);
      setTotpCode('');
      addToast('success', '2FA desativado com sucesso.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Código inválido.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleCopySecret = async () => {
    if (!setupData) return;
    try {
      await navigator.clipboard.writeText(setupData.secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      // fallback: ignore
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
        ) : twoFactorEnabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck size={14} /> 2FA Ativo
              </span>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Para desativar a autenticação de dois fatores, insira o código gerado pelo seu aplicativo autenticador.
            </p>

            <div className="flex items-end gap-3 max-w-md">
              <Input
                label="Código TOTP"
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                wrapperClassName="flex-1"
              />
              <Button
                variant="danger"
                onClick={handleDisable2FA}
                loading={verifyLoading}
                loadingText="Desativando..."
                icon={<ShieldOff size={16} />}
              >
                Desativar 2FA
              </Button>
            </div>
          </div>
        ) : setupData ? (
          <div className="space-y-5">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Escaneie o QR Code abaixo com seu aplicativo autenticador (Google Authenticator, Authy, etc.) ou insira a chave manualmente.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="shrink-0 p-3 bg-white rounded-xl border border-slate-200 dark:border-slate-600">
                <img
                  src={setupData.qrCode}
                  alt="QR Code para 2FA"
                  className="w-48 h-48"
                />
              </div>

              <div className="flex-1 space-y-4 min-w-0">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Chave secreta (entrada manual)
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-700 dark:text-slate-300 break-all select-all">
                      {setupData.secret}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Copiar chave"
                    >
                      {secretCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <Input
                  label="Código de verificação"
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />

                <Button
                  onClick={handleVerify2FA}
                  loading={verifyLoading}
                  loadingText="Verificando..."
                  icon={<ShieldCheck size={16} />}
                >
                  Verificar e Ativar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Adicione uma camada extra de segurança à sua conta com autenticação de dois fatores.
            </p>
            <Button
              variant="secondary"
              onClick={handleSetup2FA}
              loading={setupLoading}
              loadingText="Configurando..."
              icon={<Shield size={16} />}
            >
              Ativar 2FA
            </Button>
          </div>
        )}

      </Card>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
