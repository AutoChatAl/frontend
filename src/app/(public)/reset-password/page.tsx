'use client';

import { ArrowDownRight, CheckCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, Suspense } from 'react';

import AuthShell from '../components/AuthShell';

import Input from '@/components/Input';
import { authService } from '@/services/auth.service';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
          Link de recuperação inválido ou expirado.
        </div>
        <Link
          href="/forgot-password"
          className="block w-full text-center bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center py-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Senha redefinida!</h3>
          <p className="text-sm text-slate-500 text-center">
            Sua senha foi alterada com sucesso. Redirecionando para o login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <Input
          label="Nova senha"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />
      </div>

      <Input
        label="Confirmar nova senha"
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
      >
        {isLoading ? 'Redefinindo...' : 'Redefinir senha'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Redefinir senha" subtitle="Crie uma nova senha para sua conta.">
      <Suspense fallback={<div className="py-8 text-center text-slate-400">Carregando...</div>}>
        <ResetPasswordForm />
      </Suspense>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <Link
          href="/login"
          className="text-sm text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
        >
          Voltar para Login
        </Link>
        <Link
          href="/"
          className="mt-4 text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 w-full"
        >
          <ArrowDownRight size={12} className="rotate-180" /> Voltar para o início
        </Link>
      </div>
    </AuthShell>
  );
}
