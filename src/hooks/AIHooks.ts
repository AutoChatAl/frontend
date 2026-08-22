'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Toast } from '@/components/Toast';
import { aiService } from '@/services/ai.service';
import { authService } from '@/services/auth.service';
import { channelsService } from '@/services/channels.service';
import { funnelService } from '@/services/funnel.service';
import { whatsappOfficialService } from '@/services/whatsapp-official.service';
import type { AIChannel } from '@/types/AI';
import type { Product, ProductImportMode, ProductImportReport, ProductPayload } from '@/types/AI';
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
  const [funnelStages, setFunnelStages] = useState<FunnelStageDefinition[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [maxProducts, setMaxProducts] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productsLoading, setProductsLoading] = useState(false);
  const productsSeededRef = useRef(false);
  const [channels, setChannels] = useState<AIChannel[]>([]);
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
      const user = authService.getUser();
      const isOwner = !user?.role || user.role === 'owner' || user.role === 'admin';
      if (isOwner) {
        const allChannels = await aiService.listChannels();
        const mapped: AIChannel[] = allChannels.map((ch) => ({
          id: ch.id,
          name: ch.name,
          type: ch.type.toLowerCase() as AIChannel['type'],
          active: ch.aiEnabled,
          identifier: '',
          createdBy: ch.createdBy,
          ownerName: ch.ownerName,
        }));
        setChannels(mapped);
        return;
      }
      const [whatsappInstances, officialInstances, instagramAccounts] = await Promise.all([
        channelsService.getWhatsAppInstances().catch(() => []),
        whatsappOfficialService.getInstances().catch(() => []),
        channelsService.getInstagramAccounts().catch(() => []),
      ]);
      const waChannels: AIChannel[] = whatsappInstances.map((inst) => ({
        id: inst.id,
        name: inst.name,
        type: 'whatsapp' as const,
        active: currentActiveChannelIds.includes(inst.id),
        identifier: inst.whatsapp?.phoneNumber || inst.number || '',
      }));
      const officialChannels: AIChannel[] = officialInstances.map((inst) => ({
        id: inst.id,
        name: inst.whatsappOfficial.verifiedName || inst.name,
        type: 'whatsapp_official' as const,
        active: currentActiveChannelIds.includes(inst.id),
        identifier: inst.whatsappOfficial.displayPhoneNumber || '',
      }));
      const igChannels: AIChannel[] = instagramAccounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        type: 'instagram' as const,
        active: currentActiveChannelIds.includes(acc.id),
        identifier: acc.instagram?.username || '',
      }));
      setChannels([...waChannels, ...officialChannels, ...igChannels]);
    }
    catch {
      setChannels([]);
    }
  }, []);
  const loadConfig = useCallback(async () => {
    try {
      const aiConfigResponse = await aiService.getConfig();
      const { aiConfig, products: fetchedProducts, visibleTabs: fetchedTabs } = aiConfigResponse;
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
  }, [loadChannels]);
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
        funnelAutoMoveEnabled,
      });
      addToast('success', 'Configurações da IA salvas com sucesso!');
    }
    catch {
      addToast('error', 'Erro ao salvar configurações da IA.');
    }
    finally {
      setSaving(false);
    }
  }, [segment, businessName, assistantName, tone, customRules, triggerSettings, funnelAutoMoveEnabled, addToast]);
  const toggleSchedulingQuery = useCallback(async (enabled: boolean) => {
    setSchedulingQueryEnabled(enabled);
    setSaving(true);
    try {
      await aiService.updateConfig({ schedulingQueryEnabled: enabled, schedulingBookingEnabled });
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
      await aiService.updateConfig({ schedulingQueryEnabled, schedulingBookingEnabled: enabled });
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
      await aiService.updateConfig({ funnelAutoMoveEnabled: enabled });
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
  const toggleCrossSell = useCallback(async (enabled: boolean) => {
    setCrossSellEnabled(enabled);
    setSaving(true);
    try {
      await aiService.updateConfig({ crossSellEnabled: enabled });
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
  const toggleChannel = useCallback(async (channelId: string) => {
    setSaving(true);
    try {
      const target = channels.find((ch) => ch.id === channelId);
      if (target?.active) {
        await aiService.deactivateAi(channelId);
        addToast('success', 'IA desativada com sucesso.');
      }
      else {
        await aiService.activateChannel(channelId);
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
      const result = await aiService.listProducts({ page, pageSize: PRODUCTS_PAGE_SIZE, search });
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
      await aiService.createProduct({ name });
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
  const deleteProduct = useCallback(async (id: string) => {
    setSaving(true);
    try {
      await aiService.deleteProduct(id);
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
      const deleted = await aiService.deleteAllProducts();
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
  const importProducts = useCallback(async (file: File, mode: ProductImportMode): Promise<ProductImportReport> => {
    const report = await aiService.importProducts(file, mode);
    await loadProducts(1, '');
    setProductSearch('');
    return report;
  }, [loadProducts]);
  return {
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
    funnelAutoMoveEnabled,
    crossSellEnabled,
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
  };
}
