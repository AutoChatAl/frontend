'use client';
import { CornerDownLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { useSidebar } from '@/contexts/SidebarContext';
import { authService } from '@/services/auth.service';
import {
  filterDestinations,
  NAV_DESTINATIONS,
  type DestinationSection,
  type NavDestination,
} from '@/utils/navigationDestinations';

/** Teto de resultados por busca — a lista precisa caber sem rolagem longa. */
const MAX_RESULTS = 7;
/** Atalhos exibidos com o campo vazio, na ordem em que aparecem. */
const SUGGESTED_IDS = ['ia-assistant', 'campaigns-create', 'channels-whatsapp', 'contacts', 'settings-billing'];

interface ResultRow {
    destination: NavDestination;
    /** Posição na lista achatada — é o que a navegação por teclado percorre. */
    index: number;
}

interface ResultGroup {
    section: DestinationSection;
    rows: ResultRow[];
}

function groupBySection(destinations: NavDestination[]): ResultGroup[] {
  const groups: ResultGroup[] = [];
  destinations.forEach((destination, index) => {
    const row: ResultRow = { destination, index };
    const current = groups.find((group) => group.section === destination.section);
    if (current) {
      current.rows.push(row);
    }
    else {
      groups.push({ section: destination.section, rows: [row] });
    }
  });
  return groups;
}

/**
 * Busca do header: filtra destinos do sistema (páginas e ações) e navega até
 * eles. Respeita as permissões do usuário — só aparece o que ele já vê na
 * sidebar. Atalho: Ctrl/⌘ + K.
 */
export default function HeaderSearch() {
  const router = useRouter();
  const { menuItems, setActiveTab } = useSidebar();
  const [role, setRole] = useState('owner');
  const [isMac, setIsMac] = useState(false);
  const [compact, setCompact] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = authService.getUser();
    if (user?.role) {
      setRole(user.role);
    }
    setIsMac(/mac/i.test(navigator.userAgent));
  }, []);

  // Placeholder curto no mobile, onde o campo divide a linha com o menu e os selos.
  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const available = useMemo(() => {
    const allowedIds = new Set(menuItems.filter((item) => !item.locked).map((item) => item.id));
    return NAV_DESTINATIONS.filter((destination) => {
      if (!allowedIds.has(destination.menuId)) {
        return false;
      }
      return !(destination.ownerOnly && role === 'collaborator');
    });
  }, [menuItems, role]);

  const trimmedQuery = query.trim();

  const results = useMemo(() => {
    if (!trimmedQuery) {
      const suggested = SUGGESTED_IDS
        .map((id) => available.find((destination) => destination.id === id))
        .filter((destination): destination is NavDestination => !!destination);
      return suggested.length > 0 ? suggested : available.slice(0, MAX_RESULTS);
    }
    return filterDestinations(available, trimmedQuery).slice(0, MAX_RESULTS);
  }, [available, trimmedQuery]);

  useEffect(() => {
    setHighlight(0);
  }, [trimmedQuery]);

  // Fecha ao clicar fora do campo e da lista.
  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  // Atalho global Ctrl/⌘ + K.
  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  // Mantém o item destacado visível durante a navegação por teclado.
  useEffect(() => {
    if (!open) {
      return;
    }
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  const goTo = (destination: NavDestination) => {
    setActiveTab(destination.menuId);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
    router.push(destination.href);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        setOpen(true);
      }
      return;
    }
    if (results.length === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((prev) => (prev + 1) % results.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((prev) => (prev - 1 + results.length) % results.length);
      return;
    }
    if (event.key === 'Enter') {
      const target = results[highlight];
      if (target) {
        event.preventDefault();
        goTo(target);
      }
    }
  };

  const groups = groupBySection(results);

  return (<div ref={containerRef} className="relative w-full max-w-md">
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"/>
      <input ref={inputRef} type="text" value={query} onChange={(event) => {
        setQuery(event.target.value);
        setOpen(true);
      }} onFocus={() => setOpen(true)} onKeyDown={handleKeyDown} placeholder={compact ? 'Buscar...' : 'Buscar no sistema...'} role="combobox" aria-expanded={open} aria-controls="header-search-results" aria-autocomplete="list" aria-label="Buscar páginas e ações do sistema" className="w-full h-9 pl-9 pr-3 lg:pr-16 rounded-lg border text-[13px] bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"/>
      <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden lg:block text-[10px] font-medium text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5 pointer-events-none select-none">
        {isMac ? '⌘' : 'Ctrl'} K
      </kbd>
    </div>

    {/* No mobile o painel ocupa a largura da tela — ancorado ao campo ficaria estreito demais. */}
    {open && (<div className="fixed left-4 right-4 top-[3.75rem] sm:absolute sm:left-0 sm:right-0 sm:top-[calc(100%+0.5rem)] z-50 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm dark:shadow-none overflow-hidden animate-dropdown">
      <div ref={listRef} id="header-search-results" role="listbox" aria-label="Resultados da busca" className="max-h-72 overflow-y-auto p-1.5">
        {results.length === 0 ? (<div className="px-3 py-6 text-center">
          <p className="text-[13px] text-slate-600 dark:text-slate-400">
            Nenhum resultado para &ldquo;{trimmedQuery}&rdquo;.
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
            Tente &ldquo;campanha&rdquo;, &ldquo;assistente&rdquo; ou &ldquo;plano&rdquo;.
          </p>
        </div>) : (<>
          {!trimmedQuery && (<p className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Sugestões
          </p>)}
          {groups.map((group) => (<div key={group.section} className="mb-1 last:mb-0">
            {!!trimmedQuery && (<p className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group.section}
            </p>)}
            {group.rows.map(({ destination, index }) => {
              const active = index === highlight;
              const Icon = destination.icon;
              return (<button key={destination.id} type="button" role="option" aria-selected={active} data-active={active} onMouseEnter={() => setHighlight(index)} onClick={() => goTo(destination)} className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors cursor-pointer ${active ? 'bg-slate-100 dark:bg-slate-700/50' : ''}`}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors ${active
                  ? 'border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500'}`}>
                  <Icon size={14}/>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-slate-900 dark:text-white">{destination.label}</span>
                  <span className="block truncate text-[11px] text-slate-400 dark:text-slate-500">{destination.description}</span>
                </span>
                {active && (<CornerDownLeft size={13} className="shrink-0 text-slate-300 dark:text-slate-600"/>)}
              </button>);
            })}
          </div>))}
        </>)}
      </div>

      {results.length > 0 && (<div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 px-3 py-1.5 text-[10px] text-slate-400 dark:text-slate-500">
        <span>↑ ↓ navegar · Enter abrir</span>
        <span>Esc fechar</span>
      </div>)}
    </div>)}
  </div>);
}
