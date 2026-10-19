'use client';
import { Bot, ChevronDown, Clock, Loader2 } from 'lucide-react';

import Select from '@/components/Select';
import Skeleton from '@/components/Skeleton';
import type { FunnelLeadPlacement, FunnelStageDefinition } from '@/types/Funnel';
import { stageColorMeta } from '@/utils/funnelStageColors';

import type { ContactFunnelState } from '../useContactFunnel';
import { relativeTime } from './ChatBits';
import PopoverMenu from './PopoverMenu';

/** Mover para ganho ou perda encerra o atendimento no servidor — vale avisar antes do clique. */
const CLOSING_STAGE_HINT = 'Marca o atendimento como resolvido';

const OFF_BOARD_CHIP = 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400';

interface FunnelStagePickerProps {
    funnel: ContactFunnelState;
    /** `chip` — selo compacto no cabeçalho do chat; `field` — campo da seção Funil do painel. */
    variant: 'chip' | 'field';
    className?: string;
}

function findStage(stages: FunnelStageDefinition[], placement: FunnelLeadPlacement): FunnelStageDefinition | null {
  if (!placement.stageId) return null;
  return stages.find((stage) => stage.id === placement.stageId) ?? null;
}

function StageDot({ stage }: { stage: FunnelStageDefinition }) {
  return <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${stageColorMeta(stage.color).dot}`}/>;
}

function StageMenu({ stages, currentId, onPick }: {
    stages: FunnelStageDefinition[];
    currentId: string | null;
    onPick: (stageId: string) => void;
}) {
  return (<div className="max-h-72 overflow-y-auto p-1.5">
    <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
      Mover para
    </p>
    {stages.map((stage) => {
      const active = stage.id === currentId;
      return (<button key={stage.id} type="button" role="menuitem" disabled={active} onClick={() => onPick(stage.id)} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${active
        ? 'bg-slate-50 dark:bg-slate-900/60 cursor-default'
        : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer'}`}>
        <StageDot stage={stage}/>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-slate-900 dark:text-white">{stage.name}</span>
          {(stage.isWon || stage.isLost) && !active && (<span className="block truncate text-[11px] text-slate-400 dark:text-slate-500">
            {CLOSING_STAGE_HINT}
          </span>)}
        </span>
        {active && (<span className="shrink-0 text-[10px] font-semibold text-indigo-500 dark:text-indigo-400">atual</span>)}
      </button>);
    })}
  </div>);
}

/** Selo do cabeçalho: a etapa sempre à vista, e o clique abre a lista para mover. */
function StageChip({ funnel, className }: { funnel: ContactFunnelState; className: string }) {
  const { stages, placement, moving, moveTo } = funnel;
  if (!placement) return null;
  // O `className` vai sempre num invólucro: as classes de exibição de quem chama
  // (`hidden sm:inline-flex`) não podem disputar com o `inline-flex` do próprio selo.
  if (placement.offBoardReason === 'AWAITING_REPLY') {
    return (<div className={className}>
      <span title="Contato importado: entra no funil quando responder." className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${OFF_BOARD_CHIP}`}>
        <Clock size={11}/>
        Fora do funil
      </span>
    </div>);
  }
  const stage = findStage(stages, placement);
  const meta = stage ? stageColorMeta(stage.color) : null;
  return (<div className={className}>
    <PopoverMenu
      side="down"
      align="end"
      widthClassName="w-60"
      disabled={moving || stages.length === 0}
      label={stage ? `Etapa do funil: ${stage.name}. Mover para outra etapa` : 'Fora do funil. Colocar em uma etapa'}
      trigger={(open) => (<span className={`inline-flex max-w-[11rem] items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-opacity hover:opacity-80 ${meta ? `${meta.soft} ${meta.text}` : OFF_BOARD_CHIP} ${open ? 'ring-1 ring-slate-200 dark:ring-slate-600' : ''}`}>
        {moving
          ? <Loader2 size={11} className="shrink-0 animate-spin"/>
          : <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta ? meta.dot : 'border border-slate-400 dark:border-slate-500'}`}/>}
        <span className="truncate">{stage ? stage.name : 'Fora do funil'}</span>
        <ChevronDown size={11} className="shrink-0 opacity-70"/>
      </span>)}
    >
      {(close) => (<StageMenu stages={stages} currentId={stage?.id ?? null} onPick={(stageId) => {
        close();
        moveTo(stageId);
      }}/>)}
    </PopoverMenu>
  </div>);
}

/** Linha abaixo do campo: há quanto tempo o contato está na etapa e quem o colocou lá. */
function StageNote({ placement, stage, moving }: {
    placement: FunnelLeadPlacement;
    stage: FunnelStageDefinition | null;
    moving: boolean;
}) {
  if (moving) {
    return <p className="text-[11px] text-slate-400 dark:text-slate-500">Movendo…</p>;
  }
  if (!stage) {
    return (<p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
      {placement.offBoardReason === 'REMOVED'
        ? 'Tirado do funil. Ele volta sozinho na próxima mensagem, ou escolha uma etapa agora.'
        : 'Escolha uma etapa para colocar o contato no quadro.'}
    </p>);
  }
  if (!placement.stageEnteredAt) return null;
  const since = relativeTime(placement.stageEnteredAt);
  if (placement.stageMovedBy === 'AI') {
    return (<div className="space-y-0.5">
      <p className="flex items-center gap-1 text-[11px] font-medium text-violet-600 dark:text-violet-400">
        <Bot size={11}/>
        Movido pela IA {since}
      </p>
      {placement.stageMoveReason && (<p title={placement.stageMoveReason} className="line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        {placement.stageMoveReason}
      </p>)}
    </div>);
  }
  return <p className="text-[11px] text-slate-400 dark:text-slate-500">Entrou nesta etapa {since}</p>;
}

/** Campo da seção Funil do painel: etapa atual, a troca e o contexto de como ele chegou lá. */
function StageField({ funnel, className }: { funnel: ContactFunnelState; className: string }) {
  const { stages, placement, loading, loadFailed, moving, moveTo } = funnel;
  if (loading) {
    return (<div className={`space-y-1.5 ${className}`} aria-busy="true" aria-label="Carregando etapa do funil">
      <Skeleton className="h-8 w-full"/>
      <Skeleton className="h-3 w-28"/>
    </div>);
  }
  if (loadFailed || !placement) {
    return (<p className={`text-xs text-slate-400 dark:text-slate-500 ${className}`}>
      Não foi possível carregar a etapa do funil.
    </p>);
  }
  if (placement.offBoardReason === 'AWAITING_REPLY') {
    return (<div className={`flex items-start gap-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 px-2.5 py-2 ${className}`}>
      <Clock size={14} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500"/>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Fora do funil por enquanto</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">Contato importado: ele entra no quadro quando responder.</p>
      </div>
    </div>);
  }
  const stage = findStage(stages, placement);
  return (<div className={`space-y-1.5 ${className}`}>
    <Select
      size="sm"
      value={stage?.id ?? ''}
      placeholder="Fora do funil — escolha uma etapa"
      disabled={moving || stages.length === 0}
      options={stages.map((option) => ({
        value: option.id,
        label: option.name,
        icon: <StageDot stage={option}/>,
        ...(option.isWon || option.isLost ? { description: CLOSING_STAGE_HINT } : {}),
      }))}
      onChange={(stageId) => moveTo(stageId)}
    />
    <StageNote placement={placement} stage={stage} moving={moving}/>
  </div>);
}

/**
 * Etapa do contato no funil, vista de dentro da conversa. O mesmo estado aparece em
 * dois lugares: o selo no cabeçalho do chat, sempre à vista, e o campo da seção Funil
 * do painel de detalhes, com o contexto de quando e por quem o contato foi movido.
 */
export default function FunnelStagePicker({ funnel, variant, className = '' }: FunnelStagePickerProps) {
  return variant === 'chip'
    ? <StageChip funnel={funnel} className={className}/>
    : <StageField funnel={funnel} className={className}/>;
}
