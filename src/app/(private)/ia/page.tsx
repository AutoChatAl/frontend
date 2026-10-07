'use client';
import { Bot } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { completeSetupStep } from '@/app/get-started/setupSteps';
import Button from '@/components/Button';
import Card from '@/components/Card';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import ImportExportMenu from '@/components/ImportExportMenu';
import SegmentedControl from '@/components/SegmentedControl';
import { SkeletonForm, SkeletonPage } from '@/components/Skeleton';
import { ToastContainer } from '@/components/Toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAIConfig } from '@/hooks/AIHooks';
import { useAuthUser } from '@/hooks/useAuthUser';
import { aiService } from '@/services/ai.service';

import AICatalogSection from './components/AICatalogSection';
import AIChannelsList from './components/AIChannelsList';
import AIFunnelSection from './components/AIFunnelSection';
import AIGuardrailsSection from './components/AIGuardrailsSection';
import AIIdentitySection from './components/AIIdentitySection';
import AIKnowledgeSection from './components/AIKnowledgeSection';
import AiPlanGate from './components/AiPlanGate';
import AIProductsImportModal from './components/AIProductsImportModal';
import AIProfileSwitcher from './components/AIProfileSwitcher';
import AIPromptPreview from './components/AIPromptPreview';
import AIRulesSection from './components/AIRulesSection';
import AISchedulingSection from './components/AISchedulingSection';
import AISimpleMode from './components/AISimpleMode';
import AISimulator from './components/AISimulator';
import AITabs, { resolveAiTabs } from './components/AITabs';

/** Abas cujos campos ficam em rascunho até o usuário salvar. As outras gravam a cada clique. */
const TABS_WITH_DRAFT = ['general', 'triggers'];

type AiViewMode = 'simple' | 'advanced';

function markAiTested(): void {
  void completeSetupStep('ai-test');
}

const VIEW_MODE_OPTIONS: ReadonlyArray<{ value: AiViewMode; label: string }> = [
  { value: 'simple', label: 'Modo simples' },
  { value: 'advanced', label: 'Configurações avançadas' },
];

export default function IAPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { hasAiPlan, loading: subLoading, status } = useSubscription();
  const user = useAuthUser();
  const canManageBilling = !user?.role || user.role === 'owner' || user.role === 'admin';
  const schedulingQueryAllowed = !!status?.limits?.schedulingQueryEnabled;
  const schedulingBookingAllowed = !!status?.limits?.schedulingBookingEnabled;
  const [activeTab, setActiveTab] = useState('general');
  const [viewMode, setViewMode] = useState<AiViewMode | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [clearCatalogOpen, setClearCatalogOpen] = useState(false);
  const { addToast, reloadConfig, segment, setSegment, businessName, setBusinessName, assistantName, setAssistantName, tone, setTone, customRules, setCustomRules, followUpMinutes, setFollowUpMinutes, followUpMessage, setFollowUpMessage, schedulingQueryEnabled, schedulingBookingEnabled, funnelAutoMoveEnabled, crossSellEnabled, knowledgeEnabled, toggleKnowledge, funnelStages, products, productsTotal, productsLoading, productSearch, productPage, productsPageSize, maxProducts, setProductSearch, goToProductPage, clearProducts, importProducts, channels, activeChannelId: _activeChannelId, enabled, loading, saving, saveConfig, saveSimpleSetup, toggleFollowUp, toggleChannel, toggleSchedulingQuery, toggleSchedulingBooking, toggleFunnelAutoMove, toggleCrossSell, addProduct, updateProduct, deleteProduct, instagramProductLayout, changeProductLayout, uploadProductImage, removeProductImage, toasts, removeToast, visibleTabs, profiles, activeProfileId, maxProfiles, switchingProfile, switchProfile, createProfile, renameProfile, deleteProfile, catalogScope, changeCatalogScope, maxCustomRulesChars } = useAIConfig();
  const customRulesLimit = maxCustomRulesChars > 0 ? maxCustomRulesChars : (status?.limits?.maxCustomRulesChars ?? 0);
  // Passar do limite é erro 422 garantido no backend — o botão trava antes de gastar a ida.
  const customRulesOverLimit = customRulesLimit > 0 && customRules.length > customRulesLimit;
  const tabIds = useMemo(() => resolveAiTabs(visibleTabs).map((tab) => tab.id), [visibleTabs]);
  // Abre uma aba direto pela URL (?tab=), usado pela busca do header.
  useEffect(() => {
    if (tabParam && tabIds.includes(tabParam)) {
      setActiveTab(tabParam);
      setViewMode('advanced');
    }
  }, [tabParam, tabIds]);
  useEffect(() => {
    if (loading || viewMode) {
      return;
    }
    const configured = enabled || !!(businessName.trim() || segment.trim() || customRules.trim());
    setViewMode(configured ? 'advanced' : 'simple');
  }, [loading, viewMode, enabled, businessName, segment, customRules]);
  // Papel sem acesso à aba selecionada cai na primeira liberada em vez de ver a área vazia.
  useEffect(() => {
    const [firstTab] = tabIds;
    if (firstTab && !tabIds.includes(activeTab)) {
      setActiveTab(firstTab);
    }
  }, [tabIds, activeTab]);
  if (subLoading || loading || (hasAiPlan && !viewMode)) {
    return <SkeletonPage><SkeletonForm fields={5}/></SkeletonPage>;
  }
  if (!hasAiPlan) {
    // Contratar plano é ação de cobrança, do dono. Mostrar a vitrine de planos a
    // um colaborador com permissão de IA só o deixa numa tela que ele não pode
    // concluir — o certo é dizer que a IA ainda não foi ativada na conta.
    return canManageBilling
      ? <AiPlanGate />
      : (<Card className="mx-auto mt-10 max-w-lg p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-500/10">
          <Bot size={24} className="text-violet-600 dark:text-violet-400"/>
        </div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
          A IA ainda não está ativa nesta conta
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
          Você tem permissão para configurar a inteligência artificial, mas o plano de IA
          precisa ser contratado pelo administrador da conta. Peça a ele para ativar e esta
          tela abre automaticamente.
        </p>
      </Card>);
  }
  return (<div className="w-full max-w-full space-y-3">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Inteligência Artificial</h1>
        <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
          {viewMode === 'simple'
            ? 'Responda 3 perguntas, ligue no seu WhatsApp ou Instagram e teste antes de liberar'
            : 'Quem é o assistente, o que ele pode oferecer e até onde ele age sozinho'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div data-tour={viewMode === 'simple' ? 'ia-tabs' : undefined}>
          <SegmentedControl
            ariaLabel="Como configurar a IA"
            options={VIEW_MODE_OPTIONS}
            value={viewMode ?? 'simple'}
            onChange={setViewMode}
          />
        </div>
        {viewMode === 'advanced' && (
          <ImportExportMenu
            resourceLabel="perfis de IA"
            onExport={() => aiService.exportProfilesCsv()}
            onImport={(csv) => aiService.importProfilesCsv(csv)}
            onImported={() => { void reloadConfig(); }}
            onError={(message) => addToast('error', message)}
          />
        )}
      </div>
    </div>

    {viewMode === 'simple' && (
      <AISimpleMode
        businessName={businessName}
        customRules={customRules}
        maxCustomRulesChars={customRulesLimit}
        followUpMinutes={followUpMinutes}
        followUpMessage={followUpMessage}
        channels={channels}
        activeProfileId={activeProfileId}
        {...(profiles.length > 1 ? { profileName: profiles.find((profile) => profile.id === activeProfileId)?.name ?? '' } : {})}
        saving={saving}
        onSave={saveSimpleSetup}
        onToggleFollowUp={toggleFollowUp}
        onToggleChannel={toggleChannel}
      />
    )}

    {viewMode === 'advanced' && (<div className="flex flex-col gap-4 lg:flex-row">
      <div data-tour="ia-tabs" className="lg:w-52 lg:shrink-0">
        <AITabs activeTab={activeTab} onTabChange={setActiveTab} visibleTabs={visibleTabs}/>
        <AIProfileSwitcher
          profiles={profiles}
          activeProfileId={activeProfileId}
          maxProfiles={maxProfiles}
          busy={switchingProfile || saving}
          onSelect={switchProfile}
          onCreate={createProfile}
          onRename={renameProfile}
          onDelete={deleteProfile}
        />
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        {activeTab === 'general' && (<>
          <AIIdentitySection segment={segment} businessName={businessName} assistantName={assistantName} tone={tone} onSegmentChange={setSegment} onBusinessNameChange={setBusinessName} onAssistantNameChange={setAssistantName} onToneChange={setTone}/>
          <AIPromptPreview segment={segment} businessName={businessName} assistantName={assistantName} products={products}/>
        </>)}

        {activeTab === 'catalog' && (<AICatalogSection products={products} productsTotal={productsTotal} maxProducts={maxProducts} productsLoading={productsLoading} productSearch={productSearch} productPage={productPage} productsPageSize={productsPageSize} onProductSearchChange={setProductSearch} onProductPageChange={goToProductPage} onAddProduct={addProduct} onUpdateProduct={updateProduct} onDeleteProduct={deleteProduct} onOpenImport={() => setImportOpen(true)} onClearCatalog={() => setClearCatalogOpen(true)} crossSellEnabled={crossSellEnabled} onToggleCrossSell={toggleCrossSell} productLayout={instagramProductLayout} onProductLayoutChange={changeProductLayout} onUploadProductImage={uploadProductImage} onRemoveProductImage={removeProductImage} profileCount={profiles.length} catalogScope={catalogScope} onCatalogScopeChange={changeCatalogScope}/>)}

        {activeTab === 'knowledge' && (<AIKnowledgeSection knowledgeEnabled={knowledgeEnabled} onToggleKnowledge={toggleKnowledge}/>)}

        {activeTab === 'channels' && (<div data-tour="ia-channels">
          <AIChannelsList channels={channels} onToggle={toggleChannel} activeProfileId={activeProfileId}/>
        </div>)}

        {activeTab === 'triggers' && (<AIRulesSection customRules={customRules} followUpMinutes={followUpMinutes} followUpMessage={followUpMessage} maxChars={customRulesLimit} onCustomRulesChange={setCustomRules} onFollowUpMinutesChange={setFollowUpMinutes} onFollowUpMessageChange={setFollowUpMessage}/>)}

        {activeTab === 'guardrails' && (<AIGuardrailsSection/>)}

        {activeTab === 'scheduling' && (<AISchedulingSection schedulingQueryEnabled={schedulingQueryEnabled} schedulingBookingEnabled={schedulingBookingEnabled} schedulingQueryAllowed={schedulingQueryAllowed} schedulingBookingAllowed={schedulingBookingAllowed} onToggleQuery={toggleSchedulingQuery} onToggleBooking={toggleSchedulingBooking}/>)}

        {activeTab === 'funnel' && (<AIFunnelSection funnelAutoMoveEnabled={funnelAutoMoveEnabled} stages={funnelStages} onToggle={toggleFunnelAutoMove}/>)}

        {activeTab === 'test' && (<AISimulator {...(activeProfileId ? { profileId: activeProfileId } : {})} onReply={markAiTested}/>)}

        {TABS_WITH_DRAFT.includes(activeTab) && (<div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {activeTab === 'triggers' && customRulesOverLimit
              ? `As regras personalizadas passaram de ${customRulesLimit.toLocaleString('pt-BR')} caracteres. Corte o texto para salvar.`
              : 'As mudanças desta aba só valem depois de salvar.'}
          </p>
          <Button onClick={saveConfig} loading={saving} loadingText="Salvando..." disabled={customRulesOverLimit} icon={<Bot size={16}/>} className="w-full justify-center sm:w-auto">
            Salvar alterações
          </Button>
        </div>)}
      </div>
    </div>)}

    <AIProductsImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImport={importProducts}/>

    <ConfirmDeleteModal isOpen={clearCatalogOpen} onClose={() => setClearCatalogOpen(false)} onConfirm={async () => { setClearCatalogOpen(false); await clearProducts(); }} title="Limpar catálogo" message="Todos os produtos e serviços cadastrados serão removidos. A IA deixa de conseguir citar itens até você cadastrar de novo. Esta ação não pode ser desfeita." confirmLabel="Limpar catálogo" loading={saving}/>

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
