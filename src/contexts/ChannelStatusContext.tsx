'use client';
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

import { hasPermission } from '@/contexts/SidebarContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { channelsService } from '@/services/channels.service';
import type { WhatsAppInstance, InstagramAccount } from '@/types/Channel';

interface ChannelStatusContextValue {
    whatsappInstances: WhatsAppInstance[];
    instagramAccounts: InstagramAccount[];
    loading: boolean;
    refetchWhatsApp: () => Promise<void>;
    refetchInstagram: () => Promise<void>;
}
const ChannelStatusContext = createContext<ChannelStatusContextValue | null>(null);
export function ChannelStatusProvider({ children }: {
    children: ReactNode;
}) {
  const [whatsappInstances, setWhatsappInstances] = useState<WhatsAppInstance[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  // Este provider envolve TODA página privada. Sem o gate de permissão, um
  // colaborador sem `channels` dispararia dois 403 a cada navegação — engolidos
  // pelo catch, mas poluindo o console e a rede como se algo estivesse quebrado.
  const user = useAuthUser();
  const canReadChannels = hasPermission(user, 'channels');
  const refetchWhatsApp = useCallback(async () => {
    if (!canReadChannels) {
      setWhatsappInstances([]);
      return;
    }
    try {
      const data = await channelsService.getWhatsAppInstances();
      setWhatsappInstances(data);
    }
    catch {
    }
  }, [canReadChannels]);
  const refetchInstagram = useCallback(async () => {
    if (!canReadChannels) {
      setInstagramAccounts([]);
      return;
    }
    try {
      const data = await channelsService.getInstagramAccounts();
      setInstagramAccounts(data);
    }
    catch {
    }
  }, [canReadChannels]);
  useEffect(() => {
    Promise.all([refetchWhatsApp(), refetchInstagram()]).finally(() => setLoading(false));
  }, [refetchWhatsApp, refetchInstagram]);
  return (<ChannelStatusContext.Provider value={{ whatsappInstances, instagramAccounts, loading, refetchWhatsApp, refetchInstagram }}>
    {children}
  </ChannelStatusContext.Provider>);
}
export function useChannelStatus() {
  const ctx = useContext(ChannelStatusContext);
  if (!ctx)
    throw new Error('useChannelStatus must be used within ChannelStatusProvider');
  return ctx;
}
