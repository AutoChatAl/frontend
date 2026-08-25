'use client';
import { ChevronLeft, ChevronRight, Eye, EyeOff, ImagePlus, Loader2, Plus, Search, ShoppingBag, Star, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

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
    onUploadImage: (id: string, file: File) => void;
    onRemoveImage: (id: string) => void;
}
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
/**
 * O backend devolve caminho relativo para imagem que subimos e URL absoluta para a que veio da
 * planilha. O caminho é resolvido contra a API — não contra o front — porque é a API que serve
 * o arquivo.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
function resolveImageUrl(url?: string): string {
  const value = (url ?? '').trim();
  if (!value)
    return '';
  return /^https?:\/\//i.test(value) ? value : `${API_BASE}${value}`;
}
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parseCents(value: string): number {
  const parsed = parseFloat(value.replace(/\./g, '').replace(',', '.'));
  return isNaN(parsed) ? 0 : Math.round(parsed * 100);
}
const FIELD = 'w-full rounded-lg border border-slate-200 bg-white py-2.5 text-[13px] sm:py-2 text-slate-900 transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500';

/** Busca, cadastro rápido e a lista editável. O cabeçalho e os ajustes de comportamento ficam na seção. */
export default function AIProductsInput({ products, total, maxProducts, loading, search, page, pageSize, onSearchChange, onPageChange, onAddProduct, onUpdateProduct, onDeleteProduct, onUploadImage, onRemoveImage }: AIProductsInputProps) {
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
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"/>
        <input type="text" value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Buscar por nome ou observação..." className={`${FIELD} pr-3 pl-9`}/>
      </div>
      <div className="flex gap-2">
        <input ref={inputRef} type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} disabled={limitReached} placeholder="Novo item..." className={`${FIELD} flex-1 px-3 disabled:opacity-50 sm:w-48`}/>
        <button type="button" onClick={handleAdd} disabled={limitReached || !inputValue.trim()} title="Adicionar item" className="flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-3 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
          <Plus size={16}/>
        </button>
      </div>
    </div>

    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
      <span className="tabular-nums">
        {total === 0 ? 'Nenhum item cadastrado' : `${total.toLocaleString('pt-BR')} ${total === 1 ? 'item cadastrado' : 'itens cadastrados'}`}
        {maxProducts > 0 && ` · limite do plano: ${maxProducts.toLocaleString('pt-BR')}`}
      </span>
      {loading && <Loader2 size={14} className="shrink-0 animate-spin text-indigo-500"/>}
    </div>

    {limitReached && (<p className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1.5 text-xs leading-relaxed text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
        Você atingiu o limite de itens do seu plano de IA. Remova itens ou faça upgrade para cadastrar mais.
    </p>)}

    {products.length === 0 && !loading && (<div className="rounded-lg border border-dashed border-slate-200 py-10 text-center dark:border-slate-700">
      <ShoppingBag size={24} className="mx-auto text-slate-300 dark:text-slate-600"/>
      <p className="mt-2 text-[13px] font-semibold text-slate-700 dark:text-slate-300">
        {search ? 'Nenhum item encontrado para essa busca' : 'Seu catálogo está vazio'}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
        {search ? 'Tente outro termo ou limpe a busca.' : 'Cadastre item por item no campo acima ou importe uma planilha com nome, preço, observação e link.'}
      </p>
    </div>)}

    {products.length > 0 && (<>
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 lg:block dark:border-slate-700">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-slate-50 text-left dark:bg-slate-800/80">
              <th className="w-16 px-3 py-2 font-medium text-slate-500 dark:text-slate-400">Imagem</th>
              <th className="px-3 py-2 font-medium text-slate-500 dark:text-slate-400">Nome</th>
              <th className="w-28 px-3 py-2 font-medium text-slate-500 dark:text-slate-400">Preço</th>
              <th className="px-3 py-2 font-medium text-slate-500 dark:text-slate-400">Observação</th>
              <th className="w-40 px-3 py-2 font-medium text-slate-500 dark:text-slate-400">Palavras-chave</th>
              <th className="w-48 px-3 py-2 font-medium text-slate-500 dark:text-slate-400">Link</th>
              <th className="w-24 px-3 py-2 text-center font-medium text-slate-500 dark:text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {products.map((product) => (<ProductRow key={product.id} product={product} onUpdate={onUpdateProduct} onDelete={onDeleteProduct} onUploadImage={onUploadImage} onRemoveImage={onRemoveImage}/>))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 lg:hidden">
        {products.map((product) => (<ProductCard key={product.id} product={product} onUpdate={onUpdateProduct} onDelete={onDeleteProduct} onUploadImage={onUploadImage} onRemoveImage={onRemoveImage}/>))}
      </div>
    </>)}

    {totalPages > 1 && (<div className="flex items-center justify-between gap-2">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1 || loading} className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700/50">
        <ChevronLeft size={14}/>
          Anterior
      </button>
      <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
          Página {page} de {totalPages}
      </span>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || loading} className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700/50">
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
    onUploadImage: (id: string, file: File) => void;
    onRemoveImage: (id: string) => void;
}
function ProductImageCell({ product, onUploadImage, onRemoveImage, size }: {
    product: Product;
    onUploadImage: (id: string, file: File) => void;
    onRemoveImage: (id: string) => void;
    size: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sizeError, setSizeError] = useState(false);
  const preview = resolveImageUrl(product.imagePreviewUrl);
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Zera o input para que escolher o MESMO arquivo de novo continue disparando onChange.
    event.target.value = '';
    if (!file)
      return;
    if (file.size > MAX_IMAGE_BYTES) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    onUploadImage(product.id, file);
  };
  return (<div className="flex flex-col items-start gap-1">
    <div className="relative">
      <button type="button" onClick={() => inputRef.current?.click()} title={preview ? 'Trocar imagem' : 'Adicionar imagem'} style={{ width: size, height: size }} className="flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-indigo-400 dark:border-slate-600 dark:bg-slate-900">
        {preview
          ? <img src={preview} alt={product.name} className="h-full w-full object-cover"/>
          : <ImagePlus size={16} className="text-slate-400 dark:text-slate-500"/>}
      </button>
      {preview && (<button type="button" onClick={() => onRemoveImage(product.id)} title="Remover imagem" className="absolute -top-1.5 -right-1.5 rounded-full border border-slate-200 bg-white p-0.5 text-slate-400 shadow-sm hover:text-red-500 dark:border-slate-600 dark:bg-slate-800">
        <X size={11}/>
      </button>)}
      <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} onChange={handleFile} className="hidden"/>
    </div>
    {sizeError && <span className="text-[10px] text-red-500">Máx. 2 MB</span>}
  </div>);
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
function ProductRow({ product, onUpdate, onDelete, onUploadImage, onRemoveImage }: ProductEditorProps) {
  const { price, setPrice, link, setLink, notes, setNotes, keywords, setKeywords } = useProductDraft(product);
  const isActive = product.active !== false;
  const isFeatured = product.featured === true;
  const handlePriceBlur = () => {
    const cents = parseCents(price);
    if (cents !== product.priceCents)
      onUpdate(product.id, { priceCents: cents });
    setPrice(formatCents(cents));
  };
  const cellInput = 'w-full border-none bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-300 focus:ring-0 dark:text-slate-200 dark:placeholder:text-slate-600';
  return (<tr className={`bg-white align-middle transition-colors hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 ${isActive ? '' : 'opacity-50'}`}>
    <td className="px-3 py-2">
      <ProductImageCell product={product} onUploadImage={onUploadImage} onRemoveImage={onRemoveImage} size={40}/>
    </td>
    <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{product.name}</td>
    <td className="px-3 py-2">
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400 dark:text-slate-500">R$</span>
        <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} onBlur={handlePriceBlur} className={`${cellInput} tabular-nums`} placeholder="0,00"/>
      </div>
    </td>
    <td className="px-3 py-2">
      <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => { if (notes !== product.notes) onUpdate(product.id, { notes }); }} className={cellInput} placeholder="Opcional"/>
    </td>
    <td className="px-3 py-2">
      <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} onBlur={() => { if (keywords !== (product.keywords ?? '')) onUpdate(product.id, { keywords }); }} className={cellInput} placeholder="notebook, laptop..."/>
    </td>
    <td className="px-3 py-2">
      <input type="text" value={link} onChange={(e) => setLink(e.target.value)} onBlur={() => { if (link !== product.link) onUpdate(product.id, { link }); }} className={cellInput} placeholder="https://..."/>
    </td>
    <td className="px-3 py-2">
      <div className="flex items-center justify-center gap-0.5">
        <button type="button" title={isFeatured ? 'Remover destaque' : 'Marcar como destaque'} onClick={() => onUpdate(product.id, { featured: !isFeatured })} className={`rounded-lg p-1.5 transition-colors ${isFeatured ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10' : 'text-slate-300 hover:text-amber-500 dark:text-slate-600'}`}>
          <Star size={15} fill={isFeatured ? 'currentColor' : 'none'}/>
        </button>
        <button type="button" title={isActive ? 'Desativar (oculta da IA)' : 'Ativar'} onClick={() => onUpdate(product.id, { active: !isActive })} className={`rounded-lg p-1.5 transition-colors ${isActive ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'text-slate-400 hover:text-emerald-500'}`}>
          {isActive ? <Eye size={15}/> : <EyeOff size={15}/>}
        </button>
        <button type="button" title="Excluir item" onClick={() => onDelete(product.id)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400">
          <Trash2 size={15}/>
        </button>
      </div>
    </td>
  </tr>);
}
/** Campo rotulado do card mobile: sem o rótulo, depois de digitar não dá para saber o que é o quê. */
function CardField({ label, value, onChange, onCommit, placeholder, inputMode }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onCommit: () => void;
    placeholder: string;
    inputMode?: 'url' | 'text';
}) {
  return (<label className="block">
    <span className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
    <input type="text" {...(inputMode ? { inputMode } : {})} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onCommit} placeholder={placeholder} className={`${FIELD} px-3`}/>
  </label>);
}
function ProductCard({ product, onUpdate, onDelete, onUploadImage, onRemoveImage }: ProductEditorProps) {
  const { price, setPrice, link, setLink, notes, setNotes, keywords, setKeywords } = useProductDraft(product);
  const isActive = product.active !== false;
  const isFeatured = product.featured === true;
  const handlePriceBlur = () => {
    const cents = parseCents(price);
    if (cents !== product.priceCents)
      onUpdate(product.id, { priceCents: cents });
    setPrice(formatCents(cents));
  };
  // Chip de ação: no dedo, ícone de 15px sem rótulo era alvo pequeno e ambíguo.
  const chip = 'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-semibold transition-colors';
  const chipOff = 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400';
  return (<div className={`rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50 ${isActive ? '' : 'opacity-60'}`}>
    {/* Nome encostado no topo da imagem e com a largura toda: as ações desceram para o
        rodapé justamente para não espremer o nome em três linhas. */}
    <div className="flex items-start gap-3">
      <ProductImageCell product={product} onUploadImage={onUploadImage} onRemoveImage={onRemoveImage} size={44}/>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug font-semibold break-words text-slate-900 dark:text-white">{product.name}</p>
        <div className="mt-1 flex items-center gap-1">
          <span className="text-xs text-slate-400 dark:text-slate-500">R$</span>
          <input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} onBlur={handlePriceBlur} placeholder="0,00" aria-label={`Preço de ${product.name}`} className="w-24 rounded-md border border-transparent bg-slate-100 px-2 py-1 text-[13px] tabular-nums text-slate-700 transition-colors focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:bg-slate-900/60 dark:text-slate-200 dark:focus:bg-slate-900"/>
        </div>
      </div>
    </div>

    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-700/60">
      <CardField label="Observação" value={notes} onChange={setNotes} onCommit={() => { if (notes !== product.notes) onUpdate(product.id, { notes }); }} placeholder="Opcional"/>
      <CardField label="Palavras-chave" value={keywords} onChange={setKeywords} onCommit={() => { if (keywords !== (product.keywords ?? '')) onUpdate(product.id, { keywords }); }} placeholder="notebook, laptop"/>
      <CardField label="Link" value={link} onChange={setLink} onCommit={() => { if (link !== product.link) onUpdate(product.id, { link }); }} placeholder="https://..." inputMode="url"/>

      <div className="flex items-center gap-1.5 pt-1">
        <button type="button" aria-pressed={isFeatured} onClick={() => onUpdate(product.id, { featured: !isFeatured })} className={`${chip} ${isFeatured ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300' : chipOff}`}>
          <Star size={14} fill={isFeatured ? 'currentColor' : 'none'}/>
            Destaque
        </button>
        <button type="button" aria-pressed={isActive} onClick={() => onUpdate(product.id, { active: !isActive })} className={`${chip} ${isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300' : chipOff}`}>
          {isActive ? <Eye size={14}/> : <EyeOff size={14}/>}
          {isActive ? 'Visível' : 'Oculto'}
        </button>
        <button type="button" onClick={() => onDelete(product.id)} className={`${chip} border-red-200 text-red-600 dark:border-red-500/20 dark:text-red-400`}>
          <Trash2 size={14}/>
            Excluir
        </button>
      </div>
    </div>
  </div>);
}
