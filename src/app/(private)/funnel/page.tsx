'use client';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import Button from '@/components/Button';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import ImportExportMenu from '@/components/ImportExportMenu';
import Modal from '@/components/Modal';
import Select from '@/components/Select';
import { SkeletonCards, SkeletonPage } from '@/components/Skeleton';
import { ToastContainer, useToast } from '@/components/Toast';
import { hasPermission } from '@/contexts/SidebarContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { funnelService } from '@/services/funnel.service';
import type {
  ChannelType,
  CreateFunnelPayload,
  Funnel,
  FunnelLead,
  FunnelStage,
  LeadOrigin,
  LeadSourceChannel,
  LeadTemperature,
  StageColor,
  UpdateFunnelPayload,
} from '@/types/Funnel';

import FunnelBoard from './components/FunnelBoard';
import FunnelFilters from './components/FunnelFilters';
import FunnelModal from './components/FunnelModal';
import FunnelTabs from './components/FunnelTabs';
import LeadDetailDrawer from './components/LeadDetailDrawer';
import { formatIdentifier } from './components/meta';
import StageGroupModal from './components/StageGroupModal';
import StageModal from './components/StageModal';

interface StageModalState {
  open: boolean;
  mode: 'create' | 'edit';
  stage: FunnelStage | null;
}

interface FunnelModalState {
  open: boolean;
  /** Nulo cria um funil novo. */
  funnel: Funnel | null;
}

/** Último funil aberto neste navegador — conveniência, não precisa sobreviver a nada. */
const ACTIVE_FUNNEL_KEY = 'synq:funnel:active';

function readStoredFunnelId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_FUNNEL_KEY);
  } catch {
    return null;
  }
}

/** De onde vêm os contatos do funil aberto, em uma frase. */
function funnelSourceHint(funnel: Funnel | null, channels: LeadSourceChannel[]): string {
  if (!funnel || funnel.isMain) return 'Recebe os contatos dos canais que não estão em outro funil';
  const names = funnel.channelIds
    .map((channelId) => channels.find((channel) => channel.id === channelId))
    .filter((channel): channel is LeadSourceChannel => !!channel)
    .map((channel) => channel.name || formatIdentifier(channel.identifier) || 'canal sem nome');
  if (names.length === 0) return 'Nenhum canal vinculado: os cards chegam movidos à mão ou por fluxo';
  return `Recebe os contatos de ${names.join(', ')}`;
}

export default function FunnelPage() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [funnelChannels, setFunnelChannels] = useState<LeadSourceChannel[]>([]);
  const [maxExtraFunnels, setMaxExtraFunnels] = useState(0);
  /** `null` enquanto a lista de funis carrega; vazio abre o principal sem precisar do id. */
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null);
  const [funnelModal, setFunnelModal] = useState<FunnelModalState>({ open: false, funnel: null });
  const [funnelSaving, setFunnelSaving] = useState(false);
  const [deletingFunnel, setDeletingFunnel] = useState<Funnel | null>(null);
  const [funnelDeleteLoading, setFunnelDeleteLoading] = useState(false);
  /** Trocando de funil: o quadro do anterior sai da tela enquanto o novo carrega. */
  const [boardLoading, setBoardLoading] = useState(false);

  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [columns, setColumns] = useState<Record<string, FunnelLead[]>>({});
  const [hasMoreByStage, setHasMoreByStage] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMoreStage, setLoadingMoreStage] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [channelType, setChannelType] = useState<ChannelType | undefined>(undefined);
  const [origin, setOrigin] = useState<LeadOrigin | undefined>(undefined);
  const [temperature, setTemperature] = useState<LeadTemperature | undefined>(undefined);

  const [drawerLead, setDrawerLead] = useState<FunnelLead | null>(null);
  const [stageModal, setStageModal] = useState<StageModalState>({ open: false, mode: 'create', stage: null });
  const [stageSaving, setStageSaving] = useState(false);
  const [deletingStage, setDeletingStage] = useState<FunnelStage | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  /** Para onde vão os leads da etapa que está sendo excluída. */
  const [reassignTo, setReassignTo] = useState('');
  const [removingLead, setRemovingLead] = useState<FunnelLead | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [groupStage, setGroupStage] = useState<FunnelStage | null>(null);
  const [groupSaving, setGroupSaving] = useState(false);

  const { toasts, addToast, removeToast } = useToast();
  const firstLoaded = useRef(false);
  /** Funil cujo quadro está na tela — é como a troca de aba se distingue de um recarregamento. */
  const shownFunnelRef = useRef<string | null>(null);
  /** Resposta de um funil anterior que chega depois da troca é descartada. */
  const boardRequestRef = useRef(0);
  const user = useAuthUser();
  const canCreateGroup = hasPermission(user, 'groups');
  const boardFiltered = !!(debouncedSearch || channelType || origin || temperature);

  const loadFunnels = useCallback(async (preferId?: string) => {
    try {
      const list = await funnelService.listFunnels();
      setFunnels(list.funnels);
      setFunnelChannels(list.channels);
      setMaxExtraFunnels(list.maxExtraFunnels);
      setActiveFunnelId((current) => {
        const wanted = preferId ?? current ?? readStoredFunnelId();
        if (wanted && list.funnels.some((funnel) => funnel.id === wanted)) return wanted;
        return list.funnels.find((funnel) => funnel.isMain)?.id ?? '';
      });
    } catch {
      // Sem a lista, o quadro abre no principal e só não dá para trocar de funil.
      setActiveFunnelId((current) => current ?? '');
    }
  }, []);

  useEffect(() => {
    void loadFunnels();
  }, [loadFunnels]);

  useEffect(() => {
    if (!activeFunnelId) return;
    try {
      localStorage.setItem(ACTIVE_FUNNEL_KEY, activeFunnelId);
    } catch {
      // Navegação privada ou armazenamento bloqueado: só não lembra a aba.
    }
  }, [activeFunnelId]);

  const loadBoard = useCallback(async () => {
    if (activeFunnelId === null) return;
    const requestId = boardRequestRef.current + 1;
    boardRequestRef.current = requestId;
    const switching = firstLoaded.current && shownFunnelRef.current !== activeFunnelId;
    if (!firstLoaded.current) setLoading(true);
    else if (switching) setBoardLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const board = await funnelService.getBoard({
        ...(activeFunnelId ? { funnelId: activeFunnelId } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(channelType ? { channelType } : {}),
        ...(origin ? { origin } : {}),
      });
      const nextColumns: Record<string, FunnelLead[]> = {};
      const nextHasMore: Record<string, boolean> = {};
      for (const stage of board.stages) {
        const column = board.columns[stage.id];
        nextColumns[stage.id] = column?.leads ?? [];
        nextHasMore[stage.id] = column?.hasMore ?? false;
      }
      if (requestId !== boardRequestRef.current) return;
      setStages(board.stages);
      setColumns(nextColumns);
      setHasMoreByStage(nextHasMore);
      shownFunnelRef.current = activeFunnelId;
    } catch (err) {
      if (requestId !== boardRequestRef.current) return;
      const message = err instanceof Error ? err.message : 'Erro ao carregar o funil.';
      if (switching) {
        // Volta para a aba que estava na tela em vez de mostrar colunas de outro funil.
        addToast('error', message);
        setActiveFunnelId(shownFunnelRef.current);
      } else {
        setError(message);
      }
    } finally {
      if (requestId === boardRequestRef.current) {
        firstLoaded.current = true;
        setLoading(false);
        setRefreshing(false);
        setBoardLoading(false);
      }
    }
  }, [activeFunnelId, debouncedSearch, channelType, origin, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const adjustTotals = useCallback((fromStageId: string, toStageId: string) => {
    if (fromStageId === toStageId) return;
    setStages((prev) =>
      prev.map((stage) => {
        if (stage.id === fromStageId) return { ...stage, total: Math.max(0, stage.total - 1) };
        if (stage.id === toStageId) return { ...stage, total: stage.total + 1 };
        return stage;
      }),
    );
  }, []);

  const handlePersistMove = useCallback(
    async (leadId: string, fromStageId: string, toStageId: string, index: number) => {
      adjustTotals(fromStageId, toStageId);
      try {
        await funnelService.moveLead(leadId, toStageId, index);
      } catch {
        addToast('error', 'Não foi possível mover o lead. Recarregando...');
        loadBoard();
      }
    },
    [adjustTotals, addToast, loadBoard],
  );

  const handleLoadMore = useCallback(
    async (stageId: string) => {
      setLoadingMoreStage(stageId);
      try {
        const current = columns[stageId] ?? [];
        const column = await funnelService.getStageLeads(stageId, {
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          ...(channelType ? { channelType } : {}),
          ...(origin ? { origin } : {}),
          skip: current.length,
          limit: 20,
        });
        setColumns((prev) => {
          const existing = prev[stageId] ?? [];
          const seen = new Set(existing.map((lead) => lead.id));
          const merged = [...existing, ...column.leads.filter((lead) => !seen.has(lead.id))];
          return { ...prev, [stageId]: merged };
        });
        setHasMoreByStage((prev) => ({ ...prev, [stageId]: column.hasMore }));
      } catch {
        addToast('error', 'Não foi possível carregar mais leads.');
      } finally {
        setLoadingMoreStage(null);
      }
    },
    [columns, debouncedSearch, channelType, origin, addToast],
  );

  const handleLeadSaved = useCallback(
    (updated: FunnelLead, fromStageId: string | null) => {
      const targetStageId = updated.funnelStageId ?? stages[0]?.id ?? null;
      setColumns((prev) => {
        const next: Record<string, FunnelLead[]> = {};
        for (const key of Object.keys(prev)) {
          next[key] = (prev[key] ?? []).filter((lead) => lead.id !== updated.id);
        }
        if (targetStageId) {
          const base = next[targetStageId] ?? [];
          next[targetStageId] = [updated, ...base];
        }
        return next;
      });
      if (fromStageId && targetStageId && fromStageId !== targetStageId) {
        adjustTotals(fromStageId, targetStageId);
      }
      setDrawerLead(null);
      addToast('success', 'Lead atualizado com sucesso.');
    },
    [stages, adjustTotals, addToast],
  );

  const handleStageSubmit = useCallback(
    async (name: string, color: StageColor, aiCriteria: string) => {
      setStageSaving(true);
      try {
        if (stageModal.mode === 'create') {
          await funnelService.createStage(name, color, aiCriteria, activeFunnelId || undefined);
          await loadBoard();
          addToast('success', 'Etapa criada com sucesso.');
        } else if (stageModal.stage) {
          const updated = await funnelService.updateStage(stageModal.stage.id, { name, color, aiCriteria });
          setStages((prev) =>
            prev.map((stage) =>
              stage.id === updated.id
                ? { ...stage, name: updated.name, color: updated.color, aiCriteria: updated.aiCriteria }
                : stage,
            ),
          );
          addToast('success', 'Etapa atualizada.');
        }
        setStageModal({ open: false, mode: 'create', stage: null });
      } catch (err) {
        addToast('error', err instanceof Error ? err.message : 'Erro ao salvar a etapa.');
      } finally {
        setStageSaving(false);
      }
    },
    [stageModal, activeFunnelId, loadBoard, addToast],
  );

  const openDeleteStage = useCallback(
    (stage: FunnelStage) => {
      const fallback = stages.find((item) => item.id !== stage.id);
      setReassignTo(fallback?.id ?? '');
      setDeletingStage(stage);
    },
    [stages],
  );

  const handleDeleteStage = useCallback(async () => {
    if (!deletingStage) return;
    setDeleteLoading(true);
    try {
      await funnelService.deleteStage(deletingStage.id, reassignTo || undefined);
      setDeletingStage(null);
      await loadBoard();
      addToast('success', 'Etapa excluída. Os leads foram realocados.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao excluir a etapa.');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingStage, reassignTo, loadBoard, addToast]);

  /**
   * A ordem muda quem é a etapa de entrada e recalcula as taxas de conversão, que saem
   * do formato do funil — por isso o quadro é relido depois que o servidor confirma.
   */
  const handleReorderStages = useCallback(
    async (stageIds: string[]) => {
      const previous = stages;
      const byId = new Map(previous.map((stage) => [stage.id, stage]));
      const reordered = stageIds
        .map((stageId) => byId.get(stageId))
        .filter((stage): stage is FunnelStage => !!stage);
      setStages(reordered);
      try {
        await funnelService.reorderStages(stageIds);
        await loadBoard();
      } catch (err) {
        setStages(previous);
        addToast('error', err instanceof Error ? err.message : 'Erro ao reordenar as etapas.');
      }
    },
    [stages, loadBoard, addToast],
  );

  const handleRemoveLead = useCallback(async () => {
    if (!removingLead) return;
    setRemoveLoading(true);
    try {
      await funnelService.removeLeadFromFunnel(removingLead.id);
      const stageId = removingLead.funnelStageId ?? stages.find((stage) => stage.isEntry)?.id ?? null;
      setColumns((prev) => {
        const next: Record<string, FunnelLead[]> = {};
        for (const key of Object.keys(prev)) {
          next[key] = (prev[key] ?? []).filter((lead) => lead.id !== removingLead.id);
        }
        return next;
      });
      if (stageId) {
        setStages((prev) =>
          prev.map((stage) => (stage.id === stageId ? { ...stage, total: Math.max(0, stage.total - 1) } : stage)),
        );
      }
      setRemovingLead(null);
      setDrawerLead(null);
      addToast('success', 'Lead removido do funil. Ele volta assim que houver uma nova interação.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao remover o lead do funil.');
    } finally {
      setRemoveLoading(false);
    }
  }, [removingLead, stages, addToast]);

  const handleCreateGroup = useCallback(
    async (name: string) => {
      if (!groupStage) return;
      setGroupSaving(true);
      try {
        const group = await funnelService.createGroupFromStage(groupStage.id, name);
        setGroupStage(null);
        addToast('success', `Grupo "${group.name}" criado com ${group.memberCount.toLocaleString('pt-BR')} contato(s).`);
      } catch (err) {
        addToast('error', err instanceof Error ? err.message : 'Erro ao criar o grupo.');
      } finally {
        setGroupSaving(false);
      }
    },
    [groupStage, addToast],
  );

  const handleCreateFunnel = useCallback(
    async (payload: CreateFunnelPayload) => {
      setFunnelSaving(true);
      try {
        const created = await funnelService.createFunnel(payload);
        setFunnelModal({ open: false, funnel: null });
        await loadFunnels(created.id);
        addToast('success', `Funil "${created.name}" criado.`);
      } catch (err) {
        addToast('error', err instanceof Error ? err.message : 'Erro ao criar o funil.');
      } finally {
        setFunnelSaving(false);
      }
    },
    [loadFunnels, addToast],
  );

  const handleUpdateFunnel = useCallback(
    async (funnelId: string, payload: UpdateFunnelPayload) => {
      setFunnelSaving(true);
      try {
        await funnelService.updateFunnel(funnelId, payload);
        setFunnelModal({ open: false, funnel: null });
        await loadFunnels();
        // Contatos trazidos de outro funil entram na primeira coluna deste.
        if (payload.moveExistingContacts && funnelId === activeFunnelId) await loadBoard();
        addToast('success', 'Funil atualizado.');
      } catch (err) {
        addToast('error', err instanceof Error ? err.message : 'Erro ao salvar o funil.');
      } finally {
        setFunnelSaving(false);
      }
    },
    [activeFunnelId, loadFunnels, loadBoard, addToast],
  );

  const handleDeleteFunnel = useCallback(async () => {
    if (!deletingFunnel) return;
    setFunnelDeleteLoading(true);
    try {
      await funnelService.deleteFunnel(deletingFunnel.id);
      setDeletingFunnel(null);
      await loadFunnels(funnels.find((funnel) => funnel.isMain)?.id);
      addToast('success', 'Funil excluído. Os cards foram para o funil principal.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao excluir o funil.');
    } finally {
      setFunnelDeleteLoading(false);
    }
  }, [deletingFunnel, funnels, loadFunnels, addToast]);

  const activeFunnel = funnels.find((funnel) => funnel.id === activeFunnelId) ?? null;
  const multipleFunnels = funnels.length > 1;
  const funnelLimitReached = funnels.filter((funnel) => !funnel.isMain).length >= maxExtraFunnels;
  const funnelIdParam = activeFunnelId || undefined;

  if (loading) {
    return <SkeletonPage><SkeletonCards count={6}/></SkeletonPage>;
  }

  if (error && stages.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm font-medium text-red-500">{error}</p>
          <Button size="sm" onClick={() => loadBoard()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            {multipleFunnels ? 'Funis' : 'Funil de vendas'}
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
            {multipleFunnels
              ? funnelSourceHint(activeFunnel, funnelChannels)
              : 'Onde cada lead está e quanto ainda dá para fechar'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {funnels.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus size={14} />}
              disabled={funnelLimitReached}
              title={funnelLimitReached ? 'Você já tem o número máximo de funis. Exclua um para criar outro.' : undefined}
              onClick={() => setFunnelModal({ open: true, funnel: null })}
            >
              Novo funil
            </Button>
          )}
          {/* Só as colunas do quadro viajam no arquivo — os leads ficam. */}
          <ImportExportMenu
            resourceLabel="etapas do funil"
            onExport={() => funnelService.exportStagesCsv(funnelIdParam)}
            onImport={(csv) => funnelService.importStagesCsv(csv, funnelIdParam)}
            onImported={() => { void loadBoard(); }}
            onError={(message) => addToast('error', message)}
          />
        </div>
      </div>

      {multipleFunnels && activeFunnelId && (
        <FunnelTabs
          funnels={funnels}
          activeId={activeFunnelId}
          onSelect={setActiveFunnelId}
          onConfigure={(funnel) => setFunnelModal({ open: true, funnel })}
        />
      )}

      <FunnelFilters
        search={search}
        onSearchChange={setSearch}
        channelType={channelType}
        onChannelChange={setChannelType}
        origin={origin}
        onOriginChange={setOrigin}
        temperature={temperature}
        onTemperatureChange={setTemperature}
        onNewStage={() => setStageModal({ open: true, mode: 'create', stage: null })}
        onRefresh={() => loadBoard()}
        refreshing={refreshing}
      />

      {boardLoading ? (
        <SkeletonCards count={6}/>
      ) : (
        <FunnelBoard
          stages={stages}
          columns={columns}
          hasMoreByStage={hasMoreByStage}
          loadingMoreStage={loadingMoreStage}
          temperatureFilter={temperature}
          canCreateGroup={canCreateGroup}
          onColumnsChange={setColumns}
          onPersistMove={handlePersistMove}
          onOpenLead={setDrawerLead}
          onLoadMore={handleLoadMore}
          onRenameStage={(stage) => setStageModal({ open: true, mode: 'edit', stage })}
          onDeleteStage={openDeleteStage}
          onCreateGroup={setGroupStage}
          onReorderStages={handleReorderStages}
        />
      )}

      <LeadDetailDrawer
        lead={drawerLead}
        stages={stages}
        onClose={() => setDrawerLead(null)}
        onSaved={handleLeadSaved}
        onRemoveFromFunnel={setRemovingLead}
      />

      <StageModal
        isOpen={stageModal.open}
        mode={stageModal.mode}
        loading={stageSaving}
        {...(stageModal.stage
          ? {
            initialName: stageModal.stage.name,
            initialColor: stageModal.stage.color,
            initialAiCriteria: stageModal.stage.aiCriteria,
          }
          : {})}
        onClose={() => setStageModal({ open: false, mode: 'create', stage: null })}
        onSubmit={handleStageSubmit}
      />

      {deletingStage && (
        <Modal isOpen onClose={() => (deleteLoading ? undefined : setDeletingStage(null))} title="Excluir etapa" size="sm">
          <div className="space-y-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tem certeza que deseja excluir a etapa{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">&quot;{deletingStage.name}&quot;</span>? Os{' '}
              {deletingStage.total} lead(s) desta etapa precisam de um novo lugar no funil.
            </p>
            <Select
              label="Mover os leads para"
              value={reassignTo}
              onChange={setReassignTo}
              disabled={deleteLoading}
              options={stages
                .filter((stage) => stage.id !== deletingStage.id)
                .map((stage) => ({ value: stage.id, label: stage.name }))}
            />
            {deletingStage.isEntry && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Esta é a etapa de entrada. Ao excluí-la, a primeira etapa restante passa a receber os leads novos.
              </p>
            )}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
              <Button variant="ghost" onClick={() => setDeletingStage(null)} disabled={deleteLoading}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDeleteStage} loading={deleteLoading} loadingText="Excluindo...">
                Excluir etapa
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {removingLead && (
        <Modal
          isOpen
          onClose={() => (removeLoading ? undefined : setRemovingLead(null))}
          title="Remover do funil"
          size="sm"
        >
          <div className="space-y-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tirar{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                &quot;{removingLead.displayName || 'Sem nome'}&quot;
              </span>{' '}
              do quadro. O contato continua no CRM, com conversa e histórico — ele reaparece no funil assim que houver
              uma nova interação.
            </p>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
              <Button variant="ghost" onClick={() => setRemovingLead(null)} disabled={removeLoading}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleRemoveLead} loading={removeLoading} loadingText="Removendo...">
                Remover do funil
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {groupStage && (
        <StageGroupModal
          stage={groupStage}
          filtered={boardFiltered}
          loading={groupSaving}
          onClose={() => (groupSaving ? undefined : setGroupStage(null))}
          onSubmit={handleCreateGroup}
        />
      )}

      <FunnelModal
        isOpen={funnelModal.open}
        funnel={funnelModal.funnel}
        funnels={funnels}
        channels={funnelChannels}
        loading={funnelSaving}
        onClose={() => (funnelSaving ? undefined : setFunnelModal({ open: false, funnel: null }))}
        onCreate={handleCreateFunnel}
        onUpdate={handleUpdateFunnel}
        onDelete={(funnel) => {
          setFunnelModal({ open: false, funnel: null });
          setDeletingFunnel(funnel);
        }}
      />

      <ConfirmDeleteModal
        isOpen={deletingFunnel !== null}
        title="Excluir funil"
        message={deletingFunnel
          ? `Os cards de "${deletingFunnel.name}" vão para a primeira coluna do funil principal, e os canais dele passam a cair lá. As colunas deste funil serão apagadas.`
          : ''}
        confirmLabel="Excluir funil"
        loading={funnelDeleteLoading}
        onClose={() => (funnelDeleteLoading ? undefined : setDeletingFunnel(null))}
        onConfirm={handleDeleteFunnel}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
