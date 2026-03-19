'use client';

import { AlertTriangle } from 'lucide-react';

import Card from '@/components/Card';

interface DangerAction {
  label: string;
  description: string;
  buttonLabel: string;
  onClick?: () => void;
  destructive?: boolean;
}

interface DangerZoneProps {
  actions: DangerAction[];
}

export default function DangerZone({ actions }: DangerZoneProps) {
  return (
    <Card className="p-6 border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
      <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
        <AlertTriangle size={20} /> Zona de Perigo
      </h3>
      <div className="space-y-4">
        {actions.map((action, i) => (
          <div
            key={action.buttonLabel}
            className={`flex items-center justify-between py-3 ${
              i < actions.length - 1 ? 'border-b border-red-100 dark:border-red-900/30' : ''
            }`}
          >
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">{action.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{action.description}</p>
            </div>
            <button
              onClick={action.onClick}
              className={
                action.destructive
                  ? 'px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700'
                  : 'px-3 py-1.5 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20'
              }
            >
              {action.buttonLabel}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
