'use client';
import { Check, FileSpreadsheet, Loader2, MessageCircle, Search, Smartphone, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Input from '@/components/Input';
import { contactService } from '@/services/contact.service';
import type { Contact } from '@/types/Contact';
import { contactPhone, isUnlinkedContact } from '@/types/Contact';
import { getInitials } from '@/utils/displayName';

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 350;

type RawContact = Contact & {
    _id?: string;
};
const normalizeContact = (c: RawContact): Contact => ({ ...c, id: c.id ?? c._id ?? '' });

interface GroupContactPickerProps {
    /** Ids marcados nesta seleção. */
    selectedIds: string[];
    onSelectedChange: (ids: string[]) => void;
    /** Quem já está no grupo: aparece como "Já membro" e não entra na seleção. */
    memberIds?: ReadonlySet<string>;
    label?: string;
    /** Trava a busca e a lista — ex.: até o grupo ter nome. */
    disabled?: boolean;
    /** Explica por que está travado. */
    disabledHint?: string;
}

function formatCount(value: number): string {
  return value.toLocaleString('pt-BR');
}

/**
 * Lista de contatos que podem entrar num grupo de disparo: só quem tem telefone
 * (WhatsApp ou planilha). Quem só existe no Instagram não aparece — a campanha
 * sai pelo WhatsApp Oficial e não teria como alcançá-lo.
 *
 * A busca é feita na API (nome ou telefone) e a lista vem em páginas; o
 * "Selecionar todos" marca os contatos já carregados. Não há teto de contatos
 * por grupo — o único limite é o da base do plano.
 */
export default function GroupContactPicker({ selectedIds, onSelectedChange, memberIds, label = 'Selecionar contatos', disabled = false, disabledHint }: GroupContactPickerProps) {
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Só a resposta da última busca vale: uma mais antiga que chegue depois é descartada.
  const requestIdRef = useRef(0);

  const fetchContacts = useCallback(async (search: string, skip: number, append: boolean) => {
    const requestId = ++requestIdRef.current;
    if (append)
      setLoadingMore(true);
    else
      setLoading(true);
    setError('');
    try {
      const trimmed = search.trim();
      const result = await contactService.listContacts({
        ...(trimmed ? { search: trimmed } : {}),
        hasPhone: true,
        sortBy: 'name',
        skip,
        limit: PAGE_SIZE,
      });
      if (requestId !== requestIdRef.current)
        return;
      const page = result.data.map(normalizeContact);
      setContacts((prev) => (append ? [...prev, ...page] : page));
      setTotal(result.total);
    }
    catch {
      if (requestId !== requestIdRef.current)
        return;
      setError('Não foi possível carregar os contatos. Tente novamente.');
    }
    finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    if (disabled)
      return;
    void fetchContacts('', 0, false);
  }, [disabled, fetchContacts]);

  useEffect(() => () => {
    if (searchTimeoutRef.current)
      clearTimeout(searchTimeoutRef.current);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (searchTimeoutRef.current)
      clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => { void fetchContacts(value, 0, false); }, SEARCH_DEBOUNCE_MS);
  };

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectable = useMemo(() => contacts.filter((c) => !memberIds?.has(c.id)), [contacts, memberIds]);
  const allVisibleSelected = selectable.length > 0 && selectable.every((c) => selectedSet.has(c.id));
  const hasMore = contacts.length < total;

  const toggle = (contactId: string) => {
    if (selectedSet.has(contactId)) {
      onSelectedChange(selectedIds.filter((id) => id !== contactId));
      return;
    }
    onSelectedChange([...selectedIds, contactId]);
  };

  const selectAllVisible = () => {
    const missing = selectable.filter((c) => !selectedSet.has(c.id)).map((c) => c.id);
    if (missing.length > 0)
      onSelectedChange([...selectedIds, ...missing]);
  };

  const clearSelection = () => onSelectedChange([]);

  const emptyMessage = query.trim()
    ? `Nenhum contato com telefone encontrado para “${query.trim()}”.`
    : 'Nenhum contato com telefone na sua base. Importe uma planilha ou sincronize o WhatsApp.';

  return (<div className="space-y-2">
    <div className={disabled ? 'opacity-60' : ''}>
      <Input
        label={label}
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder="Buscar por nome ou telefone..."
        leftIcon={<Search size={16}/>}
        disabled={disabled}
        hint={disabled ? disabledHint : undefined}
        rightElement={query && !disabled ? (<button type="button" onClick={() => handleQueryChange('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" aria-label="Limpar busca">
          <X size={14}/>
        </button>) : undefined}
      />
    </div>

    {!disabled && (<>
      <div className="flex items-center justify-between gap-2 min-h-5 text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          {selectedIds.length > 0
            ? `${formatCount(selectedIds.length)} selecionado${selectedIds.length > 1 ? 's' : ''}`
            : total > 0
              ? `${formatCount(total)} contato${total !== 1 ? 's' : ''} com telefone`
              : ''}
        </span>
        {selectable.length > 0 && (<div className="flex items-center gap-3">
          <button type="button" onClick={selectAllVisible} disabled={allVisibleSelected} className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-40 transition-colors">
            Selecionar todos ({selectable.length})
          </button>
          <button type="button" onClick={clearSelection} disabled={selectedIds.length === 0} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-40 transition-colors">
            Limpar
          </button>
        </div>)}
      </div>

      <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
        {loading ? (<div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400 dark:text-slate-500">
          <Loader2 size={14} className="animate-spin"/>
          Buscando contatos...
        </div>) : error ? (<div className="py-6 text-center space-y-2">
          <p className="text-xs text-red-500">{error}</p>
          <button type="button" onClick={() => { void fetchContacts(query, 0, false); }} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Tentar novamente
          </button>
        </div>) : contacts.length === 0 ? (<p className="py-8 px-4 text-center text-xs text-slate-400 dark:text-slate-500">
          {emptyMessage}
        </p>) : (<>
          {contacts.map((contact) => {
            const alreadyMember = memberIds?.has(contact.id) ?? false;
            const checked = alreadyMember || selectedSet.has(contact.id);
            const name = contact.displayName || 'Sem nome';
            const types = new Set(contact.identities?.map((i) => i.type) ?? []);
            const imported = isUnlinkedContact(contact);
            return (<label key={contact.id} className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${alreadyMember
              ? 'opacity-60 cursor-not-allowed'
              : checked
                ? 'bg-indigo-50 dark:bg-indigo-950/40 cursor-pointer'
                : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer'}`}>
              <input type="checkbox" className="sr-only" checked={checked} disabled={alreadyMember} onChange={() => toggle(contact.id)}/>
              <span aria-hidden="true" className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${checked
                ? 'border-indigo-500 bg-indigo-500'
                : 'border-slate-300 dark:border-slate-600'}`}>
                {checked && <Check size={12} className="text-white" strokeWidth={3}/>}
              </span>
              <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">
                {getInitials(name) || 'U'}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-slate-800 dark:text-white truncate">{name}</span>
                <span className="block text-xs text-slate-400 dark:text-slate-500 truncate">{contactPhone(contact) ?? 'Sem telefone'}</span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                {types.has('WHATSAPP') && <MessageCircle size={12} className="text-emerald-500" aria-label="WhatsApp"/>}
                {types.has('INSTAGRAM') && <Smartphone size={12} className="text-fuchsia-500" aria-label="Instagram"/>}
                {imported && (<span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <FileSpreadsheet size={11}/>
                  Planilha
                </span>)}
                {alreadyMember && <span className="text-xs text-slate-400 dark:text-slate-500">Já membro</span>}
              </span>
            </label>);
          })}
          {hasMore && (<button type="button" onClick={() => { void fetchContacts(query, contacts.length, true); }} disabled={loadingMore} className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 disabled:opacity-50 transition-colors">
            {loadingMore && <Loader2 size={12} className="animate-spin"/>}
            Carregar mais ({formatCount(total - contacts.length)} restantes)
          </button>)}
        </>)}
      </div>
    </>)}
  </div>);
}
