'use client';

interface AIRuleToggleProps {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

export default function AIRuleToggle({ title, description, enabled, onToggle }: AIRuleToggleProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-50 dark:border-slate-700 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full relative transition-colors ${enabled ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${enabled ? 'right-0.5' : 'left-0.5'}`}></div>
      </button>
    </div>
  );
}
