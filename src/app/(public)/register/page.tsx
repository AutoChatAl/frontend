'use client';
import { Eye, EyeOff } from 'lucide-react';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import Checkbox from '@/components/Checkbox';
import Input from '@/components/Input';
import { authService } from '@/services/auth.service';
import { extractPhoneDigits, formatPhoneNumber } from '@/utils/phone';

import AuthShell from '../components/AuthShell';

// Requisitos da senha. A quantidade de regras atendidas também é a força mostrada
// na barra, então não existe um segundo critério para as duas coisas divergirem.
const PASSWORD_RULES = [
  { label: 'No mínimo 6 caracteres', test: (value: string) => value.length >= 6 },
  { label: 'Uma letra maiúscula', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Uma letra minúscula', test: (value: string) => /[a-z]/.test(value) },
  { label: 'Um símbolo especial', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

function strengthMeta(score: number): { label: string; bar: string; text: string } {
  if (score >= PASSWORD_RULES.length) {
    return { label: 'Senha forte', bar: 'bg-emerald-500', text: 'text-emerald-600' };
  }
  if (score === 3) return { label: 'Senha média', bar: 'bg-amber-500', text: 'text-amber-600' };
  return { label: 'Senha fraca', bar: 'bg-rose-500', text: 'text-rose-600' };
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
    if (!formData.name.trim()) {
      setError('Informe seu nome completo.');
      return;
    }
    if (formData.phone.length < 12) {
      setError('Informe um telefone válido com código do país (DDI) e DDD.');
      return;
    }
    if (PASSWORD_RULES.some((rule) => !rule.test(formData.password))) {
      setError('A senha precisa atender a todos os requisitos listados.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    if (!acceptTerms) {
      setError('Você precisa aceitar os Termos de Serviço e Política de Privacidade');
      return;
    }
    setIsLoading(true);
    try {
      const { confirmPassword: _confirmPassword, ...payload } = formData;
      await authService.register(payload);
      router.push('/get-started');
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    }
    finally {
      setIsLoading(false);
    }
  };
  const passwordScore = PASSWORD_RULES.filter((rule) => rule.test(formData.password)).length;
  const strength = strengthMeta(passwordScore);
  // Só acusa divergência depois que a confirmação começou a ser digitada.
  const confirmMismatch =
    formData.confirmPassword.length > 0 && formData.confirmPassword !== formData.password;

  return (<AuthShell title="Crie sua conta" subtitle="Comece a automatizar seu atendimento hoje mesmo.">
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (<div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
        {error}
      </div>)}

      <Input label="Nome Completo" type="text" name="name" placeholder="João Silva" value={formData.name} onChange={handleChange} required autoComplete="name"/>
      <Input label="Nome da Empresa" type="text" name="workspaceName" placeholder="Minha Loja Ltda" value={formData.workspaceName} onChange={handleChange} required minLength={2}/>
      <Input label="Email" type="email" name="email" placeholder="seu@email.com" value={formData.email} onChange={handleChange} required autoComplete="email"/>
      <Input label="Telefone" type="tel" name="phone" inputMode="numeric" placeholder="+55 (11) 99999-9999" value={formatPhoneNumber(formData.phone)} onChange={(e) => setFormData((prev) => ({ ...prev, phone: extractPhoneDigits(e.target.value) }))} required autoComplete="tel" hint="Inclua o código do país (DDI) e o DDD."/>
      <div>
        <Input label="Senha" type={showPassword ? 'text' : 'password'} name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength={6} autoComplete="new-password" rightElement={<button type="button" onClick={() => setShowPassword((v) => !v)} className="text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
          {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
        </button>}/>

        {formData.password.length > 0 && (
          <div className="mt-2">
            <div className="flex gap-1" aria-hidden="true">
              {PASSWORD_RULES.map((rule, i) => (
                <span
                  key={rule.label}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < passwordScore ? strength.bar : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <p className={`mt-1 text-xs font-medium ${strength.text}`}>{strength.label}</p>
          </div>
        )}

        <ul className="mt-2 space-y-1">
          {PASSWORD_RULES.map((rule) => {
            const done = rule.test(formData.password);
            return (
              <li key={rule.label} className="flex items-center gap-1.5 text-xs">
                <span
                  className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full transition-colors ${
                    done ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}
                >
                  <Check size={9} strokeWidth={3} className={done ? 'text-emerald-600' : 'text-slate-300'}/>
                </span>
                <span className={done ? 'text-slate-600' : 'text-slate-400'}>{rule.label}</span>
              </li>
            );
          })}
        </ul>
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
        rightElement={<button type="button" onClick={() => setShowConfirm((v) => !v)} className="text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
          {showConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}
        </button>}/>

      <Checkbox checked={acceptTerms} onChange={setAcceptTerms} label={<span className="text-xs text-slate-500">
              Eu concordo com os{' '}
        <a href="#" className="text-indigo-600 hover:underline">
                Termos de Serviço
        </a>{' '}
              e{' '}
        <a href="#" className="text-indigo-600 hover:underline">
                Política de Privacidade
        </a>
              .
      </span>}/>

      <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none">
        {isLoading ? 'Criando conta...' : 'Criar Conta'}
      </button>
    </form>

    <div className="mt-6 pt-6 border-t border-slate-100 text-center">
      <p className="text-sm text-slate-500">
          Já tem uma conta?{' '}
        <Link href="/login" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
            Fazer Login
        </Link>
      </p>
      <Link href="/" className="mt-4 text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 w-full">
        Voltar para o início
      </Link>
    </div>
  </AuthShell>);
}
