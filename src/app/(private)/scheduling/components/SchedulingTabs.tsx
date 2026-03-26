'use client';

import { Calendar, Clock } from 'lucide-react';

const tabs = [
  { id: 'calendar', label: 'Calendário', icon: Calendar },
  { id: 'business-hours', label: 'Horários', icon: Clock },
];

interface SchedulingTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function SchedulingTabs({ activeTab, onTabChange }: SchedulingTabsProps) {
  return (
    <div>
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full sm:w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap flex-1 sm:flex-initial justify-center sm:justify-start
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
