'use client';

import { useEffect } from 'react';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[PublicLayout] Erro capturado:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
        <h1 className="text-xl font-bold text-red-600">Algo deu errado</h1>
        <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-left">
          <p className="text-sm font-mono text-red-700 break-all">{error.message || 'Erro desconhecido'}</p>
          {error.digest && (
            <p className="text-xs text-red-400 mt-1">digest: {error.digest}</p>
          )}
        </div>
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
