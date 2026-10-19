import { useCallback, useEffect, useRef, useState } from 'react';

import { funnelService } from '@/services/funnel.service';
import { inboxService } from '@/services/inbox.service';
import {
  FUNNEL_LEAD_MOVED_EVENT,
  type FunnelLead,
  type FunnelLeadPlacement,
  type FunnelStageDefinition,
} from '@/types/Funnel';
import { subscribeToEvents } from '@/utils/SharedEventSource';

export interface ContactFunnelState {
  stages: FunnelStageDefinition[];
  /** Nulo enquanto carrega e quando a carga falhou. */
  placement: FunnelLeadPlacement | null;
  loading: boolean;
  loadFailed: boolean;
  moving: boolean;
  /** Falha da última mudança de etapa, já em português para a tela. */
  moveError: string | null;
  moveTo: (stageId: string) => void;
}

/** Etapa já carregada, sempre presa ao contato a que pertence. */
interface PlacementEntry {
  contactId: string;
  placement: FunnelLeadPlacement;
}

const MOVE_ERROR = 'Não foi possível mover o contato no funil. Tente de novo.';

function placementFromLead(lead: FunnelLead): FunnelLeadPlacement {
  return {
    stageId: lead.funnelStageId,
    offBoardReason: null,
    stageEnteredAt: lead.stageEnteredAt,
    stageMovedBy: lead.stageMovedBy,
    stageMoveReason: lead.stageMoveReason,
  };
}

/**
 * Etapa do contato da conversa aberta no funil, para mostrar e mudar sem sair do chat.
 *
 * Desligado — quem não tem a permissão de funil —, não chama a API. Fica em dia por
 * dois caminhos: o aviso `funnel.lead_moved` do stream do workspace, que cobre a IA e
 * os fluxos movendo o lead com a conversa aberta; e a mensagem nova (`activityKey`),
 * que traz de volta ao quadro quem estava fora dele.
 */
export function useContactFunnel(
  contactId: string | null,
  enabled: boolean,
  activityKey: string | null,
): ContactFunnelState {
  const activeId = enabled ? contactId : null;
  const [stages, setStages] = useState<FunnelStageDefinition[]>([]);
  const [entry, setEntry] = useState<PlacementEntry | null>(null);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState<{ contactId: string; message: string } | null>(null);
  // Contato na tela agora: resposta de um contato anterior chega atrasada e é descartada.
  const activeIdRef = useRef<string | null>(activeId);
  activeIdRef.current = activeId;
  const entryRef = useRef<PlacementEntry | null>(entry);
  entryRef.current = entry;

  const load = useCallback(async (targetId: string, silent: boolean) => {
    try {
      const [nextStages, nextPlacement] = await Promise.all([
        funnelService.listStages(),
        funnelService.getLeadPlacement(targetId),
      ]);
      if (activeIdRef.current !== targetId) return;
      setStages(nextStages);
      setEntry({ contactId: targetId, placement: nextPlacement });
      setFailedFor((prev) => (prev === targetId ? null : prev));
    } catch {
      // Recarga silenciosa que falha mantém na tela a etapa que já estava lá.
      if (activeIdRef.current !== targetId || silent) return;
      setFailedFor(targetId);
    }
  }, []);

  useEffect(() => {
    if (activeId) void load(activeId, false);
  }, [activeId, load]);

  // Só quem está fora do quadro muda de situação com mensagem nova: a interação desfaz
  // a remoção manual, e a primeira resposta tira o importado da espera.
  useEffect(() => {
    const { current } = entryRef;
    if (!activeId || !activityKey || !current || current.contactId !== activeId) return;
    if (current.placement.stageId === null) void load(activeId, true);
  }, [activeId, activityKey, load]);

  useEffect(() => {
    if (!enabled) return undefined;
    return subscribeToEvents(inboxService.getInboxEventsUrl(), {
      [FUNNEL_LEAD_MOVED_EVENT]: (event) => {
        const { current } = activeIdRef;
        if (!current) return;
        try {
          const { contactId: movedId } = JSON.parse(event.data) as { contactId?: string };
          if (movedId !== current) return;
        } catch {
          return;
        }
        void load(current, true);
      },
    });
  }, [enabled, load]);

  const moveTo = useCallback((stageId: string) => {
    const targetId = activeIdRef.current;
    const previous = entryRef.current;
    if (!targetId || !previous || previous.contactId !== targetId || previous.placement.stageId === stageId) return;
    setMoveError(null);
    setMoving(true);
    // A etapa troca na hora; volta para a anterior se o servidor recusar.
    setEntry({
      contactId: targetId,
      placement: {
        stageId,
        offBoardReason: null,
        stageEnteredAt: new Date().toISOString(),
        stageMovedBy: 'USER',
        stageMoveReason: null,
      },
    });
    funnelService.moveLead(targetId, stageId, 0)
      .then((lead) => {
        if (activeIdRef.current === targetId) setEntry({ contactId: targetId, placement: placementFromLead(lead) });
      })
      .catch(() => {
        if (activeIdRef.current !== targetId) return;
        setEntry(previous);
        setMoveError({ contactId: targetId, message: MOVE_ERROR });
      })
      .finally(() => setMoving(false));
  }, []);

  const placement = activeId && entry?.contactId === activeId ? entry.placement : null;
  const loadFailed = !!activeId && failedFor === activeId && !placement;
  return {
    stages,
    placement,
    loading: !!activeId && !placement && !loadFailed,
    loadFailed,
    moving,
    moveError: activeId && moveError?.contactId === activeId ? moveError.message : null,
    moveTo,
  };
}
