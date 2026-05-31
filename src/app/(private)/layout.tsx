'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import Header from '@/components/Header';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import Sidebar from '@/components/Sidebar';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import SupportChatWidget from '@/components/support-chat/SupportChatWidget';
import TrialBanner from '@/components/TrialBanner';
import { ChannelStatusProvider } from '@/contexts/ChannelStatusContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { SupportChatProvider } from '@/contexts/SupportChatContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { authService, type AuthUser } from '@/services/auth.service';

export default function PrivateLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
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
      authService.fetchMe().then(setUser).catch(() => { });
    };
    checkAuth();
  }, [router]);
  if (!isAuthenticated) {
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Verificando autenticação...</p>
      </div>
    </div>);
  }
  const userName = user?.name || user?.email || '';
  const userRole = user?.role;
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
  const isAdmin = user?.role === 'admin';

  const onboardingEnabled = isAuthenticated && !isAdmin;

  return (<ThemeProvider>
    <SubscriptionProvider>
      <SidebarProvider showSupportTab={isAdmin}>
        <ChannelStatusProvider>
          <SupportChatProvider>
            <OnboardingProvider enabled={onboardingEnabled}>
              <div className="flex h-screen overflow-hidden">
                <Sidebar userName={userName} userInitials={userInitials} {...(userRole !== undefined && { userRole })}/>
                <div className="flex flex-col flex-1">
                  <Header />
                  <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-slate-900">
                    <TrialBanner />
                    <SubscriptionBanner />
                    {children}
                  </main>
                </div>
              </div>
              {!isAdmin && <SupportChatWidget />}
              {onboardingEnabled && <OnboardingTour />}
            </OnboardingProvider>
          </SupportChatProvider>
        </ChannelStatusProvider>
      </SidebarProvider>
    </SubscriptionProvider>
  </ThemeProvider>);
}
