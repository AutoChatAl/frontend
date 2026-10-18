'use client';
import { Eye, EyeOff, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import Input from '@/components/Input';
import { resolveLandingRoute } from '@/contexts/SidebarContext';
import { authService } from '@/services/auth.service';

import AuthShell from '../components/AuthShell';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type LoginField = 'email' | 'password' | 'totpCode';
type LoginFieldErrors = Partial<Record<LoginField, string>>;
const LOGIN_FIELD_ORDER: LoginField[] = ['email', 'password', 'totpCode'];
const LOGIN_FIELD_ID: Record<LoginField, string> = {
  email: 'email',
  password: 'senha',
  totpCode: 'codigo-2fa',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const clearFieldError = (field: LoginField) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const nextErrors: LoginFieldErrors = {};
    if (requires2FA) {
      if (!/^\d{6}$/.test(totpCode)) {
        nextErrors.totpCode = 'Informe o código de 6 dígitos.';
      }
    }
    else {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        nextErrors.email = 'Informe seu e-mail.';
      }
      else if (!EMAIL_PATTERN.test(trimmedEmail)) {
        nextErrors.email = 'Informe um e-mail válido, como nome@empresa.com.';
      }
      if (!password) {
        nextErrors.password = 'Informe sua senha.';
      }
    }
    setFieldErrors(nextErrors);
    const firstInvalid = LOGIN_FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      document.getElementById(LOGIN_FIELD_ID[firstInvalid])?.focus();
      return;
    }
    setIsLoading(true);
    try {
      const result = await authService.login({
        email: email.trim(),
        password,
        ...(requires2FA ? { totpCode } : {}),
      });
      if (result.requires2FA) {
        setRequires2FA(true);
        setFieldErrors({});
        setIsLoading(false);
        return;
      }
      router.push(resolveLandingRoute(authService.getUser()));
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível fazer login. Verifique os dados e tente novamente.');
      // Na etapa 2FA o campo de senha some da tela. Limpar aqui faria o próximo
      // envio ir com senha vazia e o 400 voltar como "e-mail ou senha incorretos".
      if (!requires2FA) {
        setPassword('');
      }
    }
    finally {
      setIsLoading(false);
    }
  };
  return (<AuthShell themed title="Bem-vindo de volta!" subtitle="Insira suas credenciais para acessar sua conta.">
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {error && (<div role="alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
        {error}
      </div>)}

      {!requires2FA ? (<>
        <Input id="email" label="Email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => {
          setEmail(e.target.value);
          clearFieldError('email');
        }} required autoComplete="email" error={fieldErrors.email}/>
        <div>
          <div className="flex justify-between mb-1.5">
            <label htmlFor="senha" className="text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
            <Link href="/forgot-password" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
                  Esqueceu a senha?
            </Link>
          </div>
          <Input id="senha" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => {
            setPassword(e.target.value);
            clearFieldError('password');
          }} required autoComplete="current-password" error={fieldErrors.password} rightElement={<button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" tabIndex={-1}>
            {showPassword ? <EyeOff size={18} aria-hidden="true"/> : <Eye size={18} aria-hidden="true"/>}
          </button>}/>
        </div>
      </>) : (<div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl">
          <Shield size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0"/>
          <div>
            <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Verificação em duas etapas</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">Insira o código do seu app autenticador.</p>
          </div>
        </div>
        <Input id="codigo-2fa" label="Código 2FA" type="text" inputMode="numeric" placeholder="000000" value={totpCode} onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 6);
          setTotpCode(v);
          clearFieldError('totpCode');
        }} required autoComplete="one-time-code" error={fieldErrors.totpCode}/>
      </div>)}

      <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg dark:shadow-none dark:hover:shadow-none transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none">
        {isLoading ? 'Entrando...' : requires2FA ? 'Verificar e Entrar' : 'Entrar na Plataforma'}
      </button>

      {requires2FA && (<button type="button" onClick={() => {
        setRequires2FA(false);
        setTotpCode('');
        setError('');
        setFieldErrors({});
      }} className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Voltar para login
      </button>)}
    </form>

    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
      <p className="text-sm text-slate-500 dark:text-slate-400">
          Não tem uma conta?{' '}
        <Link href="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
            Criar conta grátis
        </Link>
      </p>
      <Link href="/" className="mt-4 text-xs text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center gap-1 w-full">
         Voltar para o início
      </Link>
    </div>
  </AuthShell>);
}
