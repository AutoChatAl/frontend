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
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useRef, useState } from 'react';

import type { FunnelLead, FunnelStage, LeadTemperature } from '@/types/Funnel';

import FunnelColumn from './FunnelColumn';
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
}

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
}: FunnelBoardProps) {
  const [activeLead, setActiveLead] = useState<FunnelLead | null>(null);
  const originStageRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findStageOf = (id: string): string | undefined => {
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
    originStageRef.current = findStageOf(id) ?? null;
    setActiveLead(findLead(id) ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
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
    const toStage = findStageOf(overId);
    if (!toStage) return;
    const toLeads = columns[toStage] ?? [];
    const oldIndex = toLeads.findIndex((lead) => lead.id === activeId);
    if (oldIndex < 0) return;
    let finalLeads = toLeads;
    const overIndex = columns[overId] ? toLeads.length - 1 : toLeads.findIndex((lead) => lead.id === overId);
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
        {stages.map((stage) => (
          <FunnelColumn
            key={stage.id}
            stage={stage}
            leads={columns[stage.id] ?? []}
            hasMore={hasMoreByStage[stage.id] ?? false}
            loadingMore={loadingMoreStage === stage.id}
            temperatureFilter={temperatureFilter}
            onOpenLead={onOpenLead}
            onLoadMore={onLoadMore}
            onRenameStage={onRenameStage}
            onDeleteStage={onDeleteStage}
          />
        ))}
      </div>
      <DragOverlay>{activeLead ? <LeadCardOverlay lead={activeLead} /> : null}</DragOverlay>
    </DndContext>
  );
}
