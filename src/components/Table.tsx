'use client';

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

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: {
    searchBar?: {
      placeholder?: string;
      value?: string;
      onChange?: (value: string) => void;
    };
    buttons?: Array<{
      label: string;
      icon?: ReactNode;
      onClick: () => void;
      variant?: 'primary' | 'secondary' | 'ghost';
    }>;
  };
  renderActions?: (row: T) => ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

export default function Table<T extends { id: number | string }>({
  columns,
  data,
  actions,
  renderActions,
  onLoadMore,
  hasMore,
  loadingMore,
}: TableProps<T>) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && !loadingMore && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, loadingMore, onLoadMore],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !onLoadMore) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect, onLoadMore]);

  return (
    <div className="space-y-4">
      {actions && (
        <div className="flex justify-end gap-2">
          {actions.searchBar && (
            <SearchBar
              placeholder={actions.searchBar.placeholder ?? ''}
              value={actions.searchBar.value ?? ''}
              onChange={actions.searchBar.onChange ?? ((_v: string) => {})}
            />
          )}
          {actions.buttons?.map((button) => (
            <Button
              key={button.label}
              onClick={button.onClick}
              icon={button.icon}
              variant={button.variant || 'primary'}
            >
              {button.label}
            </Button>
          ))}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                {columns.map((column) => (
                  <th key={column.header} className={`p-4 font-semibold ${column.className || ''}`}>
                    {column.header}
                  </th>
                ))}
                {renderActions && (
                  <th className="p-4 font-semibold text-right">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50 dark:divide-slate-700/50">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                  {columns.map((column) => {
                    const value: ReactNode = typeof column.accessor === 'function'
                      ? column.accessor(row)
                      : (row[column.accessor] as unknown as ReactNode);

                    return (
                      <td key={column.header} className={`p-4 ${column.className || ''}`}>
                        {column.render ? column.render(value, row) : value}
                      </td>
                    );
                  })}
                  {renderActions && (
                    <td className="p-4 text-right">
                      {renderActions(row)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {onLoadMore && (
          <div ref={sentinelRef} className="py-3 text-center text-xs text-slate-400 dark:text-slate-500">
            {loadingMore ? 'Carregando...' : ''}
          </div>
        )}
      </Card>
    </div>
  );
}
