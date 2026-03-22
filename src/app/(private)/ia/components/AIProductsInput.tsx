'use client';

import { ShoppingBag, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';

import type { Product } from '@/types/AI';

interface AIProductsInputProps {
  products: Product[];
  onAddProduct: (name: string) => void;
  onUpdateProduct: (id: string, data: { name?: string; priceCents?: number; link?: string }) => void;
  onDeleteProduct: (id: string) => void;
}

export default function AIProductsInput({ products, onAddProduct, onUpdateProduct, onDeleteProduct }: AIProductsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (raw: string) => {
    const name = raw.trim();
    if (name) onAddProduct(name);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(inputValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(',')) {
      const parts = val.split(',');
      parts.slice(0, -1).forEach((p) => {
        const name = p.trim();
        if (name) onAddProduct(name);
      });
      setInputValue(parts[parts.length - 1] ?? '');
    } else {
      setInputValue(val);
    }
  };

  const formatCents = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <ShoppingBag size={16} className="text-slate-400" />
        Principais Produtos / Serviços
      </label>

      <div
        className="flex flex-wrap items-center gap-2 w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-colors cursor-text min-h-10.5"
        onClick={() => inputRef.current?.focus()}
      >
        {products.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full border border-indigo-100 dark:border-indigo-800"
          >
            {p.name}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDeleteProduct(p.id); }}
              className="ml-0.5 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={products.length === 0 ? 'Digite e pressione Enter ou vírgula para adicionar...' : 'Adicionar...'}
          className="flex-1 min-w-30 bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-500"
        />
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Separe os produtos com vírgula ou Enter. Edite preço e link na tabela abaixo.
      </p>

      {products.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-left">
                <th className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-400">Nome</th>
                <th className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-400 w-36">Preço (R$)</th>
                <th className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-400">Link</th>
                <th className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-400 w-16 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onUpdate={onUpdateProduct}
                  onDelete={onDeleteProduct}
                  formatCents={formatCents}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductRow({
  product,
  onUpdate,
  onDelete,
  formatCents,
}: {
  product: Product;
  onUpdate: (id: string, data: { name?: string; priceCents?: number; link?: string }) => void;
  onDelete: (id: string) => void;
  formatCents: (cents: number) => string;
}) {
  const [price, setPrice] = useState(formatCents(product.priceCents));
  const [link, setLink] = useState(product.link);

  const handlePriceBlur = () => {
    const parsed = parseFloat(price.replace(/\./g, '').replace(',', '.'));
    const cents = isNaN(parsed) ? 0 : Math.round(parsed * 100);
    if (cents !== product.priceCents) {
      onUpdate(product.id, { priceCents: cents });
    }
    setPrice(formatCents(cents));
  };

  const handleLinkBlur = () => {
    if (link !== product.link) {
      onUpdate(product.id, { link });
    }
  };

  const cellInput =
    'w-full bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:ring-0';

  return (
    <tr className="bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-white">{product.name}</td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1">
          <span className="text-slate-400 dark:text-slate-500 text-xs">R$</span>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={handlePriceBlur}
            className={cellInput}
            placeholder="0,00"
          />
        </div>
      </td>
      <td className="px-4 py-2.5">
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onBlur={handleLinkBlur}
          className={cellInput}
          placeholder="https://..."
        />
      </td>
      <td className="px-4 py-2.5 text-center">
        <button
          type="button"
          onClick={() => onDelete(product.id)}
          className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
}
