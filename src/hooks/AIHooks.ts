'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Toast } from '@/components/Toast';
import { aiService } from '@/services/ai.service';
import { funnelService } from '@/services/funnel.service';
import type { AiCatalogScope, AIChannel, AiProfile } from '@/types/AI';
import type { InstagramProductLayout, Product, ProductImportMode, ProductImportReport, ProductPayload } from '@/types/AI';
import type { AiTriggerSettings } from '@/types/AI';
import { defaultAiTriggerSettings } from '@/types/AI';
import type { FunnelStageDefinition } from '@/types/Funnel';

const PRODUCTS_PAGE_SIZE = 20;
const PRODUCTS_SEARCH_DEBOUNCE_MS = 350;
export function useAIConfig() {
  const [segment, setSegment] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [assistantName, setAssistantName] = useState('');
  const [tone, setTone] = useState('Amigável e Casual');
  const [customRules, setCustomRules] = useState('');
  const [triggerSettings, setTriggerSettings] = useState<AiTriggerSettings>(defaultAiTriggerSettings);
  const [schedulingQueryEnabled, setSchedulingQueryEnabled] = useState(false);
  const [schedulingBookingEnabled, setSchedulingBookingEnabled] = useState(false);
  const [funnelAutoMoveEnabled, setFunnelAutoMoveEnabled] = useState(false);
  const [crossSellEnabled, setCrossSellEnabled] = useState(false);
  // Perfil antigo não tem o campo: ausente conta como ligado, igual ao backend.
  const [knowledgeEnabled, setKnowledgeEnabled] = useState(true);
  const [followUpMinutes, setFollowUpMinutes] = useState(0);
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [instagramProductLayout, setInstagramProductLayout] = useState<InstagramProductLayout>('QUICK_REPLY');
  const [funnelStages, setFunnelStages] = useState<FunnelStageDefinition[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [maxProducts, setMaxProducts] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productsLoading, setProductsLoading] = useState(false);
  const productsSeededRef = useRef(false);
  const [channels, setChannels] = useState<AIChannel[]>([]);
  const [profiles, setProfiles] = useState<AiProfile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [maxProfiles, setMaxProfiles] = useState(1);
  const [catalogScope, setCatalogScopeState] = useState<AiCatalogScope>('shared');
  const [maxCustomRulesChars, setMaxCustomRulesChars] = useState(0);
  const [switchingProfile, setSwitchingProfile] = useState(false);
  // O perfil também vive em ref: os callbacks de produto e de canal precisam do valor
  // atual sem virar dependência de si mesmos e refazer o carregamento a cada troca.
  const activeProfileRef = useRef<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState<string[]>(['general', 'channels', 'triggers', 'scheduling']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const loadChannels = useCallback(async (currentActiveChannelIds: string[]) => {
    try {
      // Fonte única: o /ai/channels é o que sabe QUAL perfil segura cada canal.
      // Antes o colaborador montava a lista pelos endpoints crus de canal e
      // marcava "ligado" só pelo próprio perfil — um canal atendido pelo perfil
      // de outra pessoa aparecia desligado e, ao clicar, voltava o erro de
      // "já está em outro perfil". Duas fontes de verdade para o mesmo estado.
      const allChannels = await aiService.listChannels();
      const mapped: AIChannel[] = allChannels.map((ch) => ({
        id: ch.id,
        name: ch.name,
        type: ch.type.toLowerCase() as AIChannel['type'],
        // Ligado aqui = preso ao perfil que está aberto. Em qualquer outro
        // perfil o cartão mostra de quem é e pede para desligar lá.
        active: currentActiveChannelIds.includes(ch.id),
        identifier: ch.identifier ?? '',
        createdBy: ch.createdBy,
        ownerName: ch.ownerName,
        aiProfileId: ch.aiProfileId,
        aiProfileName: ch.aiProfileName,
        aiProfileOwnerName: ch.aiProfileOwnerName,
      }));
      setChannels(mapped);
    }
    catch {
      setChannels([]);
    }
  }, []);
  const setActiveProfile = useCallback((id: string | null) => {
    activeProfileRef.current = id;
    setActiveProfileIdState(id);
  }, []);
  const loadConfig = useCallback(async (profileId?: string | null) => {
    try {
      const requested = profileId !== undefined ? profileId : activeProfileRef.current;
      const aiConfigResponse = await aiService.getConfig(requested);
      const { aiConfig, products: fetchedProducts, visibleTabs: fetchedTabs } = aiConfigResponse;
      setProfiles(aiConfigResponse.profiles ?? []);
      setMaxProfiles(aiConfigResponse.maxProfiles ?? 1);
      setCatalogScopeState(aiConfigResponse.catalogScope ?? 'shared');
      setMaxCustomRulesChars(aiConfigResponse.maxCustomRulesChars ?? 0);
      setActiveProfile(aiConfigResponse.activeProfileId || aiConfig.id || null);
      if (fetchedTabs)
        setVisibleTabs(fetchedTabs);
      setSegment(aiConfig.segment);
      setBusinessName(aiConfig.businessName || '');
      setAssistantName(aiConfig.assistantName || '');
      setTone(aiConfig.tone);
      setCustomRules(aiConfig.customRules);
      setTriggerSettings({ ...defaultAiTriggerSettings, ...(aiConfig.triggerSettings || {}) });
      setSchedulingQueryEnabled(aiConfig.schedulingQueryEnabled);
      setSchedulingBookingEnabled(aiConfig.schedulingBookingEnabled);
      setFunnelAutoMoveEnabled(aiConfig.funnelAutoMoveEnabled);
      setCrossSellEnabled(aiConfig.crossSellEnabled ?? false);
      setKnowledgeEnabled(aiConfig.knowledgeEnabled !== false);
      setFollowUpMinutes(aiConfig.followUpMinutes ?? 0);
      setFollowUpMessage(aiConfig.followUpMessage ?? '');
      setInstagramProductLayout(aiConfig.instagramProductLayout ?? 'QUICK_REPLY');
      setEnabled(aiConfig.enabled);
      setActiveChannelId(aiConfig.activeChannelId);
      setProducts(fetchedProducts);
      setProductsTotal(aiConfigResponse.productsTotal ?? fetchedProducts.length);
      setMaxProducts(aiConfigResponse.maxProducts ?? 0);
      const activeIds = aiConfig.activeChannelIds && aiConfig.activeChannelIds.length > 0
        ? aiConfig.activeChannelIds
        : (aiConfig.activeChannelId ? [aiConfig.activeChannelId] : []);
      await loadChannels(activeIds);
      // Colaborador sem permissão de contatos recebe 403 no funil — a aba apenas
      // deixa de listar as etapas, sem quebrar o carregamento da página de IA.
      setFunnelStages(await funnelService.listStages().catch(() => []));
    }
    catch {
    }
  }, [loadChannels, setActiveProfile]);
  useEffect(() => {
    setLoading(true);
    loadConfig().finally(() => setLoading(false));
  }, [loadConfig]);
  const saveConfig = useCallback(async () => {
    setSaving(true);
    try {
      await aiService.updateConfig({
        segment,
        businessName,
        assistantName,
        tone,
        customRules,
        triggerSettings,
        followUpMinutes,
        followUpMessage,
        funnelAutoMoveEnabled,
      }, activeProfileRef.current);
      addToast('success', 'Configurações da IA salvas com sucesso!');
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao salvar configurações da IA.');
    }
    finally {
      setSaving(false);
    }
  }, [segment, businessName, assistantName, tone, customRules, triggerSettings, followUpMinutes, followUpMessage, funnelAutoMoveEnabled, addToast]);
  const toggleSchedulingQuery = useCallback(async (enabled: boolean) => {
    setSchedulingQueryEnabled(enabled);
    setSaving(true);
    try {
      await aiService.updateConfig({ schedulingQueryEnabled: enabled, schedulingBookingEnabled }, activeProfileRef.current);
      addToast('success', enabled ? 'Consulta de disponibilidade ativada.' : 'Consulta de disponibilidade desativada.');
    }
    catch (err) {
      setSchedulingQueryEnabled(!enabled);
      addToast('error', err instanceof Error ? err.message : 'Erro ao atualizar configuração de agendamento.');
    }
    finally {
      setSaving(false);
    }
  }, [schedulingBookingEnabled, addToast]);
  const toggleSchedulingBooking = useCallback(async (enabled: boolean) => {
    setSchedulingBookingEnabled(enabled);
    setSaving(true);
    try {
      await aiService.updateConfig({ schedulingQueryEnabled, schedulingBookingEnabled: enabled }, activeProfileRef.current);
      addToast('success', enabled ? 'Criação de agendamentos ativada.' : 'Criação de agendamentos desativada.');
    }
    catch (err) {
      setSchedulingBookingEnabled(!enabled);
      addToast('error', err instanceof Error ? err.message : 'Erro ao atualizar configuração de agendamento.');
    }
    finally {
      setSaving(false);
    }
  }, [schedulingQueryEnabled, addToast]);
  const toggleFunnelAutoMove = useCallback(async (enabled: boolean) => {
    setFunnelAutoMoveEnabled(enabled);
    setSaving(true);
    try {
      await aiService.updateConfig({ funnelAutoMoveEnabled: enabled }, activeProfileRef.current);
      addToast('success', enabled ? 'Movimentação automática do funil ativada.' : 'Movimentação automática do funil desativada.');
    }
    catch (err) {
      setFunnelAutoMoveEnabled(!enabled);
      addToast('error', err instanceof Error ? err.message : 'Erro ao atualizar configuração do funil.');
    }
    finally {
      setSaving(false);
    }
  }, [addToast]);
  const toggleKnowledge = useCallback(async (enabled: boolean) => {
    setKnowledgeEnabled(enabled);
    setSaving(true);
    try {
      await aiService.updateConfig({ knowledgeEnabled: enabled }, activeProfileRef.current);
      addToast('success', enabled
        ? 'A IA voltará a consultar a base de conhecimento.'
        : 'A IA deixará de consultar a base de conhecimento.');
    }
    catch (err) {
      setKnowledgeEnabled(!enabled);
      addToast('error', err instanceof Error ? err.message : 'Erro ao atualizar a base de conhecimento.');
    }
    finally {
      setSaving(false);
    }
  }, [addToast]);
  const toggleCrossSell = useCallback(async (enabled: boolean) => {
    setCrossSellEnabled(enabled);
    setSaving(true);
    try {
      await aiService.updateConfig({ crossSellEnabled: enabled }, activeProfileRef.current);
      addToast('success', enabled ? 'Sugestão de itens complementares ativada.' : 'Sugestão de itens complementares desativada.');
    }
    catch (err) {
      setCrossSellEnabled(!enabled);
      addToast('error', err instanceof Error ? err.message : 'Erro ao atualizar configuração de cross-sell.');
    }
    finally {
      setSaving(false);
    }
  }, [addToast]);
  const changeProductLayout = useCallback(async (layout: InstagramProductLayout) => {
    const previous = instagramProductLayout;
    if (layout === previous)
      return;
    setInstagramProductLayout(layout);
    setSaving(true);
    try {
      await aiService.updateConfig({ instagramProductLayout: layout }, activeProfileRef.current);
      addToast('success', layout === 'CAROUSEL'
        ? 'As opções passam a ser enviadas como carrossel com foto.'
        : 'As opções voltam a ser botões de resposta rápida.');
    }
    catch (err) {
      // Falha típica: existe item sem imagem. Volta o seletor para não mentir sobre o estado salvo.
      setInstagramProductLayout(previous);
      addToast('error', err instanceof Error ? err.message : 'Erro ao trocar o formato das opções.');
    }
    finally {
      setSaving(false);
    }
  }, [addToast, instagramProductLayout]);
  const toggleChannel = useCallback(async (channelId: string) => {
    setSaving(true);
    try {
      const target = channels.find((ch) => ch.id === channelId);
      const heldByAnotherProfile = !!target?.aiProfileId && target.aiProfileId !== activeProfileRef.current;
      if (heldByAnotherProfile) {
        addToast('error', `Este canal já está ativo no ${target.aiProfileName ?? 'outro perfil'}. Desative-o nesse perfil antes de ativar aqui.`);
        return;
      }
      if (target?.active) {
        await aiService.deactivateAi(channelId, activeProfileRef.current);
        addToast('success', 'IA desativada com sucesso.');
      }
      else {
        await aiService.activateChannel(channelId, activeProfileRef.current);
        addToast('success', 'Canal ativado para IA com sucesso!');
      }
      await loadConfig();
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao alterar canal da IA.');
    }
    finally {
      setSaving(false);
    }
  }, [channels, loadConfig, addToast]);
  const loadProducts = useCallback(async (page: number, search: string) => {
    setProductsLoading(true);
    try {
      const result = await aiService.listProducts({ page, pageSize: PRODUCTS_PAGE_SIZE, search, profileId: activeProfileRef.current });
      setProducts(result.products);
      setProductsTotal(result.total);
      setMaxProducts(result.maxProducts);
      setProductPage(result.page);
    }
    catch {
      addToast('error', 'Erro ao carregar os produtos do catálogo.');
    }
    finally {
      setProductsLoading(false);
    }
  }, [addToast]);
  useEffect(() => {
    if (!productsSeededRef.current && productSearch === '') {
      productsSeededRef.current = true;
      return;
    }
    const handle = setTimeout(() => { void loadProducts(1, productSearch); }, PRODUCTS_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [productSearch, loadProducts]);
  const goToProductPage = useCallback((page: number) => {
    void loadProducts(page, productSearch);
  }, [loadProducts, productSearch]);
  const addProduct = useCallback(async (name: string) => {
    setSaving(true);
    try {
      await aiService.createProduct({ name }, activeProfileRef.current);
      await loadProducts(1, productSearch);
      addToast('success', `Produto "${name}" adicionado.`);
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao adicionar produto.');
    }
    finally {
      setSaving(false);
    }
  }, [addToast, loadProducts, productSearch]);
  const updateProduct = useCallback(async (id: string, data: ProductPayload) => {
    setSaving(true);
    try {
      await aiService.updateProduct(id, data);
      await loadProducts(productPage, productSearch);
      addToast('success', 'Produto atualizado.');
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao atualizar produto.');
    }
    finally {
      setSaving(false);
    }
  }, [addToast, loadProducts, productPage, productSearch]);
  const uploadProductImage = useCallback(async (id: string, file: File) => {
    setSaving(true);
    try {
      await aiService.uploadProductImage(id, file);
      await loadProducts(productPage, productSearch);
      addToast('success', 'Imagem do produto atualizada.');
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao enviar a imagem do produto.');
    }
    finally {
      setSaving(false);
    }
  }, [addToast, loadProducts, productPage, productSearch]);
  const removeProductImage = useCallback(async (id: string) => {
    setSaving(true);
    try {
      await aiService.removeProductImage(id);
      await loadProducts(productPage, productSearch);
      addToast('success', 'Imagem removida.');
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao remover a imagem do produto.');
    }
    finally {
      setSaving(false);
    }
  }, [addToast, loadProducts, productPage, productSearch]);
  const deleteProduct = useCallback(async (id: string) => {
    setSaving(true);
    try {
      const { layoutChanged } = await aiService.deleteProduct(id);
      if (layoutChanged)
        setInstagramProductLayout('QUICK_REPLY');
      await loadProducts(productPage, productSearch);
      addToast('success', 'Produto removido.');
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao remover produto.');
    }
    finally {
      setSaving(false);
    }
  }, [addToast, loadProducts, productPage, productSearch]);
  const clearProducts = useCallback(async () => {
    setSaving(true);
    try {
      const { deleted, layoutChanged } = await aiService.deleteAllProducts(activeProfileRef.current);
      if (layoutChanged)
        setInstagramProductLayout('QUICK_REPLY');
      await loadProducts(1, '');
      setProductSearch('');
      addToast('success', deleted > 0 ? `${deleted} itens removidos do catálogo.` : 'O catálogo já estava vazio.');
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao limpar o catálogo.');
    }
    finally {
      setSaving(false);
    }
  }, [addToast, loadProducts]);
  // Trocar de perfil troca o catálogo junto: o GET /config traz uma prévia de 50 itens,
  // então a lista é recarregada na paginação real logo em seguida.
  const openProfile = useCallback(async (profileId: string | null) => {
    await loadConfig(profileId);
    await loadProducts(1, productSearch);
  }, [loadConfig, loadProducts, productSearch]);
  const switchProfile = useCallback(async (profileId: string) => {
    if (profileId === activeProfileRef.current)
      return;
    setSwitchingProfile(true);
    try {
      await openProfile(profileId);
    }
    finally {
      setSwitchingProfile(false);
    }
  }, [openProfile]);
  const createProfile = useCallback(async () => {
    setSaving(true);
    try {
      const profile = await aiService.createProfile();
      await openProfile(profile.id);
      addToast('success', `${profile.name} criado. Configure a identidade e os canais dele.`);
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao criar o perfil de IA.');
    }
    finally {
      setSaving(false);
    }
  }, [addToast, openProfile]);
  const renameProfile = useCallback(async (profileId: string, name: string) => {
    setSaving(true);
    try {
      const result = await aiService.updateProfile(profileId, { name: name.trim() });
      setProfiles(result.profiles);
      addToast('success', 'Nome do perfil atualizado.');
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao renomear o perfil de IA.');
    }
    finally {
      setSaving(false);
    }
  }, [addToast]);
  const deleteProfile = useCallback(async (profileId: string) => {
    setSaving(true);
    try {
      const result = await aiService.deleteProfile(profileId);
      // O catálogo do perfil excluído é adotado pelo perfil que sobra, então nada some.
      await openProfile(result.activeProfileId);
      addToast('success', 'Perfil excluído. Os canais dele voltaram a ser atendidos só por você.');
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao excluir o perfil de IA.');
    }
    finally {
      setSaving(false);
    }
  }, [addToast, openProfile]);
  const changeCatalogScope = useCallback(async (scope: AiCatalogScope) => {
    const previous = catalogScope;
    if (scope === previous)
      return;
    setCatalogScopeState(scope);
    setSaving(true);
    try {
      const target = activeProfileRef.current;
      if (!target)
        throw new Error('Nenhum perfil de IA carregado.');
      await aiService.updateProfile(target, { catalogScope: scope });
      await openProfile(target);
      addToast('success', scope === 'profile'
        ? 'Cada perfil passa a ter o próprio catálogo. Os itens que já existiam ficaram com o primeiro perfil.'
        : 'O catálogo voltou a ser o mesmo em todos os perfis.');
    }
    catch (err) {
      setCatalogScopeState(previous);
      addToast('error', err instanceof Error ? err.message : 'Erro ao trocar o escopo do catálogo.');
    }
    finally {
      setSaving(false);
    }
  }, [addToast, catalogScope, openProfile]);
  const importProducts = useCallback(async (file: File, mode: ProductImportMode): Promise<ProductImportReport> => {
    const report = await aiService.importProducts(file, mode, activeProfileRef.current);
    await loadProducts(1, '');
    setProductSearch('');
    return report;
  }, [loadProducts]);
  return {
    addToast,
    /** Recarrega a configuração do servidor — usado depois de importar perfis. */
    reloadConfig: loadConfig,
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
    followUpMinutes,
    setFollowUpMinutes,
    followUpMessage,
    setFollowUpMessage,
    schedulingQueryEnabled,
    setSchedulingQueryEnabled,
    schedulingBookingEnabled,
    setSchedulingBookingEnabled,
    funnelAutoMoveEnabled,
    crossSellEnabled,
    knowledgeEnabled,
    funnelStages,
    products,
    productsTotal,
    productsLoading,
    productSearch,
    productPage,
    productsPageSize: PRODUCTS_PAGE_SIZE,
    maxProducts,
    setProductSearch,
    goToProductPage,
    clearProducts,
    importProducts,
    channels,
    activeChannelId,
    enabled,
    visibleTabs,
    profiles,
    activeProfileId,
    maxProfiles,
    switchingProfile,
    switchProfile,
    createProfile,
    renameProfile,
    deleteProfile,
    catalogScope,
    changeCatalogScope,
    maxCustomRulesChars,
    loading,
    saving,
    toasts,
    removeToast,
    saveConfig,
    toggleChannel,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleSchedulingQuery,
    toggleSchedulingBooking,
    toggleFunnelAutoMove,
    toggleCrossSell,
    toggleKnowledge,
    instagramProductLayout,
    changeProductLayout,
    uploadProductImage,
    removeProductImage,
  };
}
