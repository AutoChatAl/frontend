import { useCallback, useEffect, useRef, useState } from 'react';

import { whatsappOfficialService } from '@/services/whatsapp-official.service';
import type { WaFreeTierUsage } from '@/types/WhatsAppOfficial';

interface UseFreeTierReturn {
  /** Por id do canal. Ausente enquanto carrega. */
  usageByChannel: Record<string, WaFreeTierUsage>;
  /** Canais cuja consulta falhou. */
  failed: Set<string>;
  /** Busca de novo — o botão "Atualizar" do número usa. */
  reload: (channelIds: string[]) => void;
}

/**
 * Cota grátis de atendimento de cada número. Não depende do período nem do número escolhido
 * no topo da página — é sempre o mês corrente —, então só busca quando a lista de números muda.
 */
export function useFreeTier(channelIds: string[]): UseFreeTierReturn {
  const [usageByChannel, setUsageByChannel] = useState<Record<string, WaFreeTierUsage>>({});
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback((ids: string[]) => {
    for (const channelId of ids) {
      whatsappOfficialService.getFreeTier(channelId)
        .then((usage) => {
          if (!mountedRef.current) return;
          setUsageByChannel((prev) => ({ ...prev, [channelId]: usage }));
          setFailed((prev) => {
            if (!prev.has(channelId)) return prev;
            const next = new Set(prev);
            next.delete(channelId);
            return next;
          });
        })
        .catch(() => {
          if (!mountedRef.current) return;
          setFailed((prev) => new Set(prev).add(channelId));
        });
    }
  }, []);

  const key = channelIds.join(',');
  useEffect(() => {
    if (key) reload(key.split(','));
  }, [key, reload]);

  return { usageByChannel, failed, reload };
}
