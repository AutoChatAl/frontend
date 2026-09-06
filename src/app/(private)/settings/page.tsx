'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { authService } from '@/services/auth.service';

import AccountTab from './components/AccountTab';
import AttendanceTab from './components/AttendanceTab';
import BillingTab from './components/BillingTab';
import MembersTab from './components/MembersTab';
import NotificationsTab from './components/NotificationsTab';
import SecurityTab from './components/SecurityTab';
import SettingsNav, { resolveSettingsTabs } from './components/SettingsNav';

const TABS: Record<string, React.ReactNode> = {
  account: <AccountTab />,
  notifications: <NotificationsTab />,
  security: <SecurityTab />,
  billing: <BillingTab />,
  members: <MembersTab />,
  attendance: <AttendanceTab />,
};
const SettingsPage = () => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState('account');
  const [role, setRole] = useState<string>('owner');
  useEffect(() => {
    const user = authService.getUser();
    if (user?.role)
      setRole(user.role);
  }, []);
  const allowedTabs = useMemo(() => resolveSettingsTabs(role).map((item) => item.id), [role]);
  // Abre uma aba direto pela URL (?tab=), usado pela busca do header.
  useEffect(() => {
    if (tabParam && allowedTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam, allowedTabs]);
  // Colaborador parado numa aba de dono volta para a primeira liberada em vez de ver a área vazia.
  useEffect(() => {
    const [firstTab] = allowedTabs;
    if (firstTab && !allowedTabs.includes(activeTab)) {
      setActiveTab(firstTab);
    }
  }, [allowedTabs, activeTab]);
  const handleTabChange = (tab: string) => {
    if (allowedTabs.includes(tab)) {
      setActiveTab(tab);
    }
  };
  return (<div className="w-full max-w-full space-y-3">
    <div className="min-w-0">
      <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Configurações</h1>
      <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
        Dados do workspace, notificações, segurança, plano e quem tem acesso
      </p>
    </div>

    {/* Nav à esquerda e conteúdo ao lado; no mobile a nav vira chips em cima. */}
    <div className="flex flex-col gap-4 lg:flex-row">
      <div data-tour="settings-nav" className="lg:w-52 lg:shrink-0">
        <SettingsNav activeTab={activeTab} onTabChange={handleTabChange} role={role}/>
      </div>

      <div className="min-w-0 flex-1">
        {TABS[activeTab]}
      </div>
    </div>
  </div>);
};
export default SettingsPage;
