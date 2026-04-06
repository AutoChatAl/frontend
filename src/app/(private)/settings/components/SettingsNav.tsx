'use client';

import { Bell, CreditCard, Shield, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { authService } from '@/services/auth.service';

const ALL_NAV_ITEMS = [
  { id: 'account', label: 'Conta', icon: User, ownerOnly: false },
  { id: 'notifications', label: 'Notificações', icon: Bell, ownerOnly: true },
  { id: 'security', label: 'Segurança', icon: Shield, ownerOnly: false },
  { id: 'billing', label: 'Faturamento', icon: CreditCard, ownerOnly: true },
  { id: 'members', label: 'Membros', icon: Users, ownerOnly: true },
];

interface SettingsNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function SettingsNav({ activeTab, onTabChange }: SettingsNavProps) {
  const [role, setRole] = useState<string>('owner');

  useEffect(() => {
    const user = authService.getUser();
    if (user?.role) setRole(user.role);
  }, []);

  const visibleItems = ALL_NAV_ITEMS.filter((item) => {
    if (item.ownerOnly && role === 'collaborator') return false;
    return true;
  });

  return (
    <div className="grid gap-1.5 sm:gap-1 bg-slate-100 dark:bg-slate-800 p-1 sm:p-1 rounded-lg" style={{ gridTemplateColumns: `repeat(${Math.min(visibleItems.length, 5)}, minmax(0, 1fr))` }}>
      {visibleItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2 text-[10px] sm:text-xs font-medium rounded-md transition-all ${
              isActive
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <item.icon size={14} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
            <span className="leading-tight text-center">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
