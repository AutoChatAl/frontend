'use client';

export interface SegmentedOption<V extends string = string> {
  value: V;
  label: string;
}

interface SegmentedControlProps<V extends string = string> {
  options: ReadonlyArray<SegmentedOption<V>>;
  value: V;
  onChange: (value: V) => void;
  disabled?: boolean | undefined;
  /** Nome acessível do grupo — sem isto o leitor de tela só anuncia "grupo de opções". */
  ariaLabel: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Grupo de opções mutuamente exclusivas, para 2–4 escolhas curtas. Mesma casca do
 * seletor de ciclo de cobrança, sem o selo de desconto — nasceu para as
 * preferências de alerta, onde um `Select` de duas opções escondia a alternativa.
 */
export default function SegmentedControl<V extends string = string>({
  options,
  value,
  onChange,
  disabled = false,
  ariaLabel,
  size = 'sm',
  className = '',
}: SegmentedControlProps<V>) {
  const padding = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex flex-wrap rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-700 dark:bg-slate-800 ${disabled ? 'opacity-60' : ''} ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => { if (!active) onChange(option.value); }}
            className={`rounded-lg font-semibold transition-colors duration-200 ${padding} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${
              active
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
