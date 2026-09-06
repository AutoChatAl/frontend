'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import Header from '@/components/Header';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import Sidebar from '@/components/Sidebar';
import Skeleton, { SkeletonCards, SkeletonPage, SkeletonStats } from '@/components/Skeleton';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import SupportChatWidget from '@/components/support-chat/SupportChatWidget';
import TrialBanner from '@/components/TrialBanner';
import TrialWelcomeModal from '@/components/TrialWelcomeModal';
import { ChannelStatusProvider } from '@/contexts/ChannelStatusContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { SidebarProvider, canAccessPathname, resolveLandingRoute } from '@/contexts/SidebarContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { SupportChatProvider } from '@/contexts/SupportChatContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { authService, type AuthUser } from '@/services/auth.service';
import { getInitials } from '@/utils/displayName';

export default function PrivateLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  // Só vira true quando o /me responde — o guard de rota abaixo depende disso.
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
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
      authService.fetchMe()
        .then((fresh) => {
          setUser(fresh);
          setPermissionsLoaded(true);
        })
        .catch(() => { });
    };
    checkAuth();
  }, [router]);
  // A sidebar já esconde o que o colaborador não pode abrir, mas URL digitada à
  // mão não passa por ela: sem esta guarda a pessoa cairia numa tela que só
  // devolve 403. Redireciona para a primeira área liberada.
  useEffect(() => {
    // Espera o /me: o `auth_user` do localStorage pode estar defasado (por
    // exemplo, logo após um deploy que criou permissões novas) e redirecionar
    // por causa dele tiraria a pessoa de uma página que ela pode abrir.
    if (!permissionsLoaded || !user || !pathname) return;
    if (!canAccessPathname(user, pathname)) {
      router.replace(resolveLandingRoute(user));
    }
  }, [permissionsLoaded, user, pathname, router]);
  if (!isAuthenticated) {
    /**
     * A checagem de sessão é síncrona (lê o token do localStorage), mas roda num
     * efeito — ou seja, só depois do primeiro render. Um spinner de tela cheia
     * aqui pisca um visual completamente diferente do app entre o login e a
     * página, e era o que fazia a entrada parecer lenta. O esqueleto da casca
     * mostra a mesma forma que vem a seguir, então a troca não salta.
     */
    return (<div className="flex h-screen animate-pulse overflow-hidden bg-gray-50 dark:bg-slate-900" aria-busy="true" aria-label="Carregando">
      <div className="hidden w-56 shrink-0 border-r border-slate-100 p-3 dark:border-slate-700/60 lg:block">
        <Skeleton className="h-8 w-32"/>
        <div className="mt-6 space-y-2">
          {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-8 w-full"/>)}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700/60">
          <Skeleton className="h-6 w-40"/>
          <Skeleton className="h-8 w-8 rounded-full"/>
        </div>
        <div className="flex-1 p-3 sm:p-5">
          <SkeletonPage><SkeletonStats count={4}/><SkeletonCards count={3}/></SkeletonPage>
        </div>
      </div>
    </div>);
  }
  const userName = user?.name || user?.email || '';
  const userRole = user?.role;
  const userInitials = getInitials(userName);
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
                <div className="flex flex-col flex-1 min-w-0">
                  <Header />
                  <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 bg-gray-50 dark:bg-slate-900">
                    <TrialBanner />
                    <SubscriptionBanner />
                    <TrialWelcomeModal />
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
