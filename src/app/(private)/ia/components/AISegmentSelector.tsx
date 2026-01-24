'use client';

import { ArrowDownRight, Briefcase } from 'lucide-react';

interface AISegmentSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

const segments = [
  'Varejo / E-commerce',
  'Serviços Profissionais',
  'Restaurante / Delivery',
  'Saúde e Bem-estar',
  'Educação e Cursos',
  'Imobiliária',
  'Outro',
];

export default function AISegmentSelector({ value, onChange }: AISegmentSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Segmento do Negócio</label>
      <div className="relative">
        <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
        >
          {segments.map((segment) => (
            <option key={segment}>{segment}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          <ArrowDownRight size={14} />
        </div>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500">Ajuda a IA a entender o contexto das conversas.</p>
    </div>
  );
}
