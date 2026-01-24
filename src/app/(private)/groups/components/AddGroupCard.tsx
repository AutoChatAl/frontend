'use client';

import { Plus } from 'lucide-react';

interface AddGroupCardProps {
  onClick?: () => void;
}

export default function AddGroupCard({ onClick }: AddGroupCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all group h-full min-h-50"
    >
      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        <Plus size={28} className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
      </div>
      <span className="font-bold text-slate-600 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">
        Criar Novo Grupo
      </span>
      <span className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center max-w-50">
        Crie listas para WhatsApp, Instagram ou mistas para suas campanhas.
      </span>
    </button>
  );
}
