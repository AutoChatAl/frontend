'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { authService } from '@/services/auth.service';

export default function ComecarLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return <ThemeProvider>{children}</ThemeProvider>;
}
