'use client';
import { AlertCircle, Trello } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import Button from '@/components/Button';
import Modal from '@/components/Modal';
import PageLoader from '@/components/PageLoader';
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
          const sameStage = fromStageId === targetStageId;
          const base = next[targetStageId] ?? [];
          next[targetStageId] = sameStage ? [updated, ...base] : [updated, ...base];
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
    async (name: string, color: StageColor) => {
      setStageSaving(true);
      try {
        if (stageModal.mode === 'create') {
          await funnelService.createStage(name, color);
          await loadBoard();
          addToast('success', 'Etapa criada com sucesso.');
        } else if (stageModal.stage) {
          const updated = await funnelService.updateStage(stageModal.stage.id, { name, color });
          setStages((prev) =>
            prev.map((stage) => (stage.id === updated.id ? { ...stage, name: updated.name, color: updated.color } : stage)),
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

  const handleDeleteStage = useCallback(async () => {
    if (!deletingStage) return;
    setDeleteLoading(true);
    try {
      await funnelService.deleteStage(deletingStage.id);
      setDeletingStage(null);
      await loadBoard();
      addToast('success', 'Etapa excluída. Os leads foram realocados.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao excluir a etapa.');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingStage, loadBoard, addToast]);

  const totalLeads = stages.reduce((sum, stage) => sum + stage.total, 0);

  if (loading) {
    return <PageLoader message="Carregando o funil..." />;
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
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <Trello size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Funil de vendas</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Acompanhe e qualifique seus leads
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {totalLeads} leads
              </span>
            </p>
          </div>
        </div>
      </header>

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
        onDeleteStage={(stage) => setDeletingStage(stage)}
      />

      <LeadDetailDrawer
        lead={drawerLead}
        stages={stages}
        onClose={() => setDrawerLead(null)}
        onSaved={handleLeadSaved}
      />

      <StageModal
        isOpen={stageModal.open}
        mode={stageModal.mode}
        loading={stageSaving}
        {...(stageModal.stage ? { initialName: stageModal.stage.name, initialColor: stageModal.stage.color } : {})}
        onClose={() => setStageModal({ open: false, mode: 'create', stage: null })}
        onSubmit={handleStageSubmit}
      />

      {deletingStage && (
        <Modal isOpen onClose={() => (deleteLoading ? undefined : setDeletingStage(null))} title="Excluir etapa" size="sm">
          <div className="space-y-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tem certeza que deseja excluir a etapa{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">&quot;{deletingStage.name}&quot;</span>? Os
              leads desta etapa serão movidos para outra etapa do funil.
            </p>
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

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
