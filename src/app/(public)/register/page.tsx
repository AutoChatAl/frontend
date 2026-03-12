'use client';

import { ArrowDownRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import AuthShell from '../components/AuthShell';

import Checkbox from '@/components/Checkbox';
import Input from '@/components/Input';
import { authService } from '@/services/auth.service';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    workspaceName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
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

    if (!acceptTerms) {
      setError('Você precisa aceitar os Termos de Serviço e Política de Privacidade');
      return;
    }

    setIsLoading(true);

    try {
      await authService.register(formData);
      router.push('/campaigns');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="Crie sua conta" subtitle="Comece a automatizar seu atendimento hoje mesmo.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Nome Completo"
          type="text"
          name="name"
          placeholder="João Silva"
          value={formData.name}
          onChange={handleChange}
          autoComplete="name"
        />
        <Input
          label="Nome da Empresa"
          type="text"
          name="workspaceName"
          placeholder="Minha Loja Ltda"
          value={formData.workspaceName}
          onChange={handleChange}
          required
          minLength={2}
        />
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />
        <div>
          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
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
          <p className="text-xs text-slate-500 mt-1">Mínimo de 8 caracteres</p>
        </div>

        <Checkbox
          checked={acceptTerms}
          onChange={setAcceptTerms}
          label={
            <span className="text-xs text-slate-500">
              Eu concordo com os{' '}
              <a href="#" className="text-indigo-600 hover:underline">
                Termos de Serviço
              </a>{' '}
              e{' '}
              <a href="#" className="text-indigo-600 hover:underline">
                Política de Privacidade
              </a>
              .
            </span>
          }
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
        >
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
