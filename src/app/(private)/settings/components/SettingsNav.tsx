'use client';

import { Bell, CreditCard, Shield, User, Users } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'account', label: 'Conta', icon: User },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'security', label: 'Segurança', icon: Shield },
  { id: 'billing', label: 'Faturamento', icon: CreditCard },
  { id: 'members', label: 'Membros', icon: Users },
];

interface SettingsNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function SettingsNav({ activeTab, onTabChange }: SettingsNavProps) {
  return (
    <div className="space-y-2">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
              isActive
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
            }`}
          >
            <item.icon
              size={18}
              className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}
            />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
