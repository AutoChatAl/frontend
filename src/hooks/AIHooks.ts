'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Toast } from '@/components/Toast';
import { aiService } from '@/services/ai.service';
import { channelsService } from '@/services/channels.service';
import type { AIChannel } from '@/types/AI';
import type { Product } from '@/types/AI';

export function useAIConfig() {
  const [segment, setSegment] = useState('');
  const [tone, setTone] = useState('Amigável e Casual');
  const [customRules, setCustomRules] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [channels, setChannels] = useState<AIChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
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

  const loadChannels = useCallback(async (currentActiveChannelId: string | null) => {
    try {
      const [whatsappInstances, instagramAccounts] = await Promise.all([
        channelsService.getWhatsAppInstances().catch(() => []),
        channelsService.getInstagramAccounts().catch(() => []),
      ]);

      const waChannels: AIChannel[] = whatsappInstances.map((inst) => ({
        id: inst.id,
        name: inst.name,
        type: 'whatsapp' as const,
        active: inst.id === currentActiveChannelId,
        identifier: inst.whatsapp?.phoneNumber || inst.number || '',
      }));

      const igChannels: AIChannel[] = instagramAccounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        type: 'instagram' as const,
        active: acc.id === currentActiveChannelId,
        identifier: acc.instagram?.username || '',
      }));

      setChannels([...waChannels, ...igChannels]);
    } catch {
      setChannels([]);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const { aiConfig, products: fetchedProducts } = await aiService.getConfig();
      setSegment(aiConfig.segment);
      setTone(aiConfig.tone);
      setCustomRules(aiConfig.customRules);
      setEnabled(aiConfig.enabled);
      setActiveChannelId(aiConfig.activeChannelId);
      setProducts(fetchedProducts);
      await loadChannels(aiConfig.activeChannelId);
    } catch {
      // keep defaults on error
    }
  }, [loadChannels]);

  useEffect(() => {
    setLoading(true);
    loadConfig().finally(() => setLoading(false));
  }, [loadConfig]);

  const saveConfig = useCallback(async () => {
    setSaving(true);
    try {
      await aiService.updateConfig({ segment, tone, customRules });
      addToast('success', 'Configurações da IA salvas com sucesso!');
    } catch {
      addToast('error', 'Erro ao salvar configurações da IA.');
    } finally {
      setSaving(false);
    }
  }, [segment, tone, customRules, addToast]);

  const toggleChannel = useCallback(
    async (channelId: string) => {
      setSaving(true);
      try {
        if (channelId === activeChannelId) {
          await aiService.deactivateAi();
          addToast('success', 'IA desativada com sucesso.');
        } else {
          await aiService.activateChannel(channelId);
          addToast('success', 'Canal ativado para IA com sucesso!');
        }
        await loadConfig();
      } catch {
        addToast('error', 'Erro ao alterar canal da IA.');
      } finally {
        setSaving(false);
      }
    },
    [activeChannelId, loadConfig, addToast],
  );

  const addProduct = useCallback(
    async (name: string) => {
      setSaving(true);
      try {
        await aiService.createProduct({ name });
        const refreshed = await aiService.listProducts();
        setProducts(refreshed);
        addToast('success', `Produto "${name}" adicionado.`);
      } catch {
        addToast('error', 'Erro ao adicionar produto.');
      } finally {
        setSaving(false);
      }
    },
    [addToast],
  );

  const updateProduct = useCallback(
    async (id: string, data: { name?: string; priceCents?: number; link?: string }) => {
      setSaving(true);
      try {
        await aiService.updateProduct(id, data);
        const refreshed = await aiService.listProducts();
        setProducts(refreshed);
        addToast('success', 'Produto atualizado.');
      } catch {
        addToast('error', 'Erro ao atualizar produto.');
      } finally {
        setSaving(false);
      }
    },
    [addToast],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      setSaving(true);
      try {
        await aiService.deleteProduct(id);
        const refreshed = await aiService.listProducts();
        setProducts(refreshed);
        addToast('success', 'Produto removido.');
      } catch {
        addToast('error', 'Erro ao remover produto.');
      } finally {
        setSaving(false);
      }
    },
    [addToast],
  );

  return {
    segment,
    setSegment,
    tone,
    setTone,
    customRules,
    setCustomRules,
    products,
    channels,
    activeChannelId,
    enabled,
    loading,
    saving,
    toasts,
    removeToast,
    saveConfig,
    toggleChannel,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
