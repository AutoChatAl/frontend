'use client';

import { Bot } from 'lucide-react';
import { useState } from 'react';

import AIChannelsList from './components/AIChannelsList';
import AIIdentitySection from './components/AIIdentitySection';
import AIPromptPreview from './components/AIPromptPreview';
import AIRulesSection from './components/AIRulesSection';
import AITabs from './components/AITabs';

import { useAIConfig } from '@/hooks/AIHooks';

export default function IAPage() {
  const [activeTab, setActiveTab] = useState('general');
  const {
    segment,
    setSegment,
    tone,
    setTone,
    products,
    setProducts,
    channels,
    toggleChannel,
    rules,
    toggleRule,
    saveConfig,
  } = useAIConfig();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Inteligência Artificial</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Configure o cérebro do seu assistente virtual</p>
      </div>

      <AITabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AIIdentitySection
            segment={segment}
            tone={tone}
            products={products}
            onSegmentChange={setSegment}
            onToneChange={setTone}
            onProductsChange={setProducts}
          />
          <AIPromptPreview segment={segment} tone={tone} products={products} />
        </div>
      )}

      {activeTab === 'channels' && (
        <div className="space-y-6">
          <AIChannelsList channels={channels} onToggleChannel={toggleChannel} />
        </div>
      )}

      {activeTab === 'triggers' && <AIRulesSection rules={rules} onToggleRule={toggleRule} />}

      <div className="flex justify-end pt-4">
        <button
          onClick={saveConfig}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none text-sm font-medium flex items-center gap-2"
        >
          <Bot size={18} />
          Salvar Alterações na IA
        </button>
      </div>
    </div>
  );
}
