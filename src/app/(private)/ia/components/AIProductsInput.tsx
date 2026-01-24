'use client';

import { ShoppingBag } from 'lucide-react';

interface AIProductsInputProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function AIProductsInput({ value, onChange }: AIProductsInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <ShoppingBag size={16} className="text-slate-400" />
        Principais Produtos / Serviços
      </label>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm leading-relaxed placeholder:text-slate-300 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
        placeholder="Ex: Roupas femininas (vestidos, blusas), Acessórios, Calçados esportivos..."
      ></textarea>
      <p className="text-xs text-slate-400 dark:text-slate-500">Liste os itens principais que você vende para dar contexto à IA.</p>
    </div>
  );
}
