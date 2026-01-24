'use client';

import { MessageCircle, Smartphone } from 'lucide-react';
import { useState } from 'react';

import InstagramInstances from '@/app/(private)/channels/components/InstagramInstances';
import WhatsAppInstances from '@/app/(private)/channels/components/WhatsAppInstances';

export default function ChannelsPage() {
  const [activeTab, setActiveTab] = useState('whatsapp');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Canais de Comunicação</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie suas conexões do WhatsApp e Instagram</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex shadow-sm">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'whatsapp' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <MessageCircle size={16} /> WhatsApp
          </button>
          <button
            onClick={() => setActiveTab('instagram')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'instagram' ? 'bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Smartphone size={16} /> Instagram
          </button>
        </div>
      </div>

      {activeTab === 'whatsapp' ? <WhatsAppInstances /> : <InstagramInstances />}
    </div>
  );
};
