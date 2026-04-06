'use client';

import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type Status = 'loading' | 'success' | 'error';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const igConnected = searchParams.get('ig_connected');
    const igError = searchParams.get('ig_error');

    if (igConnected === 'true') {
      setStatus('success');
    } else if (igError) {
      setStatus('error');
      setErrorMessage(decodeURIComponent(igError));
    } else {
      setStatus('error');
      setErrorMessage('Parâmetros inválidos');
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'loading') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.close();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
        {/* Instagram gradient bar */}
        <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 -mt-8 mb-6" />

        {status === 'loading' && (
          <>
            <div className="flex justify-center">
              <Loader2 size={56} className="text-purple-500 animate-spin" />
            </div>
            <h1 className="text-xl font-semibold text-slate-800">Conectando...</h1>
            <p className="text-slate-500">Aguarde enquanto processamos a conexão.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={48} className="text-green-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Conta conectada!</h1>
            <p className="text-slate-500">
              Sua conta do Instagram foi conectada com sucesso ao Synq.
            </p>
            <p className="text-sm text-slate-400">
              Esta janela será fechada em {countdown}s...
            </p>
            <button
              onClick={() => window.close()}
              className="mt-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Fechar janela
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle size={48} className="text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Erro na conexão</h1>
            <p className="text-slate-500">
              Não foi possível conectar sua conta do Instagram.
            </p>
            {errorMessage && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}
            <p className="text-sm text-slate-400">
              Esta janela será fechada em {countdown}s...
            </p>
            <button
              onClick={() => window.close()}
              className="mt-2 px-6 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
            >
              Fechar janela
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <Loader2 size={40} className="text-purple-500 animate-spin" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
