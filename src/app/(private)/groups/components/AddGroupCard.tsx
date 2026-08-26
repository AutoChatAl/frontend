'use client';
import { Plus } from 'lucide-react';

interface AddGroupCardProps {
    onClick?: () => void;
}

/** Último bloco da grade: mesma altura dos cards, com a moldura tracejada. */
export default function AddGroupCard({ onClick }: AddGroupCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 p-4 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:bg-slate-700/60 dark:text-slate-500 dark:group-hover:bg-indigo-500/15 dark:group-hover:text-indigo-400">
        <Plus size={18} />
      </span>
      <span className="text-[13px] font-medium text-slate-600 transition-colors group-hover:text-indigo-700 dark:text-slate-300 dark:group-hover:text-indigo-400">
        Criar novo grupo
      </span>
      <span className="max-w-48 text-[11px] text-slate-400 dark:text-slate-500">
        Listas para WhatsApp, Instagram ou mistas
      </span>
    </button>
  );
}
