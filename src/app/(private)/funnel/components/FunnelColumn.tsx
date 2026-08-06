'use client';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Loader2, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { FunnelLead, FunnelStage, LeadTemperature } from '@/types/Funnel';

import SortableLeadCard from './LeadCard';
import { stageColorMeta } from './meta';

interface FunnelColumnProps {
  stage: FunnelStage;
  leads: FunnelLead[];
  hasMore: boolean;
  loadingMore: boolean;
  temperatureFilter: LeadTemperature | undefined;
  onOpenLead: (lead: FunnelLead) => void;
  onLoadMore: (stageId: string) => void;
  onRenameStage: (stage: FunnelStage) => void;
  onDeleteStage: (stage: FunnelStage) => void;
}

export default function FunnelColumn({
  stage,
  leads,
  hasMore,
  loadingMore,
  temperatureFilter,
  onOpenLead,
  onLoadMore,
  onRenameStage,
  onDeleteStage,
}: FunnelColumnProps) {
  const color = stageColorMeta(stage.color);
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const visibleLeads = temperatureFilter ? leads.filter((lead) => lead.temperature === temperatureFilter) : leads;
  const ids = visibleLeads.map((lead) => lead.id);
  const count = temperatureFilter ? visibleLeads.length : stage.total;

  return (
    <div className="flex h-full w-72 shrink-0 flex-col sm:w-80">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.dot}`} />
        <h3 className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{stage.name}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-700/60 dark:text-slate-300">
          {count}
        </span>
        <div className="relative ml-auto" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-150 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onRenameStage(stage);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
              >
                <Pencil size={14} className="text-slate-400" />
                Editar etapa
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteStage(stage);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2.5 overflow-y-auto rounded-xl p-1.5 transition-colors ${isOver ? 'bg-indigo-50/70 ring-1 ring-indigo-200 dark:bg-indigo-500/5 dark:ring-indigo-500/20' : ''}`}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {visibleLeads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} onOpen={onOpenLead} />
          ))}
        </SortableContext>

        {visibleLeads.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 px-3 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
            {temperatureFilter ? 'Nenhum lead com essa temperatura' : 'Arraste leads para cá'}
          </div>
        )}

        {hasMore && !temperatureFilter && (
          <button
            type="button"
            onClick={() => onLoadMore(stage.id)}
            disabled={loadingMore}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
          >
            {loadingMore ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Carregar mais
          </button>
        )}
      </div>
    </div>
  );
}
