'use client';
import { AlertCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import Button from '@/components/Button';
import ImportExportMenu from '@/components/ImportExportMenu';
import Modal from '@/components/Modal';
import Select from '@/components/Select';
import { SkeletonCards, SkeletonPage } from '@/components/Skeleton';
import { ToastContainer, useToast } from '@/components/Toast';
import { funnelService } from '@/services/funnel.service';
import type { ChannelType, FunnelLead, FunnelStage, LeadOrigin, LeadTemperature, StageColor } from '@/types/Funnel';

import FunnelBoard from './components/FunnelBoard';
import FunnelFilters from './components/FunnelFilters';
import LeadDetailDrawer from './components/LeadDetailDrawer';
import StageModal from './components/StageModal';

interface StageModalState {
  open: boolean;
  mode: 'create' | 'edit';
  stage: FunnelStage | null;
}

export default function FunnelPage() {
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

  const { toasts, addToast, removeToast } = useToast();
  const firstLoaded = useRef(false);

  const loadBoard = useCallback(async () => {
    if (firstLoaded.current) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const board = await funnelService.getBoard({
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
      setStages(board.stages);
      setColumns(nextColumns);
      setHasMoreByStage(nextHasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o funil.');
    } finally {
      firstLoaded.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, channelType, origin]);

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
          await funnelService.createStage(name, color, aiCriteria);
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
    [stageModal, loadBoard, addToast],
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

  if (loading) {
    return <SkeletonPage><SkeletonCards count={6}/></SkeletonPage>;
  }

  if (error && stages.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
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
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Funil de vendas</h1>
          <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
            Onde cada lead está e quanto ainda dá para fechar
          </p>
        </div>
        {/* Só as colunas do quadro viajam no arquivo — os leads ficam. */}
        <ImportExportMenu
          resourceLabel="etapas do funil"
          onExport={() => funnelService.exportStagesCsv()}
          onImport={(csv) => funnelService.importStagesCsv(csv)}
          onImported={() => { void loadBoard(); }}
          onError={(message) => addToast('error', message)}
        />
      </div>

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

      <FunnelBoard
        stages={stages}
        columns={columns}
        hasMoreByStage={hasMoreByStage}
        loadingMoreStage={loadingMoreStage}
        temperatureFilter={temperature}
        onColumnsChange={setColumns}
        onPersistMove={handlePersistMove}
        onOpenLead={setDrawerLead}
        onLoadMore={handleLoadMore}
        onRenameStage={(stage) => setStageModal({ open: true, mode: 'edit', stage })}
        onDeleteStage={openDeleteStage}
        onReorderStages={handleReorderStages}
      />

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

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
