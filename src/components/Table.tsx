'use client';
import { Check, Minus } from 'lucide-react';
import React, { type ReactNode, useRef, useCallback, useEffect } from 'react';

import Button from './Button';
import Card from './Card';
import SearchBar from './SearchBar';

interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => ReactNode);
    className?: string;
    render?: (value: unknown, row: T) => ReactNode;
}
interface TableSelection<T extends { id: number | string }> {
    /** Ids marcados. */
    selectedIds: ReadonlySet<T['id']>;
    onToggle: (row: T) => void;
    /** Marca todas as linhas carregadas — ou desmarca, se já estiverem todas marcadas. */
    onToggleAll: () => void;
}
interface SelectionBoxProps {
    checked: boolean;
    /** Parte das linhas marcada: mostra o traço em vez do check. */
    indeterminate?: boolean;
    disabled?: boolean;
    onChange: () => void;
    /** Rótulo acessível — o checkbox não tem texto ao lado. */
    label: string;
}
/** Checkbox de seleção de linha, no mesmo desenho do `Checkbox`, sem rótulo visível. */
export function SelectionBox({ checked, indeterminate = false, disabled = false, onChange, label }: SelectionBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputRef.current)
      inputRef.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);
  const filled = checked || indeterminate;
  return (<label className={`relative inline-flex h-5 w-5 shrink-0 align-middle ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} onClick={(e) => e.stopPropagation()}>
    <input ref={inputRef} type="checkbox" checked={checked} disabled={disabled} onChange={onChange} aria-label={label} className="peer absolute inset-0 z-10 h-5 w-5 cursor-pointer opacity-0 disabled:cursor-not-allowed"/>
    <span aria-hidden="true" className={`pointer-events-none h-5 w-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${filled
      ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'} peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-slate-900`}>
      {checked ? <Check size={14} className="text-white" strokeWidth={3}/> : indeterminate ? <Minus size={12} className="text-white" strokeWidth={3}/> : null}
    </span>
  </label>);
}
interface TableProps<T extends { id: number | string }> {
    columns: Column<T>[];
    data: T[];
    actions?: {
        searchBar?: {
            placeholder?: string;
            value?: string;
            onChange?: (value: string) => void;
        };
        /** Filtros extras, renderizados ao lado da busca. */
        filters?: ReactNode;
        buttons?: Array<{
            label: string;
            icon?: ReactNode;
            onClick: () => void;
            variant?: 'primary' | 'secondary' | 'ghost';
        }>;
    };
    /** Com este prop a tabela ganha a coluna de checkbox, com "selecionar todos" no cabeçalho. */
    selection?: TableSelection<T>;
    renderActions?: (row: T) => ReactNode;
    renderMobileCard?: (row: T) => ReactNode;
    getRowClassName?: (row: T) => string;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loadingMore?: boolean;
}
export default function Table<T extends {
    id: number | string;
}>({ columns, data, actions, selection, renderActions, renderMobileCard, getRowClassName, onLoadMore, hasMore, loadingMore }: TableProps<T>) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const selectedCount = selection ? data.filter((row) => selection.selectedIds.has(row.id)).length : 0;
  const allSelected = !!selection && data.length > 0 && selectedCount === data.length;
  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting && hasMore && !loadingMore && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, loadingMore, onLoadMore]);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !onLoadMore)
      return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect, onLoadMore]);
  return (<div className="space-y-4">
    {actions && (<div className="flex flex-wrap items-center justify-end gap-2">
      {actions.filters}
      {actions.searchBar && (<SearchBar placeholder={actions.searchBar.placeholder ?? ''} value={actions.searchBar.value ?? ''} onChange={actions.searchBar.onChange ?? ((_v: string) => { })}/>)}
      {actions.buttons?.map((button) => (<Button key={button.label} onClick={button.onClick} icon={button.icon} variant={button.variant || 'primary'}>
        {button.label}
      </Button>))}
    </div>)}

    {renderMobileCard && (<div className="flex flex-col gap-3 md:hidden">
      {data.map((row) => (<React.Fragment key={row.id}>
        {renderMobileCard(row)}
      </React.Fragment>))}
    </div>)}

    <Card className={`overflow-hidden ${renderMobileCard ? 'hidden md:block' : ''}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
              {selection && (<th className="p-4 w-12">
                <SelectionBox checked={allSelected} indeterminate={selectedCount > 0 && !allSelected} disabled={data.length === 0} onChange={selection.onToggleAll} label="Selecionar todos"/>
              </th>)}
              {columns.map((column) => (<th key={column.header} className={`p-4 font-semibold ${column.className || ''}`}>
                {column.header}
              </th>))}
              {renderActions && (<th className="p-4 font-semibold text-right">Ações</th>)}
            </tr>
          </thead>
          <tbody className="text-sm">
            {data.map((row) => {
              const rowClass = getRowClassName ? getRowClassName(row) : '';
              const isSelected = !!selection && selection.selectedIds.has(row.id);
              return (<tr key={row.id} className={`transition-colors group ${rowClass
                ? rowClass
                : 'hover:bg-slate-50/50 dark:hover:bg-slate-700/30 border-b border-slate-50 dark:border-slate-700/50'} ${isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''}`}>
                {selection && (<td className="p-4 w-12">
                  <SelectionBox checked={isSelected} onChange={() => selection.onToggle(row)} label="Selecionar linha"/>
                </td>)}
                {columns.map((column) => {
                  const value: ReactNode = typeof column.accessor === 'function'
                    ? column.accessor(row)
                    : (row[column.accessor] as unknown as ReactNode);
                  return (<td key={column.header} className={`p-4 ${column.className || ''}`}>
                    {column.render ? column.render(value, row) : value}
                  </td>);
                })}
                {renderActions && (<td className="p-4 text-right">
                  {renderActions(row)}
                </td>)}
              </tr>);
            })}
          </tbody>
        </table>
      </div>

      {onLoadMore && (<div ref={!renderMobileCard ? sentinelRef : undefined} className="py-3 text-center text-xs text-slate-400 dark:text-slate-500">
        {loadingMore ? 'Carregando...' : ''}
      </div>)}
    </Card>

    {renderMobileCard && onLoadMore && (<div ref={sentinelRef} className="py-3 text-center text-xs text-slate-400 dark:text-slate-500 md:hidden">
      {loadingMore ? 'Carregando...' : ''}
    </div>)}
  </div>);
}
