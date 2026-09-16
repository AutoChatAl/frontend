'use client';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useRef, useState } from 'react';

import type { FunnelLead, FunnelStage, LeadTemperature } from '@/types/Funnel';

import FunnelColumn, { COLUMN_DRAG_PREFIX } from './FunnelColumn';
import { LeadCardOverlay } from './LeadCard';

interface FunnelBoardProps {
  stages: FunnelStage[];
  columns: Record<string, FunnelLead[]>;
  hasMoreByStage: Record<string, boolean>;
  loadingMoreStage: string | null;
  temperatureFilter: LeadTemperature | undefined;
  onColumnsChange: (next: Record<string, FunnelLead[]>) => void;
  onPersistMove: (leadId: string, fromStageId: string, toStageId: string, index: number) => void;
  onOpenLead: (lead: FunnelLead) => void;
  onLoadMore: (stageId: string) => void;
  onRenameStage: (stage: FunnelStage) => void;
  onDeleteStage: (stage: FunnelStage) => void;
  /** Nova ordem das colunas, da esquerda para a direita. */
  onReorderStages: (stageIds: string[]) => void;
}

const isColumnId = (id: string) => id.startsWith(COLUMN_DRAG_PREFIX);
const toStageId = (id: string) => (isColumnId(id) ? id.slice(COLUMN_DRAG_PREFIX.length) : id);

export default function FunnelBoard({
  stages,
  columns,
  hasMoreByStage,
  loadingMoreStage,
  temperatureFilter,
  onColumnsChange,
  onPersistMove,
  onOpenLead,
  onLoadMore,
  onRenameStage,
  onDeleteStage,
  onReorderStages,
}: FunnelBoardProps) {
  const [activeLead, setActiveLead] = useState<FunnelLead | null>(null);
  const originStageRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findStageOf = (rawId: string): string | undefined => {
    const id = toStageId(rawId);
    if (columns[id]) return id;
    return stages.find((stage) => (columns[stage.id] ?? []).some((lead) => lead.id === id))?.id;
  };

  const findLead = (id: string): FunnelLead | undefined => {
    for (const stage of stages) {
      const found = (columns[stage.id] ?? []).find((lead) => lead.id === id);
      if (found) return found;
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (isColumnId(id)) return;
    originStageRef.current = findStageOf(id) ?? null;
    setActiveLead(findLead(id) ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    // Coluna só troca de lugar no fim do gesto; no meio dele não há nada a prever.
    if (isColumnId(activeId)) return;
    const overId = String(over.id);
    const fromStage = findStageOf(activeId);
    const toStage = findStageOf(overId);
    if (!fromStage || !toStage || fromStage === toStage) return;
    const fromLeads = columns[fromStage] ?? [];
    const toLeads = columns[toStage] ?? [];
    const moving = fromLeads.find((lead) => lead.id === activeId);
    if (!moving) return;
    const overIndex = toLeads.findIndex((lead) => lead.id === overId);
    const insertAt = overIndex >= 0 ? overIndex : toLeads.length;
    const nextFrom = fromLeads.filter((lead) => lead.id !== activeId);
    const nextTo = [...toLeads.slice(0, insertAt), { ...moving, funnelStageId: toStage }, ...toLeads.slice(insertAt)];
    onColumnsChange({ ...columns, [fromStage]: nextFrom, [toStage]: nextTo });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);
    const origin = originStageRef.current;
    originStageRef.current = null;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (isColumnId(activeId)) {
      const from = stages.findIndex((stage) => stage.id === toStageId(activeId));
      const to = stages.findIndex((stage) => stage.id === toStageId(overId));
      if (from < 0 || to < 0 || from === to) return;
      onReorderStages(arrayMove(stages, from, to).map((stage) => stage.id));
      return;
    }

    const toStage = findStageOf(overId);
    if (!toStage) return;
    const toLeads = columns[toStage] ?? [];
    const oldIndex = toLeads.findIndex((lead) => lead.id === activeId);
    if (oldIndex < 0) return;
    let finalLeads = toLeads;
    // Solto sobre a coluna (e não sobre um card): vai para o fim da fila. O id pode vir
    // prefixado quando a área que recebeu foi a da coluna arrastável.
    const overStageKey = toStageId(overId);
    const overIndex = columns[overStageKey] ? toLeads.length - 1 : toLeads.findIndex((lead) => lead.id === overId);
    if (overIndex >= 0 && overIndex !== oldIndex) {
      finalLeads = arrayMove(toLeads, oldIndex, overIndex);
      onColumnsChange({ ...columns, [toStage]: finalLeads });
    }
    const finalIndex = Math.max(0, finalLeads.findIndex((lead) => lead.id === activeId));
    onPersistMove(activeId, origin ?? toStage, toStage, finalIndex);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100dvh-13rem)] gap-4 overflow-x-auto pb-2">
        <SortableContext
          items={stages.map((stage) => `${COLUMN_DRAG_PREFIX}${stage.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          {stages.map((stage) => (
            <FunnelColumn
              key={stage.id}
              stage={stage}
              leads={columns[stage.id] ?? []}
              hasMore={hasMoreByStage[stage.id] ?? false}
              loadingMore={loadingMoreStage === stage.id}
              temperatureFilter={temperatureFilter}
              canDelete={stages.length > 1}
              onOpenLead={onOpenLead}
              onLoadMore={onLoadMore}
              onRenameStage={onRenameStage}
              onDeleteStage={onDeleteStage}
            />
          ))}
        </SortableContext>
      </div>
      <DragOverlay>{activeLead ? <LeadCardOverlay lead={activeLead} /> : null}</DragOverlay>
    </DndContext>
  );
}
