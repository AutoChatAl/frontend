'use client';

import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import Input from '@/components/Input';
import { authService } from '@/services/auth.service';
import { collaboratorService } from '@/services/collaborator.service';

import AuthShell from '../components/AuthShell';

function InviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token de convite não encontrado.');
      setLoading(false);
      return;
    }

    collaboratorService
      .validateInvite(token)
      .then((data) => {
        setWorkspaceName(data.workspaceName);
        setEmail(data.email);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Convite inválido.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await collaboratorService.acceptInvite(token, name, password);
      if (result.token) {
        authService.saveToken(result.token);
        if (result.user) {
          authService.saveUser(result.user);
        }
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aceitar convite.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AuthShell title="Convite" subtitle="Validando convite...">
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
        </div>
      </AuthShell>
    );
  }

  if (error && !email) {
    return (
      <AuthShell title="Convite Inválido" subtitle="Não foi possível processar o convite.">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={`Junte-se a ${workspaceName}`}
      subtitle="Complete seu cadastro para acessar o workspace."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <p className="text-sm text-indigo-800">
            Convite para: <strong>{email}</strong>
          </p>
        </div>

        <Input
          label="Seu nome"
          type="text"
          placeholder="João Silva"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          autoComplete="name"
        />

        <div>
          <Input
            label="Crie uma senha"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
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

        <button
          type="submit"
          disabled={submitting || !name || password.length < 8}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
        >
          {submitting ? 'Criando conta...' : 'Aceitar Convite e Entrar'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Convite" subtitle="Carregando...">
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
          </div>
        </AuthShell>
      }
    >
      <InviteForm />
    </Suspense>
  );
}
