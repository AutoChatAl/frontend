'use client';

import { AlertTriangle } from 'lucide-react';

import Modal from './Modal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  loading?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar exclusão',
  message = 'Tem certeza que deseja deletar? Esta ação não pode ser desfeita.',
  confirmLabel = 'Deletar',
  loading = false,
}: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>

        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
