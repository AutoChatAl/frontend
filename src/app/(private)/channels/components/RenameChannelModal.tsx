'use client';
import { Pencil } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import Modal from '@/components/Modal';

/** Mesmos limites do schema Zod no backend — validar aqui só evita o round-trip. */
const MIN_LENGTH = 2;
const MAX_LENGTH = 60;

interface RenameChannelModalProps {
    isOpen: boolean;
    currentName: string;
    /** Linha de contexto sob o campo (ex.: o número ou o @usuário do canal). */
    hint?: string;
    loading: boolean;
    onClose: () => void;
    onConfirm: (name: string) => void;
}

export default function RenameChannelModal({ isOpen, currentName, hint, loading, onClose, onConfirm }: RenameChannelModalProps) {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

  const trimmed = name.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_LENGTH;
  const unchanged = trimmed === currentName.trim();
  const disabled = loading || trimmed.length < MIN_LENGTH || unchanged;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (disabled) {
      return;
    }
    onConfirm(trimmed);
  };

  return (<Modal isOpen={isOpen} onClose={onClose} title="Renomear canal" size="sm">
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <Pencil size={16}/>
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">{currentName}</p>
          {hint && (<p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{hint}</p>)}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="channel-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Novo nome
        </label>
        <input id="channel-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={MAX_LENGTH} autoFocus disabled={loading} placeholder="Ex.: Atendimento Comercial" className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 ${tooShort
          ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400'
          : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-400'}`}/>
        <p className={`text-xs ${tooShort ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
          {tooShort ? `Use pelo menos ${MIN_LENGTH} caracteres.` : 'Só o nome interno muda, a conexão e as conversas continuam iguais.'}
        </p>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50">
            Cancelar
        </button>
        <button type="submit" disabled={disabled} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading && (<div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"/>)}
            Salvar
        </button>
      </div>
    </form>
  </Modal>);
}
