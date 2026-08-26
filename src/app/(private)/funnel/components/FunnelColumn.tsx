'use client';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Loader2, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { FunnelLead, FunnelStage, LeadTemperature } from '@/types/Funnel';

import SortableLeadCard from './LeadCard';
import { CONFIDENCE_META, stageColorMeta } from './meta';

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
  // A etapa de destino e a de perda não têm taxa própria: uma é 100%, a outra 0%.
  const showRate = !stage.isGoal && !stage.isLost;

  return (
    <div className="flex h-full w-72 shrink-0 flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 sm:w-80">
      <div className="border-b border-slate-100 p-3 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.dot}`} />
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{stage.name}</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500 dark:bg-slate-700/60 dark:text-slate-300">
            {count}
          </span>
          <div className="relative ml-auto" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Ações da etapa"
              className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            >
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <div className="animate-dropdown absolute right-0 top-8 z-20 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRenameStage(stage);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
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
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <Trash2 size={14} />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quanto do que passa por aqui costuma fechar — a barra é a mesma taxa. */}
        {showRate && (
          <div className="mt-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">converte em média</span>
              <span
                className="text-[11px] font-semibold tabular-nums text-slate-600 dark:text-slate-300"
                title={CONFIDENCE_META[stage.conversionConfidence].label}
              >
                {stage.conversionConfidence === 'low' ? '~' : ''}
                {stage.conversionRate}%
              </span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60">
              <div
                className={`h-full rounded-full ${color.bar}`}
                style={{ width: `${Math.min(100, stage.conversionRate)}%` }}
              />
            </div>
            {/* A faixa é o intervalo de 95%: mostra o quanto ainda é chute. */}
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
              <span className="tabular-nums">
                {stage.conversionLow}–{stage.conversionHigh}%
              </span>
              {stage.conversionBasis === 'outcome'
                ? ` · ${stage.conversionSample} leads`
                : ' · pelo ritmo do funil'}
            </p>
          </div>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto p-2 transition-colors ${isOver ? 'bg-indigo-50/70 dark:bg-indigo-500/5' : ''}`}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {visibleLeads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} onOpen={onOpenLead} />
          ))}
        </SortableContext>

        {visibleLeads.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-200 px-3 text-center text-[13px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
            {temperatureFilter ? 'Nenhum lead com essa temperatura' : 'Arraste leads para cá'}
          </div>
        )}

        {hasMore && !temperatureFilter && (
          <button
            type="button"
            onClick={() => onLoadMore(stage.id)}
            disabled={loadingMore}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
          >
            {loadingMore ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Carregar mais
          </button>
        )}
      </div>
    </div>
  );
}
