'use client';
import { Clock3 } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

/**
 * Campo de hora: input comum com máscara `HH:MM`.
 *
 * A pessoa digita só os dígitos e os dois pontos aparecem sozinhos. A validação
 * roda ao sair do campo: hora fora de 00:00–23:59, ou incompleta, vira a hora
 * do momento — nunca sobra um valor quebrado para o backend.
 *
 * Enquanto o campo está em foco o valor vindo de fora não sobrescreve o que
 * está sendo digitado; fora do foco, quem manda é a prop.
 */

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Em grades estreitas o relógio só rouba largura — dá para desligar. */
  showIcon?: boolean;
  /**
   * `md` (padrão) tem 42px de altura, a mesma de Input e DatePicker, para as
   * três coisas ficarem alinhadas numa linha de formulário. `sm` é a versão
   * compacta da grade de horários semanais.
   */
  size?: 'sm' | 'md';
  ariaLabel?: string;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Só dígitos, no máximo quatro, com os dois pontos entrando a partir do terceiro. */
function maskTime(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function currentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function TimePicker({
  value,
  onChange,
  disabled = false,
  showIcon = true,
  size = 'md',
  ariaLabel,
}: TimePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(() => maskTime(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(maskTime(value));
  }, [value, focused]);

  const handleChange = (raw: string) => {
    const masked = maskTime(raw);
    setDraft(masked);
    // Assim que fica válido já sobe, para o formulário acompanhar a digitação
    // sem depender do blur.
    if (TIME_PATTERN.test(masked) && masked !== value) onChange(masked);
  };

  const commit = () => {
    setFocused(false);
    const next = TIME_PATTERN.test(draft) ? draft : currentTime();
    setDraft(next);
    if (next !== value) onChange(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      inputRef.current?.blur();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setDraft(maskTime(value));
      inputRef.current?.blur();
    }
  };

  // Só acusa erro quando os quatro dígitos estão lá e ainda assim não fecham
  // (25:00, 08:74). Meio caminho digitado não é erro, é meio caminho.
  const invalid = draft.length === 5 && !TIME_PATTERN.test(draft);

  return (
    <div
      className={`flex w-full min-w-0 items-center gap-1.5 rounded-lg border bg-white px-2 transition-colors dark:bg-slate-800 ${
        invalid
          ? 'border-rose-400 focus-within:ring-2 focus-within:ring-rose-500/20'
          : 'border-slate-200 hover:border-slate-300 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-700 dark:hover:border-slate-600'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      {showIcon && <Clock3 size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={5}
        placeholder="00:00"
        aria-label={ariaLabel ?? 'Hora'}
        aria-invalid={invalid}
        value={draft}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={`w-full min-w-0 bg-transparent text-center tabular-nums text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed dark:text-white dark:placeholder:text-slate-500 ${
          size === 'sm' ? 'h-8 text-[13px]' : 'h-10 text-sm'
        }`}
      />
    </div>
  );
}
