'use client';
import { Bot } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import Button from '@/components/Button';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import PageLoader from '@/components/PageLoader';
import { ToastContainer } from '@/components/Toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAIConfig } from '@/hooks/AIHooks';

import AICatalogSection from './components/AICatalogSection';
import AIChannelsList from './components/AIChannelsList';
import AIFunnelSection from './components/AIFunnelSection';
import AIIdentitySection from './components/AIIdentitySection';
import AiPlanGate from './components/AiPlanGate';
import AIProductsImportModal from './components/AIProductsImportModal';
import AIPromptPreview from './components/AIPromptPreview';
import AIRulesSection from './components/AIRulesSection';
import AISchedulingSection from './components/AISchedulingSection';
import AITabs, { resolveAiTabs } from './components/AITabs';

/** Abas cujos campos ficam em rascunho até o usuário salvar. As outras gravam a cada clique. */
const TABS_WITH_DRAFT = ['general', 'triggers'];

export default function IAPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { hasAiPlan, loading: subLoading, status } = useSubscription();
  const schedulingQueryAllowed = !!status?.limits?.schedulingQueryEnabled;
  const schedulingBookingAllowed = !!status?.limits?.schedulingBookingEnabled;
  const [activeTab, setActiveTab] = useState('general');
  const [importOpen, setImportOpen] = useState(false);
  const [clearCatalogOpen, setClearCatalogOpen] = useState(false);
  const { segment, setSegment, businessName, setBusinessName, assistantName, setAssistantName, tone, setTone, customRules, setCustomRules, triggerSettings, setTriggerSettings, schedulingQueryEnabled, schedulingBookingEnabled, funnelAutoMoveEnabled, crossSellEnabled, funnelStages, products, productsTotal, productsLoading, productSearch, productPage, productsPageSize, maxProducts, setProductSearch, goToProductPage, clearProducts, importProducts, channels, activeChannelId: _activeChannelId, loading, saving, saveConfig, toggleChannel, toggleSchedulingQuery, toggleSchedulingBooking, toggleFunnelAutoMove, toggleCrossSell, addProduct, updateProduct, deleteProduct, instagramProductLayout, changeProductLayout, uploadProductImage, removeProductImage, toasts, removeToast, visibleTabs } = useAIConfig();
  const tabIds = useMemo(() => resolveAiTabs(visibleTabs).map((tab) => tab.id), [visibleTabs]);
  // Abre uma aba direto pela URL (?tab=), usado pela busca do header.
  useEffect(() => {
    if (tabParam && tabIds.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam, tabIds]);
  // Papel sem acesso à aba selecionada cai na primeira liberada em vez de ver a área vazia.
  useEffect(() => {
    const [firstTab] = tabIds;
    if (firstTab && !tabIds.includes(activeTab)) {
      setActiveTab(firstTab);
    }
  }, [tabIds, activeTab]);
  if (subLoading || loading) {
    return <PageLoader message="Carregando configurações de IA"/>;
  }
  if (!hasAiPlan) {
    return <AiPlanGate />;
  }
  return (<div className="w-full max-w-full space-y-3">
    <div className="min-w-0">
      <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Inteligência Artificial</h1>
      <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
        Quem é o assistente, o que ele pode oferecer e até onde ele age sozinho
      </p>
    </div>

    {/* Nav à esquerda e conteúdo ao lado; no mobile a nav vira uma fila rolável em cima. */}
    <div className="flex flex-col gap-4 lg:flex-row">
      <div data-tour="ia-tabs" className="lg:w-52 lg:shrink-0">
        <AITabs activeTab={activeTab} onTabChange={setActiveTab} visibleTabs={visibleTabs}/>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        {activeTab === 'general' && (<>
          <AIIdentitySection segment={segment} businessName={businessName} assistantName={assistantName} tone={tone} onSegmentChange={setSegment} onBusinessNameChange={setBusinessName} onAssistantNameChange={setAssistantName} onToneChange={setTone}/>
          <AIPromptPreview segment={segment} businessName={businessName} assistantName={assistantName} products={products}/>
        </>)}

        {activeTab === 'catalog' && (<AICatalogSection products={products} productsTotal={productsTotal} maxProducts={maxProducts} productsLoading={productsLoading} productSearch={productSearch} productPage={productPage} productsPageSize={productsPageSize} onProductSearchChange={setProductSearch} onProductPageChange={goToProductPage} onAddProduct={addProduct} onUpdateProduct={updateProduct} onDeleteProduct={deleteProduct} onOpenImport={() => setImportOpen(true)} onClearCatalog={() => setClearCatalogOpen(true)} crossSellEnabled={crossSellEnabled} onToggleCrossSell={toggleCrossSell} productLayout={instagramProductLayout} onProductLayoutChange={changeProductLayout} onUploadProductImage={uploadProductImage} onRemoveProductImage={removeProductImage}/>)}

        {activeTab === 'channels' && (<div data-tour="ia-channels">
          <AIChannelsList channels={channels} onToggle={toggleChannel}/>
        </div>)}

        {activeTab === 'triggers' && (<AIRulesSection customRules={customRules} triggerSettings={triggerSettings} onCustomRulesChange={setCustomRules} onToggleTrigger={(triggerKey) => setTriggerSettings((prev) => ({ ...prev, [triggerKey]: !prev[triggerKey] }))}/>)}

        {activeTab === 'scheduling' && (<AISchedulingSection schedulingQueryEnabled={schedulingQueryEnabled} schedulingBookingEnabled={schedulingBookingEnabled} schedulingQueryAllowed={schedulingQueryAllowed} schedulingBookingAllowed={schedulingBookingAllowed} onToggleQuery={toggleSchedulingQuery} onToggleBooking={toggleSchedulingBooking}/>)}

        {activeTab === 'funnel' && (<AIFunnelSection funnelAutoMoveEnabled={funnelAutoMoveEnabled} stages={funnelStages} onToggle={toggleFunnelAutoMove}/>)}

        {TABS_WITH_DRAFT.includes(activeTab) && (<div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            As mudanças desta aba só valem depois de salvar.
          </p>
          <Button onClick={saveConfig} loading={saving} loadingText="Salvando..." icon={<Bot size={16}/>} className="w-full justify-center sm:w-auto">
            Salvar alterações
          </Button>
        </div>)}
      </div>
    </div>

    <AIProductsImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImport={importProducts}/>

    <ConfirmDeleteModal isOpen={clearCatalogOpen} onClose={() => setClearCatalogOpen(false)} onConfirm={async () => { setClearCatalogOpen(false); await clearProducts(); }} title="Limpar catálogo" message="Todos os produtos e serviços cadastrados serão removidos. A IA deixa de conseguir citar itens até você cadastrar de novo. Esta ação não pode ser desfeita." confirmLabel="Limpar catálogo" loading={saving}/>

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
