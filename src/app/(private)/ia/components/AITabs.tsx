'use client';

import { Settings, Share2, Zap, CalendarDays } from 'lucide-react';

import type { AITab } from '@/types/AI';

const tabs: AITab[] = [
  { id: 'general', label: 'Geral', icon: Settings },
  { id: 'channels', label: 'Canais', icon: Share2 },
  { id: 'triggers', label: 'Gatilhos', icon: Zap },
  { id: 'scheduling', label: 'Agendamento', icon: CalendarDays },
];

interface AITabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function AITabs({ activeTab, onTabChange }: AITabsProps) {
  return (
    <div>
      <div className="grid grid-cols-2 sm:flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full sm:w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap justify-center sm:justify-start
              ${activeTab === tab.id
            ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}
            `}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
