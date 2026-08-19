'use client';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Loader2, Plus, Search, ShoppingBag, Sparkles, Star, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { Product, ProductPayload } from '@/types/AI';

interface AIProductsInputProps {
    products: Product[];
    total: number;
    maxProducts: number;
    loading: boolean;
    search: string;
    page: number;
    pageSize: number;
    onSearchChange: (value: string) => void;
    onPageChange: (page: number) => void;
    onAddProduct: (name: string) => void;
    onUpdateProduct: (id: string, data: ProductPayload) => void;
    onDeleteProduct: (id: string) => void;
    onOpenImport: () => void;
    onClearCatalog: () => void;
    crossSellEnabled: boolean;
    onToggleCrossSell: (enabled: boolean) => void;
}
function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parseCents(value: string): number {
  const parsed = parseFloat(value.replace(/\./g, '').replace(',', '.'));
  return isNaN(parsed) ? 0 : Math.round(parsed * 100);
}
export default function AIProductsInput({ products, total, maxProducts, loading, search, page, pageSize, onSearchChange, onPageChange, onAddProduct, onUpdateProduct, onDeleteProduct, onOpenImport, onClearCatalog, crossSellEnabled, onToggleCrossSell }: AIProductsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const limitReached = maxProducts > 0 && total >= maxProducts;
  const handleAdd = () => {
    const name = inputValue.trim();
    if (!name || limitReached)
      return;
    onAddProduct(name);
    setInputValue('');
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };
  return (<div className="space-y-3">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <ShoppingBag size={16} className="text-slate-400"/>
          Catálogo de Produtos / Serviços
      </label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onOpenImport} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all hover:scale-105 active:scale-95">
          <Upload size={14}/>
            Importar planilha
        </button>
        {total > 0 && (<button type="button" onClick={onClearCatalog} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <Trash2 size={14}/>
            Limpar
        </button>)}
      </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
        <input type="text" value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Buscar no catálogo por nome ou observação..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"/>
      </div>
      <div className="flex gap-2">
        <input ref={inputRef} type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} disabled={limitReached} placeholder="Novo produto..." className="flex-1 sm:w-52 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors disabled:opacity-50"/>
        <button type="button" onClick={handleAdd} disabled={limitReached || !inputValue.trim()} className="px-3 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100">
          <Plus size={16}/>
        </button>
      </div>
    </div>

    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
      <span>
        {total === 0 ? 'Nenhum item cadastrado' : `${total.toLocaleString('pt-BR')} ${total === 1 ? 'item cadastrado' : 'itens cadastrados'}`}
        {maxProducts > 0 && ` · limite do plano: ${maxProducts.toLocaleString('pt-BR')}`}
      </span>
      {loading && <Loader2 size={14} className="animate-spin text-indigo-500"/>}
    </div>

    {limitReached && (<p className="text-xs text-amber-600 dark:text-amber-400">
        Você atingiu o limite de itens do seu plano de IA. Remova itens ou faça upgrade para cadastrar mais.
    </p>)}

    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
      <input type="checkbox" checked={crossSellEnabled} onChange={(e) => onToggleCrossSell(e.target.checked)} className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/30"/>
      <Sparkles size={14} className="text-indigo-400"/>
        Sugerir itens complementares (cross-sell) durante a conversa
    </label>

    {products.length === 0 && !loading && (<div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-10 text-center">
      <ShoppingBag size={28} className="mx-auto text-slate-300 dark:text-slate-600"/>
      <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
        {search ? 'Nenhum item encontrado para essa busca' : 'Seu catálogo está vazio'}
      </p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
        {search ? 'Tente outro termo ou limpe a busca.' : 'Cadastre item por item ou importe uma planilha com nome, preço, observação e link.'}
      </p>
    </div>)}

    {products.length > 0 && (<>
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 text-left">
              <th className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-400">Nome</th>
              <th className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-400 w-32">Preço (R$)</th>
              <th className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-400">Observação</th>
              <th className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-400 w-44">Palavras-chave</th>
              <th className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-400 w-52">Link</th>
              <th className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-400 w-24 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {products.map((product) => (<ProductRow key={product.id} product={product} onUpdate={onUpdateProduct} onDelete={onDeleteProduct}/>))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden space-y-3">
        {products.map((product) => (<ProductCard key={product.id} product={product} onUpdate={onUpdateProduct} onDelete={onDeleteProduct}/>))}
      </div>
    </>)}

    {totalPages > 1 && (<div className="flex items-center justify-between pt-1">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1 || loading} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft size={14}/>
          Anterior
      </button>
      <span className="text-xs text-slate-500 dark:text-slate-400">
          Página {page} de {totalPages}
      </span>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || loading} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Próxima
        <ChevronRight size={14}/>
      </button>
    </div>)}
  </div>);
}
interface ProductEditorProps {
    product: Product;
    onUpdate: (id: string, data: ProductPayload) => void;
    onDelete: (id: string) => void;
}
function useProductDraft(product: Product) {
  const [price, setPrice] = useState(formatCents(product.priceCents));
  const [link, setLink] = useState(product.link);
  const [notes, setNotes] = useState(product.notes);
  const [keywords, setKeywords] = useState(product.keywords ?? '');
  useEffect(() => {
    setPrice(formatCents(product.priceCents));
    setLink(product.link);
    setNotes(product.notes);
    setKeywords(product.keywords ?? '');
  }, [product.id, product.priceCents, product.link, product.notes, product.keywords]);
  return { price, setPrice, link, setLink, notes, setNotes, keywords, setKeywords };
}
function ProductRow({ product, onUpdate, onDelete }: ProductEditorProps) {
  const { price, setPrice, link, setLink, notes, setNotes, keywords, setKeywords } = useProductDraft(product);
  const isActive = product.active !== false;
  const isFeatured = product.featured === true;
  const handlePriceBlur = () => {
    const cents = parseCents(price);
    if (cents !== product.priceCents)
      onUpdate(product.id, { priceCents: cents });
    setPrice(formatCents(cents));
  };
  const cellInput = 'w-full bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:ring-0';
  return (<tr className={`bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors align-top ${isActive ? '' : 'opacity-50'}`}>
    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-white">{product.name}</td>
    <td className="px-4 py-2.5">
      <div className="flex items-center gap-1">
        <span className="text-slate-400 dark:text-slate-500 text-xs">R$</span>
        <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} onBlur={handlePriceBlur} className={cellInput} placeholder="0,00"/>
      </div>
    </td>
    <td className="px-4 py-2.5">
      <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => { if (notes !== product.notes) onUpdate(product.id, { notes }); }} className={cellInput} placeholder="Opcional"/>
    </td>
    <td className="px-4 py-2.5">
      <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} onBlur={() => { if (keywords !== (product.keywords ?? '')) onUpdate(product.id, { keywords }); }} className={cellInput} placeholder="notebook, laptop..."/>
    </td>
    <td className="px-4 py-2.5">
      <input type="text" value={link} onChange={(e) => setLink(e.target.value)} onBlur={() => { if (link !== product.link) onUpdate(product.id, { link }); }} className={cellInput} placeholder="https://..."/>
    </td>
    <td className="px-4 py-2.5">
      <div className="flex items-center justify-center gap-1">
        <button type="button" title={isFeatured ? 'Remover destaque' : 'Marcar como destaque'} onClick={() => onUpdate(product.id, { featured: !isFeatured })} className={`p-1 rounded-lg transition-colors ${isFeatured ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-slate-300 dark:text-slate-600 hover:text-amber-500'}`}>
          <Star size={15} fill={isFeatured ? 'currentColor' : 'none'}/>
        </button>
        <button type="button" title={isActive ? 'Desativar (oculta da IA)' : 'Ativar'} onClick={() => onUpdate(product.id, { active: !isActive })} className={`p-1 rounded-lg transition-colors ${isActive ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-slate-400 hover:text-emerald-500'}`}>
          {isActive ? <Eye size={15}/> : <EyeOff size={15}/>}
        </button>
        <button type="button" onClick={() => onDelete(product.id)} className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
          <Trash2 size={15}/>
        </button>
      </div>
    </td>
  </tr>);
}
function ProductCard({ product, onUpdate, onDelete }: ProductEditorProps) {
  const { price, setPrice, link, setLink, notes, setNotes, keywords, setKeywords } = useProductDraft(product);
  const isActive = product.active !== false;
  const isFeatured = product.featured === true;
  const handlePriceBlur = () => {
    const cents = parseCents(price);
    if (cents !== product.priceCents)
      onUpdate(product.id, { priceCents: cents });
    setPrice(formatCents(cents));
  };
  const inputClass = 'w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400';
  return (<div className={`bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2 ${isActive ? '' : 'opacity-60'}`}>
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-slate-800 dark:text-white">{product.name}</p>
      <div className="flex items-center gap-1">
        <button type="button" title={isFeatured ? 'Remover destaque' : 'Destaque'} onClick={() => onUpdate(product.id, { featured: !isFeatured })} className={isFeatured ? 'text-amber-500 p-1' : 'text-slate-300 dark:text-slate-600 p-1'}>
          <Star size={15} fill={isFeatured ? 'currentColor' : 'none'}/>
        </button>
        <button type="button" title={isActive ? 'Desativar' : 'Ativar'} onClick={() => onUpdate(product.id, { active: !isActive })} className={isActive ? 'text-emerald-500 p-1' : 'text-slate-400 p-1'}>
          {isActive ? <Eye size={15}/> : <EyeOff size={15}/>}
        </button>
        <button type="button" onClick={() => onDelete(product.id)} className="text-slate-400 hover:text-red-500 p-1">
          <Trash2 size={15}/>
        </button>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 shrink-0">R$</span>
      <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} onBlur={handlePriceBlur} className={inputClass} placeholder="0,00"/>
    </div>
    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => { if (notes !== product.notes) onUpdate(product.id, { notes }); }} className={inputClass} placeholder="Observação (opcional)"/>
    <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} onBlur={() => { if (keywords !== (product.keywords ?? '')) onUpdate(product.id, { keywords }); }} className={inputClass} placeholder="Palavras-chave (ex.: notebook, laptop)"/>
    <input type="text" value={link} onChange={(e) => setLink(e.target.value)} onBlur={() => { if (link !== product.link) onUpdate(product.id, { link }); }} className={inputClass} placeholder="https://..."/>
  </div>);
}
