'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Hand, ShoppingCart, TrendingUp } from 'lucide-react';
import { type CSSProperties } from 'react';

import type { FunnelLead } from '@/types/Funnel';

import { CHANNEL_META, formatCurrency, formatIdentifier, formatRelative, formatWaiting, getInitials } from './meta';
import ScoreRing from './ScoreRing';

const SHELL_BASE = 'group relative rounded-lg border p-3';
const SHELL_SURFACE = 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800';
/**
 * Mesma leitura vermelha da tela de Contatos: quem está na fila precisa saltar
 * da coluna sem que ninguém tenha que abrir o card para descobrir.
 */
const SHELL_WAITING = 'border-red-300 bg-red-50/40 dark:border-red-800 dark:bg-red-900/10';

/**
 * O card carrega só o que decide um arrasto: quem é, quanto vale, quão provável
 * é fechar e há quanto tempo está parado. Identificador, origem, observação e
 * status de atendimento vivem no painel de detalhes.
 */
function CardBody({ lead }: { lead: FunnelLead }) {
  const waiting = lead.awaitingHuman ? formatWaiting(lead.awaitingHumanSince) : null;
  const visibleTags = lead.tags.slice(0, 2);
  const extraTags = lead.tags.length - visibleTags.length;
  const identifier = formatIdentifier(lead.identifier);
  const hasSale = lead.salesValueCents > 0;
  const showValue = hasSale || lead.abandonedValueCents > 0;
  const valueCents = hasSale ? lead.salesValueCents : lead.abandonedValueCents;

  return (
    <div className="flex items-start gap-2.5">
      <ScoreRing score={lead.score} temperature={lead.temperature} size={36} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
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

        {identifier && (
          <p className="truncate font-mono text-[10px] leading-tight text-slate-400 dark:text-slate-500">{identifier}</p>
        )}

        {/*
          * Preso ao `awaitingHuman`, e não ao tempo: contato antigo pode estar na
          * fila sem `awaitingHumanSince` gravado, e nesses casos o selo aparece
          * do mesmo jeito, só sem a duração.
          */}
        {lead.awaitingHuman && (
          <span
            title={waiting ? `Aguardando atendimento há ${waiting}` : 'Aguardando atendimento'}
            className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-red-700 dark:bg-red-900/40 dark:text-red-400"
          >
            <Hand size={9} className="shrink-0" />
            {/* Rótulo curto: a coluna do kanban é estreita, e "Aguardando
              * atendimento" por extenso quebrava em duas linhas. O texto
              * completo fica no title. */}
            <span className="truncate">Na fila</span>
            {waiting && <span className="shrink-0 font-normal opacity-80">· {waiting}</span>}
          </span>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400"
            title={
              lead.conversionDrivers.length > 0
                ? `Chance de fechar. Pesou: ${lead.conversionDrivers.map((driver) => driver.label).join(', ')}`
                : 'Chance de fechar'
            }
          >
            <TrendingUp size={11} />
            {/* O til avisa que a amostra ainda é pequena, sem esconder o número. */}
            {lead.conversionConfidence === 'low' ? '~' : ''}
            {lead.conversionProbability}%
          </span>
          {showValue && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${hasSale ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
            >
              <ShoppingCart size={11} />
              {formatCurrency(valueCents)}
            </span>
          )}
          {/* O tempo de espera saiu daqui para o selo; aqui fica a última interação. */}
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <Clock size={11} />
            {formatRelative(lead.lastInteractionAt)}
          </span>
        </div>

        {visibleTags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
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
      </div>

      {/* Iniciais no canto: identifica sem competir com o nome. */}
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-500 dark:bg-slate-700/60 dark:text-slate-400">
        {getInitials(lead.displayName)}
      </span>
    </div>
  );
}

export function LeadCardOverlay({ lead }: { lead: FunnelLead }) {
  return (
    <div className={`${SHELL_BASE} w-72 rotate-1 cursor-grabbing border-indigo-300 bg-white shadow-xl ring-2 ring-indigo-500/20 dark:border-indigo-500/40 dark:bg-slate-800`}>
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
      className={`${SHELL_BASE} cursor-grab touch-none shadow-xs transition-shadow hover:shadow-md active:cursor-grabbing dark:shadow-none ${
        lead.awaitingHuman ? SHELL_WAITING : SHELL_SURFACE
      } ${isDragging ? 'opacity-40' : ''}`}
    >
      <CardBody lead={lead} />
    </div>
  );
}
