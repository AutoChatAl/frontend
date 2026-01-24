'use client';

import { ArrowDownRight, Mic } from 'lucide-react';

import { tonesOptions } from '@/types/AI';

interface AIToneSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function AIToneSelector({ value, onChange }: AIToneSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tom de Voz</label>
      <div className="relative">
        <Mic size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
        >
          {tonesOptions.map((tone) => (
            <option key={tone}>{tone}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          <ArrowDownRight size={14} />
        </div>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500">Define a personalidade da IA nas respostas.</p>
    </div>
  );
}
