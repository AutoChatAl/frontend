'use client';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import Checkbox from '@/components/Checkbox';
import Input from '@/components/Input';
import { authService } from '@/services/auth.service';
import { extractPhoneDigits, formatPhoneNumber } from '@/utils/phone';

import AuthShell from '../components/AuthShell';

const MIN_PASSWORD_LENGTH = 8;
const STRENGTH_SEGMENTS = 4;

interface PasswordStrength {
  score: number;
  label: string;
  bar: string;
  text: string;
}

function passwordStrength(value: string): PasswordStrength {
  if (value.length < MIN_PASSWORD_LENGTH) {
    const missing = MIN_PASSWORD_LENGTH - value.length;
    return {
      score: 1,
      label: `Faltam ${missing} ${missing === 1 ? 'caractere' : 'caracteres'}`,
      bar: 'bg-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
    };
  }
  const extras = [
    /[a-z]/.test(value) && /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value) || value.length >= 12,
  ].filter(Boolean).length;
  if (extras >= 3) return { score: 4, label: 'Senha forte', bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
  if (extras === 2) return { score: 3, label: 'Senha boa', bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
  return { score: 2, label: 'Senha razoável', bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    workspaceName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTermsError('');
    if (!formData.name.trim()) {
      setError('Informe seu nome completo.');
      return;
    }
    if (formData.phone.length < 12) {
      setError('Informe um telefone válido com código do país (DDI) e DDD.');
      return;
    }
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    if (!acceptTerms) {
      setTermsError('Para criar a conta, aceite os Termos de Serviço e a Política de Privacidade.');
      return;
    }
    setIsLoading(true);
    try {
      const { confirmPassword: _confirmPassword, ...payload } = formData;
      await authService.register(payload);
      router.push('/get-started');
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta. Tente de novo em alguns instantes.');
    }
    finally {
      setIsLoading(false);
    }
  };
  const strength = passwordStrength(formData.password);
  // Só acusa divergência depois que a confirmação começou a ser digitada.
  const confirmMismatch =
    formData.confirmPassword.length > 0 && formData.confirmPassword !== formData.password;

  return (<AuthShell themed title="Crie sua conta" subtitle="Comece a automatizar seu atendimento hoje mesmo.">
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (<div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
        {error}
      </div>)}

      <Input label="Nome Completo" type="text" name="name" placeholder="João Silva" value={formData.name} onChange={handleChange} required autoComplete="name"/>
      <Input label="Nome da Empresa" type="text" name="workspaceName" placeholder="Minha Loja Ltda" value={formData.workspaceName} onChange={handleChange} required minLength={2}/>
      <Input label="E-mail" type="email" name="email" placeholder="seu@email.com" value={formData.email} onChange={handleChange} required autoComplete="email"/>
      <Input label="Telefone" type="tel" name="phone" inputMode="numeric" placeholder="+55 (11) 99999-9999" value={formatPhoneNumber(formData.phone)} onChange={(e) => setFormData((prev) => ({ ...prev, phone: extractPhoneDigits(e.target.value) }))} required autoComplete="tel" hint="Inclua o código do país (DDI) e o DDD."/>
      <div>
        <Input label="Senha" type={showPassword ? 'text' : 'password'} name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" hint={`Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres. Misturar letras, números e símbolos deixa a senha mais segura.`} rightElement={<button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" tabIndex={-1}>
          {showPassword ? <EyeOff size={18} aria-hidden="true"/> : <Eye size={18} aria-hidden="true"/>}
        </button>}/>

        {formData.password.length > 0 && (
          <div className="mt-2" aria-live="polite">
            <div className="flex gap-1" aria-hidden="true">
              {Array.from({ length: STRENGTH_SEGMENTS }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < strength.score ? strength.bar : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <p className={`mt-1 text-xs font-medium ${strength.text}`}>{strength.label}</p>
          </div>
        )}
      </div>

      <Input
        label="Confirmar senha"
        type={showConfirm ? 'text' : 'password'}
        name="confirmPassword"
        placeholder="••••••••"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        autoComplete="new-password"
        error={confirmMismatch ? 'As senhas não conferem.' : undefined}
        rightElement={<button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Esconder senha' : 'Mostrar senha'} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" tabIndex={-1}>
          {showConfirm ? <EyeOff size={18} aria-hidden="true"/> : <Eye size={18} aria-hidden="true"/>}
        </button>}/>

      <Checkbox id="termos" checked={acceptTerms} onChange={(checked) => {
        setAcceptTerms(checked);
        if (checked) setTermsError('');
      }} {...(termsError ? { error: termsError } : {})} label={<span className="text-xs text-slate-500 dark:text-slate-400">
              Eu concordo com os{' '}
        <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Termos de Serviço
        </a>{' '}
              e{' '}
        <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Política de Privacidade
        </a>
              .
      </span>}/>

      <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg dark:shadow-none dark:hover:shadow-none transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none">
        {isLoading ? 'Criando conta...' : 'Criar Conta'}
      </button>
    </form>

    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
      <p className="text-sm text-slate-500 dark:text-slate-400">
          Já tem uma conta?{' '}
        <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
            Fazer Login
        </Link>
      </p>
      <Link href="/" className="mt-4 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center gap-1 w-full">
        Voltar para o início
      </Link>
    </div>
  </AuthShell>);
}
