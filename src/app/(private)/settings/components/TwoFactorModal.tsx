'use client';

import {
  Check,
  Copy,
  ShieldCheck,
  ShieldOff,
  Shield,
  Smartphone,
  Download,
  QrCode,
  KeyRound,
} from 'lucide-react';
import { useState } from 'react';

import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { authService } from '@/services/auth.service';

interface TwoFactorModalProps {
  isOpen: boolean;
  enabled: boolean;
  onClose: () => void;
  onSuccess: (enabled: boolean) => void;
}

const APPS = [
  {
    id: 'google',
    name: 'Google Authenticator',
    vendor: 'Google',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.3 9 3.4l6.7-6.7C35.4 2.2 30 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.1 13.2 17.6 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.3 5.7c4.3-4 6.8-9.9 6.8-16.6z"/>
        <path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.8-6C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.6l7.8-6z"/>
        <path fill="#34A853" d="M24 48c6 0 11-2 14.7-5.3l-7.3-5.7c-2 1.3-4.5 2.1-7.4 2.1-6.4 0-11.9-3.7-13.6-9.1l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
      </svg>
    ),
    steps: [
      'Instale o Google Authenticator na App Store ou Google Play.',
      'Abra o app e toque em "+" ou "Adicionar conta".',
      'Escolha "Digitalizar um QR Code" e aponte a câmera para o QR abaixo.',
      'O app irá gerar um código de 6 dígitos. Use-o para verificar.',
    ],
    ios: 'https://apps.apple.com/app/google-authenticator/id388497605',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2',
  },
  {
    id: 'microsoft',
    name: 'Microsoft Authenticator',
    vendor: 'Microsoft',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <rect x="1" y="1" width="21" height="21" fill="#F25022"/>
        <rect x="26" y="1" width="21" height="21" fill="#7FBA00"/>
        <rect x="1" y="26" width="21" height="21" fill="#00A4EF"/>
        <rect x="26" y="26" width="21" height="21" fill="#FFB900"/>
      </svg>
    ),
    steps: [
      'Instale o Microsoft Authenticator na App Store ou Google Play.',
      'Abra o app, toque em "+" e selecione "Conta pessoal ou corporativa".',
      'Escolha "Digitalizar QR Code" e aponte para o código abaixo.',
      'O app irá gerar um código de 6 dígitos. Use-o para verificar.',
    ],
    ios: 'https://apps.apple.com/app/microsoft-authenticator/id983156458',
    android: 'https://play.google.com/store/apps/details?id=com.azure.authenticator',
  },
  {
    id: 'authy',
    name: 'Twilio Authy',
    vendor: 'Twilio',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <circle cx="24" cy="24" r="24" fill="#EC1C24"/>
        <path fill="white" d="M24 10c-7.7 0-14 6.3-14 14s6.3 14 14 14 14-6.3 14-14S31.7 10 24 10zm0 22c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
        <circle cx="24" cy="24" r="4" fill="white"/>
      </svg>
    ),
    steps: [
      'Instale o Authy na App Store ou Google Play.',
      'Abra o app e toque em "Adicionar Conta".',
      'Escolha "Digitalizar QR Code" e escaneie o código abaixo.',
      'O app irá gerar um código de 6 dígitos. Use-o para verificar.',
    ],
    ios: 'https://apps.apple.com/app/authy/id494168017',
    android: 'https://play.google.com/store/apps/details?id=com.authy.authy',
  },
];

function DisableView({
  onDisable,
  onClose,
}: {
  onDisable: (code: string) => Promise<void>;
  onClose: () => void;
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    if (code.length !== 6) { setError('Insira o código de 6 dígitos.'); return; }
    setLoading(true);
    setError('');
    try {
      await onDisable(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status badge */}
      <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
          <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            2FA está ativo na sua conta
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
            Autenticação de dois fatores protege seu acesso.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Para desativar, abra seu app autenticador, insira o código de 6 dígitos gerado e confirme.
        </p>
        <Input
          label="Código do autenticador"
          placeholder="000000"
          value={code}
          onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
          maxLength={6}
          autoComplete="one-time-code"
          error={error}
        />
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          variant="danger"
          onClick={handle}
          loading={loading}
          loadingText="Desativando..."
          icon={<ShieldOff size={16} />}
        >
          Desativar 2FA
        </Button>
      </div>
    </div>
  );
}

function SetupView({
  setupData,
  onVerify,
  onClose,
}: {
  setupData: { secret: string; qrCode: string };
  onVerify: (code: string) => Promise<void>;
  onClose: () => void;
}) {
  const [activeApp, setActiveApp] = useState(0);
  const [step, setStep] = useState<'scan' | 'verify'>('scan');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const app = APPS[activeApp]!;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback: ignore */ }
  };

  const handleVerify = async () => {
    if (code.length !== 6) { setError('Insira o código de 6 dígitos.'); return; }
    setLoading(true);
    setError('');
    try {
      await onVerify(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
          Escolha seu app autenticador
        </p>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {APPS.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setActiveApp(i)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium transition-all select-none ${
                activeApp === i
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {a.icon}
              <span className="hidden sm:block leading-tight text-center">{a.vendor}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-0 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-sm font-medium">
        <button
          type="button"
          onClick={() => setStep('scan')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors ${
            step === 'scan'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <QrCode size={15} />
          Escanear QR
        </button>
        <button
          type="button"
          onClick={() => setStep('verify')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 border-l border-slate-200 dark:border-slate-700 transition-colors ${
            step === 'verify'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <KeyRound size={15} />
          Verificar Código
        </button>
      </div>

      {step === 'scan' && (
        <div className="space-y-5">
          <ol className="space-y-2.5">
            {app.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>

          {/* Download links */}
          <div className="flex gap-2">
            <a
              href={app.ios}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
            >
              <Download size={12} /> App Store
            </a>
            <a
              href={app.android}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
            >
              <Smartphone size={12} /> Google Play
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="shrink-0 p-2.5 bg-white rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
              <img src={setupData.qrCode} alt="QR Code 2FA" className="w-40 h-40" />
            </div>

            <div className="flex-1 min-w-0 space-y-3 w-full">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Ou insira a chave manualmente:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 min-w-0 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 break-all select-all">
                    {setupData.secret}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    title="Copiar chave"
                    className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep('verify')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <KeyRound size={15} />
                Já escaneei — Verificar
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                Quase lá!
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                Abra o {app.name} e insira o código de 6 dígitos gerado para ativar o 2FA.
              </p>
            </div>
          </div>

          <Input
            label="Código de verificação"
            placeholder="000000"
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            maxLength={6}
            autoComplete="one-time-code"
            error={error}
          />

          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button
              onClick={handleVerify}
              loading={loading}
              loadingText="Verificando..."
              icon={<ShieldCheck size={16} />}
            >
              Verificar e Ativar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function IdleView({
  onSetup,
  loading,
  onClose,
}: {
  onSetup: () => void;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
          <Shield size={32} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="text-center">
          <h4 className="text-base font-semibold text-slate-900 dark:text-white">
            Proteja sua conta com 2FA
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Adicione uma camada extra de segurança. Cada login exigirá um código gerado pelo seu app autenticador.
          </p>
        </div>
      </div>

      <ul className="space-y-2.5">
        {[
          'Protege contra senhas vazadas ou roubadas',
          'Bloqueia acessos não autorizados de qualquer lugar',
          'Configuração rápida — menos de 2 minutos',
        ].map((b) => (
          <li key={b} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <Check size={11} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            {b}
          </li>
        ))}
      </ul>

      <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          onClick={onSetup}
          loading={loading}
          loadingText="Configurando..."
          icon={<Shield size={16} />}
        >
          Ativar 2FA
        </Button>
      </div>
    </div>
  );
}

export default function TwoFactorModal({ isOpen, enabled, onClose, onSuccess }: TwoFactorModalProps) {
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  const handleSetup = async () => {
    setSetupLoading(true);
    try {
      const data = await authService.setup2FA();
      setSetupData(data);
    } catch (err) {
      // fallback: ignore
      throw err;
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    await authService.verify2FA(code);
    onSuccess(true);
    onClose();
  };

  const handleDisable = async (code: string) => {
    await authService.disable2FA(code);
    onSuccess(false);
    onClose();
  };

  const handleClose = () => {
    setSetupData(null);
    onClose();
  };

  const title = enabled ? 'Desativar Autenticação de Dois Fatores' : 'Configurar Autenticação de Dois Fatores';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      {enabled ? (
        <DisableView onDisable={handleDisable} onClose={handleClose} />
      ) : setupData ? (
        <SetupView setupData={setupData} onVerify={handleVerify} onClose={handleClose} />
      ) : (
        <IdleView onSetup={handleSetup} loading={setupLoading} onClose={handleClose} />
      )}
    </Modal>
  );
}
