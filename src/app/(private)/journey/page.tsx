'use client';
import { Code2, MousePointerClick, Route, type LucideIcon } from 'lucide-react';
import { useState } from 'react';

import { ToastContainer, useToast } from '@/components/Toast';

import ClicksOverview from './components/ClicksOverview';
import ContactJourney from './components/ContactJourney';
import SiteTrackingSetup from './components/SiteTrackingSetup';

type JourneyTab = 'clicks' | 'contacts' | 'site';

const TABS: { id: JourneyTab; label: string; icon: LucideIcon }[] = [
  { id: 'clicks', label: 'Cliques nos links', icon: MousePointerClick },
  { id: 'contacts', label: 'Jornada por contato', icon: Route },
  { id: 'site', label: 'Script do site', icon: Code2 },
];

export default function JourneyPage() {
  const [activeTab, setActiveTab] = useState<JourneyTab>('clicks');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const openContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setActiveTab('contacts');
  };

  return (
    <div className="w-full max-w-full space-y-3">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Jornada do cliente</h1>
        <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
          Quem clicou nos seus links, por onde passou no site e o que comprou
        </p>
      </div>

      <div role="tablist" aria-label="Seções da jornada" className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 px-1 dark:border-slate-700">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'clicks' && <ClicksOverview onOpenContact={openContact} />}
      {activeTab === 'contacts' && <ContactJourney selectedContactId={selectedContactId} onSelectContact={setSelectedContactId} />}
      {activeTab === 'site' && <SiteTrackingSetup onToast={addToast} />}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
