'use client';
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
    className?: string;
}

/**
 * Card comum por fora — o vermelho fica só nas ações. Passar `border-red-*` no
 * className do Card não pintaria nada mesmo: no CSS gerado o `border-slate-200`
 * dele vem depois e ganha.
 */
export default function DangerZone({ actions, className = '' }: DangerZoneProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">Zona de perigo</h3>
        <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
            Ações irreversíveis. Não dá para desfazer depois de confirmar.
        </p>
      </div>
      <div className="space-y-2">
        {actions.map((action) => (
          <div key={action.buttonLabel} className="flex flex-col gap-2 rounded-lg border border-red-100 bg-red-50 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-red-500/20 dark:bg-red-500/10">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-red-700 dark:text-red-300">{action.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-red-600 dark:text-red-400">{action.description}</p>
            </div>
            <button
              type="button"
              onClick={action.onClick}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:py-1.5 ${action.destructive
                ? 'bg-red-600 text-white shadow-sm shadow-red-200 hover:bg-red-700 dark:shadow-none'
                : 'border border-red-200 bg-white text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10'}`}
            >
              {action.buttonLabel}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
