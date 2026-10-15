'use client';
import { useCallback, useEffect, useState } from 'react';

import { channelsService } from '@/services/channels.service';
import { whatsappOfficialService } from '@/services/whatsapp-official.service';
import type { InstagramAccount, WhatsAppInstance } from '@/types/Channel';
import type { WhatsAppOfficialInstance } from '@/types/WhatsAppOfficial';

export type WorkspaceChannelType = 'WHATSAPP' | 'INSTAGRAM' | 'WHATSAPP_OFFICIAL';

export interface WorkspaceChannel {
  id: string;
  name: string;
  type: WorkspaceChannelType;
  status: string;
}

/**
 * Os três tipos de canal do workspace numa lista só, já com o nome que faz
 * sentido mostrar (número, nome verificado ou @usuário). Cada modal montava
 * esta mesma lista por conta própria; aqui ela existe uma vez.
 *
 * Um tipo que falha ao carregar não derruba os outros — a tela continua
 * utilizável com os canais que responderam.
 */
export function useWorkspaceChannels() {
  const [channels, setChannels] = useState<WorkspaceChannel[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [whatsapp, official, instagram] = await Promise.all([
        channelsService.getWhatsAppInstances().catch(() => [] as WhatsAppInstance[]),
        whatsappOfficialService.getInstances().catch(() => [] as WhatsAppOfficialInstance[]),
        channelsService.getInstagramAccounts().catch(() => [] as InstagramAccount[]),
      ]);
      setChannels([
        ...whatsapp.map((channel): WorkspaceChannel => ({
          id: channel.id,
          name: channel.name || channel.whatsapp?.phoneNumber || 'WhatsApp',
          type: 'WHATSAPP',
          status: channel.status,
        })),
        ...official.map((channel): WorkspaceChannel => ({
          id: channel.id,
          name: channel.whatsappOfficial.verifiedName
            || channel.whatsappOfficial.displayPhoneNumber
            || channel.name
            || 'WhatsApp Oficial',
          type: 'WHATSAPP_OFFICIAL',
          status: channel.status,
        })),
        ...instagram.map((channel): WorkspaceChannel => ({
          id: channel.id,
          name: channel.instagram?.username ? `@${channel.instagram.username}` : channel.name || 'Instagram',
          type: 'INSTAGRAM',
          status: channel.status,
        })),
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { channels, loading, reload };
}
