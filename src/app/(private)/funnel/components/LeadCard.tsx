'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, ShoppingCart, StickyNote, TrendingUp } from 'lucide-react';
import { type CSSProperties } from 'react';

import type { FunnelLead } from '@/types/Funnel';

import {
  ATTENDANCE_META,
  CHANNEL_META,
  formatCurrency,
  formatRelative,
  formatWaiting,
  getInitials,
  TEMPERATURE_META,
} from './meta';
import ScoreRing from './ScoreRing';
import TemperatureBadge from './TemperatureBadge';

const SHELL_BASE = 'group relative rounded-xl border bg-white p-3 dark:bg-slate-800';

function CardBody({ lead }: { lead: FunnelLead }) {
  const accent = TEMPERATURE_META[lead.temperature].dot;
  const attendance = ATTENDANCE_META[lead.attendanceStatus];
  const waiting = lead.awaitingHuman ? formatWaiting(lead.awaitingHumanSince) : null;
  const visibleTags = lead.tags.slice(0, 3);
  const extraTags = lead.tags.length - visibleTags.length;
  const hasSale = lead.salesValueCents > 0;
  const showValue = hasSale || lead.abandonedValueCents > 0;
  const valueCents = hasSale ? lead.salesValueCents : lead.abandonedValueCents;

  return (
    <>
      <span className={`absolute bottom-3 left-0 top-3 w-1 rounded-full ${accent}`} />
      <div className="pl-2.5">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            {getInitials(lead.displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {lead.displayName || 'Sem nome'}
              </p>
              {lead.channels.map((channel) => {
                const ChannelIcon = CHANNEL_META[channel].icon;
                return (
                  <span
                    key={channel}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${CHANNEL_META[channel].className}`}
                    title={CHANNEL_META[channel].label}
                  >
                    <ChannelIcon size={9} />
                  </span>
                );
              })}
            </div>
            {lead.identifier && (
              <p className="truncate font-mono text-[11px] text-slate-400 dark:text-slate-500">{lead.identifier}</p>
            )}
          </div>
          <ScoreRing score={lead.score} temperature={lead.temperature} size={38} />
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <TemperatureBadge temperature={lead.temperature} />
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
            <TrendingUp size={10} />
            {lead.conversionProbability}%
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <span className={`h-1.5 w-1.5 rounded-full ${attendance.dot}`} />
            {attendance.label}
          </span>
        </div>

        {visibleTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {visibleTags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-700/50 dark:text-slate-400"
              >
                {tag.name}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-slate-400">+{extraTags}</span>
            )}
          </div>
        )}

        {lead.notes && (
          <p className="mt-2 flex items-start gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <StickyNote size={11} className="mt-0.5 shrink-0" />
            <span className="line-clamp-1">{lead.notes}</span>
          </p>
        )}

        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-700/60">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <Clock size={11} />
            {formatRelative(lead.lastInteractionAt)}
          </span>
          {showValue ? (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${hasSale ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
            >
              <ShoppingCart size={11} />
              {formatCurrency(valueCents)}
            </span>
          ) : (
            waiting && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-500 dark:bg-red-500/10 dark:text-red-400">
                {waiting} sem resposta
              </span>
            )
          )}
        </div>
      </div>
    </>
  );
}

export function LeadCardOverlay({ lead }: { lead: FunnelLead }) {
  return (
    <div className={`${SHELL_BASE} w-72 rotate-1 cursor-grabbing border-indigo-300 shadow-xl ring-2 ring-indigo-500/20 dark:border-indigo-500/40`}>
      <CardBody lead={lead} />
    </div>
  );
}

interface SortableLeadCardProps {
  lead: FunnelLead;
  onOpen?: (lead: FunnelLead) => void;
}

export default function SortableLeadCard({ lead, onOpen }: SortableLeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style: CSSProperties = {};
  const transformValue = CSS.Translate.toString(transform);
  if (transformValue) style.transform = transformValue;
  if (transition) style.transition = transition;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(lead)}
      className={`${SHELL_BASE} cursor-grab touch-none border-slate-200 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-slate-700 ${isDragging ? 'opacity-40' : ''}`}
    >
      <CardBody lead={lead} />
    </div>
  );
}
