'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { ChannelStatusProvider } from '@/contexts/ChannelStatusContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { authService, type AuthUser } from '@/services/auth.service';
import { type MessageUsage, planLimitsService } from '@/services/plan-limits.service';

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [messageUsage, setMessageUsage] = useState<MessageUsage | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      const usage = await planLimitsService.getMessageUsage();
      setMessageUsage(usage);
    } catch {}
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }
      setIsAuthenticated(true);

      const cached = authService.getUser();
      if (cached) {
        setUser(cached);
      }
      authService.fetchMe().then(setUser).catch(() => {});
      fetchUsage();
    };

    checkAuth();
  }, [router, fetchUsage]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(fetchUsage, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUsage]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  const userName = user?.name || user?.email || '';
  const userRole = user?.role === 'collaborator' ? 'Colaborador' : 'Admin';
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n));
  const planUsageText = messageUsage
    ? `${formatCount(messageUsage.count)} / ${messageUsage.limit} mensagens`
    : '';
  const planProgress = messageUsage
    ? Math.min(Math.round((messageUsage.count / messageUsage.limit) * 100), 100)
    : 0;

  return (
    <ThemeProvider>
      <SidebarProvider>
        <ChannelStatusProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar
              userName={userName}
              userRole={userRole}
              userInitials={userInitials}
              planUsage={planUsageText}
              planProgress={planProgress}
            />
            <div className="flex flex-col flex-1">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-slate-900">
                {children}
              </main>
            </div>
          </div>
        </ChannelStatusProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
