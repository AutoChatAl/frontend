'use client';

import { Bot, Loader2 } from 'lucide-react';
import { useState } from 'react';

import PageLoader from '@/components/PageLoader';
import { ToastContainer } from '@/components/Toast';
import { useAIConfig } from '@/hooks/AIHooks';

import AIChannelsList from './components/AIChannelsList';
import AIIdentitySection from './components/AIIdentitySection';
import AIPromptPreview from './components/AIPromptPreview';
import AIRulesSection from './components/AIRulesSection';
import AISchedulingSection from './components/AISchedulingSection';
import AITabs from './components/AITabs';

export default function IAPage() {
  const [activeTab, setActiveTab] = useState('general');
  const {
    segment,
    setSegment,
    businessName,
    setBusinessName,
    assistantName,
    setAssistantName,
    tone,
    setTone,
    customRules,
    setCustomRules,
    triggerSettings,
    setTriggerSettings,
    schedulingQueryEnabled,
    setSchedulingQueryEnabled,
    schedulingBookingEnabled,
    setSchedulingBookingEnabled,
    products,
    channels,
    activeChannelId: _activeChannelId,
    loading,
    saving,
    saveConfig,
    toggleChannel,
    addProduct,
    updateProduct,
    deleteProduct,
    toasts,
    removeToast,
    visibleTabs,
  } = useAIConfig();

  if (loading) {
    return <PageLoader message="Carregando configurações de IA" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Inteligência Artificial</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Configure o cérebro do seu assistente virtual</p>
      </div>

      <AITabs activeTab={activeTab} onTabChange={setActiveTab} visibleTabs={visibleTabs} />

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AIIdentitySection
            segment={segment}
            businessName={businessName}
            assistantName={assistantName}
            tone={tone}
            products={products}
            onSegmentChange={setSegment}
            onBusinessNameChange={setBusinessName}
            onAssistantNameChange={setAssistantName}
            onToneChange={setTone}
            onAddProduct={addProduct}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
          />
          <AIPromptPreview
            segment={segment}
            businessName={businessName}
            assistantName={assistantName}
            tone={tone}
            products={products}
          />
        </div>
      )}

      {activeTab === 'channels' && (
        <div className="space-y-6">
          <AIChannelsList channels={channels} onToggle={toggleChannel} />
        </div>
      )}

      {activeTab === 'triggers' && (
        <AIRulesSection
          customRules={customRules}
          triggerSettings={triggerSettings}
          onCustomRulesChange={setCustomRules}
          onToggleTrigger={(triggerKey) => setTriggerSettings((prev) => ({ ...prev, [triggerKey]: !prev[triggerKey] }))}
        />
      )}

      {activeTab === 'scheduling' && (
        <AISchedulingSection
          schedulingQueryEnabled={schedulingQueryEnabled}
          schedulingBookingEnabled={schedulingBookingEnabled}
          onToggleQuery={setSchedulingQueryEnabled}
          onToggleBooking={setSchedulingBookingEnabled}
        />
      )}

      {(activeTab === 'general' || activeTab === 'triggers') && (
        <div className="flex justify-end pt-4">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200 dark:shadow-none text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />}
            {saving ? 'Salvando...' : 'Salvar Alterações na IA'}
          </button>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
