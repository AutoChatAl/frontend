'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

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

export function ChannelStatusProvider({ children }: { children: ReactNode }) {
  const [whatsappInstances, setWhatsappInstances] = useState<WhatsAppInstance[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const refetchWhatsApp = useCallback(async () => {
    try {
      const data = await channelsService.getWhatsAppInstances();
      setWhatsappInstances(data);
    } catch { /* silently fail for status badge */ }
  }, []);

  const refetchInstagram = useCallback(async () => {
    try {
      const data = await channelsService.getInstagramAccounts();
      setInstagramAccounts(data);
    } catch { /* silently fail for status badge */ }
  }, []);

  useEffect(() => {
    Promise.all([refetchWhatsApp(), refetchInstagram()]).finally(() => setLoading(false));
  }, [refetchWhatsApp, refetchInstagram]);

  return (
    <ChannelStatusContext.Provider value={{ whatsappInstances, instagramAccounts, loading, refetchWhatsApp, refetchInstagram }}>
      {children}
    </ChannelStatusContext.Provider>
  );
}

export function useChannelStatus() {
  const ctx = useContext(ChannelStatusContext);
  if (!ctx) throw new Error('useChannelStatus must be used within ChannelStatusProvider');
  return ctx;
}
