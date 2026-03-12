'use client';

import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalActionsProps {
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmIcon?: ReactNode;
  loading?: boolean;
  loadingText?: string | undefined;
  disabled?: boolean;
  variant?: 'primary' | 'danger';
}

export default function ModalActions({
  onCancel,
  onConfirm,
  cancelLabel = 'Cancelar',
  confirmLabel = 'Confirmar',
  confirmIcon,
  loading = false,
  loadingText,
  disabled = false,
  variant = 'primary',
}: ModalActionsProps) {
  const confirmStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/25',
    danger: 'bg-red-600 hover:bg-red-700 shadow-sm shadow-red-500/25',
  };

  const isDisabled = disabled || loading;

  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={isDisabled}
        className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isDisabled}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmStyles[variant]}`}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : confirmIcon}
        {loading && loadingText ? loadingText : confirmLabel}
      </button>
    </div>
  );
}
