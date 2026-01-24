'use client';

import React, { type ReactNode } from 'react';

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
}

export default function Table<T extends { id: number | string }>({
  columns,
  data,
  actions,
  renderActions,
}: TableProps<T>) {
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
          {actions.buttons?.map((button, index) => (
            <Button
              key={index}
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
                {columns.map((column, index) => (
                  <th key={index} className={`p-4 font-semibold ${column.className || ''}`}>
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
                  {columns.map((column, colIndex) => {
                    const value: ReactNode = typeof column.accessor === 'function'
                      ? column.accessor(row)
                      : (row[column.accessor] as unknown as ReactNode);

                    return (
                      <td key={colIndex} className={`p-4 ${column.className || ''}`}>
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
      </Card>
    </div>
  );
}
