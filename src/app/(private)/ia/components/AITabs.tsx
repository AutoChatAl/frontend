'use client';

import { Settings, Share2, Zap } from 'lucide-react';

import type { AITab } from '@/types/AI';

const tabs: AITab[] = [
  { id: 'general', label: 'Configurações Gerais', icon: Settings },
  { id: 'channels', label: 'Canais', icon: Share2 },
  { id: 'triggers', label: 'Gatilhos & Regras', icon: Zap },
];

interface AITabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function AITabs({ activeTab, onTabChange }: AITabsProps) {
  return (
    <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all
            ${activeTab === tab.id
          ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}
          `}
        >
          <tab.icon size={16} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
