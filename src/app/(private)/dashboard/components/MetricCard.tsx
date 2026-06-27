import type { ComponentType } from 'react';

interface MetricCardProps {
    title: string;
    value: number;
    icon: ComponentType<{
        size?: number;
        className?: string;
    }>;
    color: string;
    bgColor: string;
    format?: (value: number) => string;
}
export default function MetricCard({ title, value, icon: Icon, color, bgColor, format }: MetricCardProps) {
  return (<div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bgColor}`}>
      <Icon size={18} className={color}/>
    </div>
    <div className="min-w-0">
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{title}</p>
      <p className="text-xl font-bold text-slate-800 dark:text-white">
        {format ? format(value) : value.toLocaleString('pt-BR')}
      </p>
    </div>
  </div>);
}
