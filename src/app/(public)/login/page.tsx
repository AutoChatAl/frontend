'use client';

import { ArrowDownRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import AuthShell from '../components/AuthShell';

import Input from '@/components/Input';
import { authService } from '@/services/auth.service';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.login({ email, password });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="Bem-vindo de volta!" subtitle="Insira suas credenciais para acessar sua conta.">
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
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700">Senha</label>
            <a href="#" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              Esqueceu a senha?
            </a>
          </div>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="current-password"
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
        >
          {isLoading ? 'Entrando...' : 'Entrar na Plataforma'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
            Criar conta grátis
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
