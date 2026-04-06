'use client';

import { useEffect, useState } from 'react';

import { authService } from '@/services/auth.service';

import AccountTab from './components/AccountTab';
import BillingTab from './components/BillingTab';
import MembersTab from './components/MembersTab';
import NotificationsTab from './components/NotificationsTab';
import SecurityTab from './components/SecurityTab';
import SettingsNav from './components/SettingsNav';

const TABS: Record<string, React.ReactNode> = {
  account: <AccountTab />,
  notifications: <NotificationsTab />,
  security: <SecurityTab />,
  billing: <BillingTab />,
  members: <MembersTab />,
};

const OWNER_ONLY_TABS = ['notifications', 'billing', 'members'];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [role, setRole] = useState<string>('owner');

  useEffect(() => {
    const user = authService.getUser();
    if (user?.role) setRole(user.role);
  }, []);

  const handleTabChange = (tab: string) => {
    if (role === 'collaborator' && OWNER_ONLY_TABS.includes(tab)) return;
    setActiveTab(tab);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Configurações Gerais</h2>

      <SettingsNav activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="space-y-6">
        {TABS[activeTab]}
      </div>
    </div>
  );
};

export default SettingsPage;
