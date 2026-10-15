'use client';
import { CheckCircle2, GraduationCap, Loader2, ShoppingBag, Store, type LucideIcon } from 'lucide-react';

import { BUSINESS_TYPE_DESCRIPTIONS, BUSINESS_TYPE_LABELS, BUSINESS_TYPES, type BusinessType } from '@/types/BusinessType';

interface BusinessTypePickerProps {
  value: BusinessType | null;
  saving: BusinessType | null;
  onPick: (type: BusinessType) => void;
}

const ICONS: Record<BusinessType, { icon: LucideIcon; tone: string }> = {
  local: { icon: Store, tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
  ecommerce: { icon: ShoppingBag, tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' },
  infoproduct: { icon: GraduationCap, tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400' },
};

export default function BusinessTypePicker({ value, saving, onPick }: BusinessTypePickerProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Tipo de negócio">
      {BUSINESS_TYPES.map((type) => {
        const { icon: Icon, tone } = ICONS[type];
        const selected = value === type;
        const isSaving = saving === type;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={saving !== null}
            onClick={() => onPick(type)}
            className={`group relative flex cursor-pointer flex-row items-start gap-3 rounded-lg border bg-white p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-sm disabled:cursor-wait disabled:hover:translate-y-0 dark:bg-slate-800 dark:shadow-none dark:hover:border-indigo-500/50 sm:flex-col sm:p-5 ${
              selected
                ? 'border-indigo-400 ring-2 ring-indigo-500/15 dark:border-indigo-400 dark:ring-indigo-400/15'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone}`}>
              {isSaving ? <Loader2 size={22} className="animate-spin" /> : <Icon size={22} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-slate-900 dark:text-white">{BUSINESS_TYPE_LABELS[type]}</span>
              <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">{BUSINESS_TYPE_DESCRIPTIONS[type]}</span>
            </span>
            {selected && (
              <CheckCircle2 size={18} className="absolute right-3 top-3 text-indigo-600 dark:text-indigo-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}
