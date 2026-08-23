'use client';
import { Loader2, Pencil, Plus, Power, PowerOff, RefreshCw, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import Card from '@/components/Card';

export interface ChannelRow {
    id: string;
    name: string;
    /** Linha secundária: número, @usuário ou o motivo de estar fora do ar. */
    subtitle: string;
    connected: boolean;
    /** Preenchido só para o dono do workspace, quando o canal é de outro membro. */
    ownerName?: string | null;
}

export type ChannelAccent = 'emerald' | 'teal' | 'fuchsia';

/**
 * Classes completas por acento — o Tailwind varre o código-fonte em busca de
 * classes literais, então montar `bg-${accent}-50` em runtime não gera CSS.
 */
const ACCENTS: Record<ChannelAccent, {
    tile: string;
    bar: string;
}> = {
  emerald: {
    tile: 'border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500',
  },
  teal: {
    tile: 'border-teal-100 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400',
    bar: 'bg-teal-500',
  },
  fuchsia: {
    tile: 'border-fuchsia-100 dark:border-fuchsia-500/20 bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
    bar: 'bg-fuchsia-500',
  },
};

/** Ação primária do card — indigo em todos os tipos, o acento fica no ícone. */
const ADD_BUTTON = 'shrink-0 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/10';

interface ChannelTypeCardProps {
    title: string;
    description: string;
    icon: ReactNode;
    accent: ChannelAccent;
    rows: ChannelRow[];
    loading: boolean;
    /** Sem permissão o card vira somente leitura: nada de conectar, editar ou apagar. */
    canManage: boolean;
    addLabel: string;
    adding?: boolean;
    emptyMessage: string;
    onAdd: () => void;
    /** Ação de ligar um canal parado. Ausente = o tipo não suporta reativar. */
    onActivate?: ((row: ChannelRow) => void) | undefined;
    /** Ação de desligar sem apagar. Ausente = o tipo não suporta desativar. */
    onDeactivate?: ((row: ChannelRow) => void) | undefined;
    /** Ressincroniza os dados do canal com o provedor. Opcional por tipo. */
    onRefresh?: ((row: ChannelRow) => void) | undefined;
    onRename: (row: ChannelRow) => void;
    onDelete: (row: ChannelRow) => void;
    /** Canal com ação em andamento — trava os botões da linha e mostra o spinner. */
    busyId?: string | null;
    /** Avatar customizado por linha (o Instagram usa a foto do perfil). */
    renderAvatar?: (row: ChannelRow) => ReactNode;
    /** Ancora o passo do tour de onboarding no botão de adicionar. */
    addTourId?: string;
    /** Falha ao carregar a lista — substitui o estado vazio, que mentiria aqui. */
    errorMessage?: string | null;
}

const ACTION_BUTTON = 'flex h-7 w-7 items-center justify-center rounded-md border border-transparent transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';

export default function ChannelTypeCard({
  title,
  description,
  icon,
  accent,
  rows,
  loading,
  canManage,
  addLabel,
  adding = false,
  emptyMessage,
  onAdd,
  onActivate,
  onDeactivate,
  onRefresh,
  onRename,
  onDelete,
  busyId,
  renderAvatar,
  addTourId,
  errorMessage,
}: ChannelTypeCardProps) {
  const palette = ACCENTS[accent];
  const connectedCount = rows.filter((row) => row.connected).length;

  return (<Card className="p-4 sm:p-5 h-full flex flex-col">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{description}</p>
        </div>
      </div>
      {canManage && (<button type="button" onClick={onAdd} disabled={adding} {...(addTourId ? { 'data-tour': addTourId } : {})} className={ADD_BUTTON}>
        {adding ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>}
        {addLabel}
      </button>)}
    </div>

    {rows.length > 0 && (<div className="mt-3 flex items-center gap-2">
      <div className="h-1 flex-1 rounded-full bg-slate-100 dark:bg-slate-700/60 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${palette.bar}`} style={{ width: `${Math.round((connectedCount / rows.length) * 100)}%` }}/>
      </div>
      <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500 shrink-0">
        {connectedCount}/{rows.length} no ar
      </span>
    </div>)}

    <div className="mt-3 flex-1">
      {loading && rows.length === 0 ? (<div className="space-y-2 animate-pulse" aria-hidden>
        <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-700/50"/>
        <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-700/50"/>
      </div>) : rows.length === 0 ? (<div className="h-full min-h-32 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 px-4 text-center">
        <p className="text-[13px] text-slate-600 dark:text-slate-400">{errorMessage || emptyMessage}</p>
        {!errorMessage && canManage && (<button type="button" onClick={onAdd} disabled={adding} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer disabled:opacity-50">
          {addLabel}
        </button>)}
      </div>) : (<ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
        {rows.map((row) => {
          const busy = busyId === row.id;
          return (<li key={row.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 min-w-0">
            <span className="relative shrink-0">
              {renderAvatar ? renderAvatar(row) : (<span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${palette.tile}`}>
                {icon}
              </span>)}
              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-800 ${row.connected ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} aria-hidden/>
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">{row.name}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {row.subtitle}
                {row.ownerName ? ` · de ${row.ownerName}` : ''}
              </p>
            </div>

            <span className={`shrink-0 hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${row.connected
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'}`}>
              {row.connected ? 'Ativo' : 'Parado'}
            </span>

            {canManage && (<div className="flex shrink-0 items-center gap-0.5">
              {busy ? (<span className="flex h-7 w-7 items-center justify-center text-slate-400 dark:text-slate-500">
                <Loader2 size={14} className="animate-spin"/>
              </span>) : (<>
                {onRefresh && (<button type="button" onClick={() => onRefresh(row)} title="Sincronizar dados" aria-label={`Sincronizar ${row.name}`} className={`${ACTION_BUTTON} text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10`}>
                  <RefreshCw size={14}/>
                </button>)}
                {row.connected
                  ? onDeactivate && (<button type="button" onClick={() => onDeactivate(row)} title="Desativar" aria-label={`Desativar ${row.name}`} className={`${ACTION_BUTTON} text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10`}>
                    <PowerOff size={14}/>
                  </button>)
                  : onActivate && (<button type="button" onClick={() => onActivate(row)} title="Ativar" aria-label={`Ativar ${row.name}`} className={`${ACTION_BUTTON} text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10`}>
                    <Power size={14}/>
                  </button>)}
                <button type="button" onClick={() => onRename(row)} title="Renomear" aria-label={`Renomear ${row.name}`} className={`${ACTION_BUTTON} text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10`}>
                  <Pencil size={14}/>
                </button>
                <button type="button" onClick={() => onDelete(row)} title="Deletar" aria-label={`Deletar ${row.name}`} className={`${ACTION_BUTTON} text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10`}>
                  <Trash2 size={14}/>
                </button>
              </>)}
            </div>)}
          </li>);
        })}
      </ul>)}
    </div>
  </Card>);
}
