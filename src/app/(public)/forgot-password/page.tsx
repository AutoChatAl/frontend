'use client';

import { ArrowDownRight, Mail } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

import AuthShell from '../components/AuthShell';

import Input from '@/components/Input';
import { authService } from '@/services/auth.service';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar email de recuperação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="Recuperar senha" subtitle="Informe seu email para receber o link de recuperação.">
      {sent ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Mail size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Email enviado!</h3>
            <p className="text-sm text-slate-500 text-center">
              Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
            </p>
          </div>
          <Link
            href="/login"
            className="block w-full text-center bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all"
          >
            Voltar para Login
          </Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
          >
            {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>
      )}

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          Lembrou sua senha?{' '}
          <Link href="/login" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
            Fazer login
          </Link>
        </p>
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
