'use client';

const TABS: { id: string; label: string }[] = [
  { id: 'calendar', label: 'Calendário' },
  { id: 'business-hours', label: 'Horários' },
  { id: 'integrations', label: 'Integrações' },
];

interface SchedulingTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

/**
 * Navegação lateral no desktop, fila rolável no mobile — coluna de 3 itens numa
 * tela de celular desperdiça a altura que o conteúdo precisa.
 */
export default function SchedulingTabs({ activeTab, onTabChange }: SchedulingTabsProps) {
  return (
    <nav
      aria-label="Seções de agendamento"
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
    >
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-current={active ? 'page' : undefined}
            className={`shrink-0 cursor-pointer truncate rounded-lg px-3 py-2 text-left text-[13px] font-semibold transition-colors lg:w-full ${
              active
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
