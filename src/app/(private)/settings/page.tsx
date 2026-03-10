'use client';

import { useState } from 'react';

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

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('account');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações Gerais</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <SettingsNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="md:col-span-2 space-y-6">
          {TABS[activeTab]}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
