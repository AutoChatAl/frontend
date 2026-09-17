'use client';
import { AlertCircle, Edit2, Loader2, MessageCircle, MoreVertical, RefreshCw, Smartphone, Trash2, Upload, Users } from 'lucide-react';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import IconButton from '@/components/IconButton';
import MetricCard, { type MetricTrend } from '@/components/MetricCard';
import { SkeletonPage, SkeletonStats, SkeletonTable } from '@/components/Skeleton';
import Table from '@/components/Table';
import { ToastContainer, useToast } from '@/components/Toast';
import { authService } from '@/services/auth.service';
import { channelsService } from '@/services/channels.service';
import { contactService, type ContactsStats } from '@/services/contact.service';
import { inboxService } from '@/services/inbox.service';
import type { WhatsAppInstance } from '@/types/Channel';
import type { Contact } from '@/types/Contact';
import { getInitials, normalizeDisplayName } from '@/utils/displayName';
import { subscribeToEvents } from '@/utils/SharedEventSource';

import { columns } from './components/ContactColumns';
import ContactsGrowthChart, { type ContactsGrowthPoint } from './components/ContactsGrowthChart';
import EditContactModal from './components/EditContactModal';
import ImportContactsModal from './components/ImportContactsModal';
import SyncContactsModal from './components/SyncContactsModal';

const PAGE_SIZE = 50;
/** Preenche os últimos `n` dias (chave YYYY-MM-DD local) com os dados existentes. */
function fillLastDays(rows: ContactsStats['daily'], n: number): ContactsGrowthPoint[] {
  const byDate = new Map(rows.map((r) => [r.date, r.count]));
  const filled: ContactsGrowthPoint[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const key = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA');
    filled.push({ date: key, count: byDate.get(key) ?? 0 });
  }
  return filled;
}
function formatRelativeDate(iso?: string | null): string {
  if (!iso)
    return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0)
    return 'Hoje, ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1)
    return 'Ontem';
  if (diffDays < 7)
    return `${diffDays} dias atrás`;
  return d.toLocaleDateString('pt-BR');
}
function ActionsDropdown({ contact, onEdit, onDelete, onMarkAsRead }: {
    contact: Contact;
    onEdit: (contact: Contact) => void;
    onDelete: (contact: Contact) => void;
    onMarkAsRead: (contact: Contact) => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const updatePosition = useCallback(() => {
    if (!buttonRef.current)
      return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.right - 176,
    });
  }, []);
  useEffect(() => {
    if (!open)
      return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current && !buttonRef.current.contains(target) &&
                menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open, updatePosition]);
  return (<div ref={buttonRef}>
    <IconButton icon={<MoreVertical size={16}/>} onClick={() => {
      if (!open)
        updatePosition();
      setOpen((prev) => !prev);
    }}/>
    {open && createPortal(<div ref={menuRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }} className="w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 animate-in fade-in zoom-in-95 duration-150">
      {contact.awaitingHuman && (<button type="button" onClick={() => {
        setOpen(false);
        onMarkAsRead(contact);
      }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
        <AlertCircle size={15}/>
              Marcar como lido
      </button>)}
      <button type="button" onClick={() => {
        setOpen(false);
        onEdit(contact);
      }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        <Edit2 size={15} className="text-slate-400"/>
            Editar
      </button>
      <button type="button" onClick={() => {
        setOpen(false);
        onDelete(contact);
      }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
        <Trash2 size={15}/>
            Excluir
      </button>
    </div>, document.body)}
  </div>);
}
function DeleteConfirmModal({ isOpen, contactName, loading, onConfirm, onCancel }: {
    isOpen: boolean;
    contactName: string;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
  if (!isOpen)
    return null;
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onCancel}/>
    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Trash2 size={24} className="text-red-500"/>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Excluir contato</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
              Tem certeza que deseja excluir o contato <span className="font-medium text-slate-700 dark:text-slate-300">&quot;{contactName}&quot;</span>? A conversa, as mensagens, os arquivos e o histórico dele também serão apagados. Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <button type="button" onClick={onCancel} disabled={loading} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50">
              Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  </div>);
}
export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ContactsStats | null>(null);
  const [whatsappChannels, setWhatsappChannels] = useState<WhatsAppInstance[]>([]);
  const [, setLoading] = useState(true);
  /**
   * Carga inicial da página inteira, e não só da lista.
   *
   * O `loading` acima pertence à busca de contatos e é desligado no `finally`
   * dela — as estatísticas e os canais ainda estariam a caminho, e o esqueleto
   * sairia com os cards do topo vazios. Este só desliga quando tudo chegou.
   */
  const [booting, setBooting] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const hasLoaded = useRef(false);
  const fetchContacts = useCallback(async (search: string, skip: number, append: boolean) => {
    try {
      if (append) {
        setLoadingMore(true);
      }
      else if (!hasLoaded.current) {
        setLoading(true);
      }
      setError(null);
      const trimmed = search.trim();
      const result = await contactService.listContacts({
        ...(trimmed ? { search: trimmed } : {}),
        skip,
        limit: PAGE_SIZE,
      });
      setContacts((prev) => (append ? [...prev, ...result.data] : result.data));
      setTotal(result.total);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contatos');
    }
    finally {
      hasLoaded.current = true;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);
  const fetchStats = useCallback(async () => {
    try {
      setStats(await contactService.getStats());
    }
    catch {
      // Os cards são complementares — a lista continua funcionando sem eles.
    }
  }, []);
  useEffect(() => {
    Promise.all([
      fetchContacts('', 0, false),
      fetchStats(),
      channelsService.getWhatsAppInstances().catch(() => [] as WhatsAppInstance[]),
    ]).then(([, , waChannels]) => {
      setWhatsappChannels(waChannels);
    }).finally(() => setBooting(false));
  }, []);
  /**
   * Atualização por evento, não por relógio.
   *
   * Antes eram duas requisições a cada 15 s, para sempre, com a aba aberta ou não —
   * e o que muda esta tela (contato novo, alguém entrando na fila de atendimento)
   * acontece quando chega mensagem, que é justamente o que o stream anuncia. A
   * rajada é agrupada porque uma única mensagem gera mais de um evento.
   */
  useEffect(() => {
    let coalesce: ReturnType<typeof setTimeout> | null = null;

    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      fetchContacts(query, 0, false);
      fetchStats();
    };
    const scheduleRefresh = () => {
      if (coalesce) return;
      coalesce = setTimeout(() => { coalesce = null; refresh(); }, 500);
    };

    const unsubscribe = authService.getToken()
      ? subscribeToEvents(inboxService.getInboxEventsUrl(), {
        'conversation.updated': scheduleRefresh,
        'conversation.deleted': scheduleRefresh,
        // Pedido de atendimento humano: a linha do contato muda de estado na hora.
        'queue.updated': scheduleRefresh,
      })
      : () => {};

    window.addEventListener('focus', refresh);
    return () => {
      if (coalesce) clearTimeout(coalesce);
      unsubscribe();
      window.removeEventListener('focus', refresh);
    };
  }, [fetchContacts, fetchStats, query]);

  const growth30 = useMemo(() => (stats ? fillLastDays(stats.daily, 30) : []), [stats]);
  const newLast30 = useMemo(() => growth30.reduce((sum, d) => sum + d.count, 0), [growth30]);
  // Variação de novos contatos: últimos 7 dias vs os 7 anteriores.
  const contactsTrend = useMemo((): MetricTrend | undefined => {
    if (growth30.length < 14)
      return undefined;
    const last7 = growth30.slice(-7).reduce((sum, d) => sum + d.count, 0);
    const prev7 = growth30.slice(-14, -7).reduce((sum, d) => sum + d.count, 0);
    if (prev7 <= 0)
      return undefined;
    const pct = Math.round(((last7 - prev7) / prev7) * 100);
    if (pct === 0)
      return { label: '0% vs sem. passada', tone: 'neutral' };
    return pct > 0
      ? { label: `+${pct}% vs sem. passada`, tone: 'positive' }
      : { label: `${pct}% vs sem. passada`, tone: 'negative' };
  }, [growth30]);
  const pctOfBase = (value: number): string => {
    return stats && stats.total > 0 ? `${Math.round((value / stats.total) * 100)}% da base` : '—';
  };
  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);
    if (searchTimeout.current)
      clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchContacts(value, 0, false);
    }, 350);
  }, [fetchContacts]);
  const handleLoadMore = useCallback(() => {
    if (loadingMore || contacts.length >= total)
      return;
    fetchContacts(query, contacts.length, true);
  }, [loadingMore, contacts.length, total, query, fetchContacts]);
  const handleDeleteContact = async () => {
    if (!deletingContact)
      return;
    try {
      setDeletingLoading(true);
      await contactService.deleteContact(deletingContact.id);
      addToast('success', `Contato "${deletingContact.displayName || 'Sem nome'}" excluído com sucesso.`);
      setDeletingContact(null);
      await fetchContacts(query, 0, false);
      fetchStats();
    }
    catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir contato';
      addToast('error', msg);
    }
    finally {
      setDeletingLoading(false);
    }
  };
  const handleMarkAsRead = async (contact: Contact) => {
    try {
      await contactService.markHumanRead(contact.id);
      window.dispatchEvent(new Event('human-queue-decrement'));
      addToast('success', `Contato "${contact.displayName || 'Sem nome'}" marcado como lido.`);
      await fetchContacts(query, 0, false);
      fetchStats();
    }
    catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao marcar contato como lido';
      addToast('error', msg);
    }
  };
  const hasMore = contacts.length < total;
  // `booting`, e não `loading`: a lista pode ter chegado antes das estatísticas.
  if (booting) {
    return <SkeletonPage><SkeletonStats count={4}/><SkeletonTable rows={8} columns={5}/></SkeletonPage>;
  }
  if (error && contacts.length === 0) {
    return (<div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle size={20}/>
          <span className="text-sm font-medium">{error}</span>
        </div>
        <Button onClick={() => fetchContacts('', 0, false)} size="sm">Tentar novamente</Button>
      </div>
    </div>);
  }
  return (<div className="w-full max-w-full space-y-3">
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Contatos</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie sua base de contatos e leads
        </p>
      </div>

      <div className="flex flex-wrap gap-2" data-tour="contacts-sync">
        <Button variant="secondary" icon={<Upload size={15}/>} onClick={() => setIsImportModalOpen(true)}>
          Importar Planilha
        </Button>
        <Button variant="secondary" icon={<RefreshCw size={15}/>} onClick={() => setIsSyncModalOpen(true)}>
          Sincronizar Contatos
        </Button>
      </div>
    </header>

    {stats && stats.total > 0 && (<>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <MetricCard title="Total de Contatos" value={stats.total.toLocaleString('pt-BR')} {...(contactsTrend ? { trend: contactsTrend } : {})} hint={stats.unlinked > 0 ? `${stats.unlinked.toLocaleString('pt-BR')} sem canal vinculado` : `+${newLast30.toLocaleString('pt-BR')} nos últimos 30 dias`}/>
        <MetricCard title="WhatsApp" value={stats.whatsapp.toLocaleString('pt-BR')} hint={pctOfBase(stats.whatsapp)}/>
        <MetricCard title="Instagram" value={stats.instagram.toLocaleString('pt-BR')} hint={pctOfBase(stats.instagram)}/>
        <MetricCard title="Aguardando Atendimento" value={stats.awaitingHuman.toLocaleString('pt-BR')} hint="na fila de atendimento humano"/>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Evolução de contatos</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Novos contatos por dia nos últimos 30 dias
            </p>
          </div>
          <span className="shrink-0 text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">
              +{newLast30.toLocaleString('pt-BR')}
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500"> no mês</span>
          </span>
        </div>
        <ContactsGrowthChart data={growth30} height={170}/>
      </Card>
    </>)}

    {contacts.length === 0 && !query ? (<EmptyState icon={<Users size={22}/>} title="Nenhum contato ainda" description="Importe uma planilha, sincronize via WhatsApp ou Instagram, ou aguarde interações chegarem." action={{
      label: 'Importar Planilha',
      icon: <Upload size={15}/>,
      onClick: () => setIsImportModalOpen(true),
    }}/>) : (<Table columns={columns} data={contacts} actions={{
      searchBar: {
        placeholder: 'Buscar por nome, telefone ou @usuário...',
        value: query,
        onChange: handleSearchChange,
      },
    }} renderActions={(row: Contact) => (<ActionsDropdown contact={row} onEdit={(c) => setEditingContact(c)} onDelete={(c) => setDeletingContact(c)} onMarkAsRead={handleMarkAsRead}/>)} getRowClassName={(row: Contact) => row.awaitingHuman
      ? 'bg-red-50/60 dark:bg-red-900/10 border-l-2 border-red-400'
      : ''} onLoadMore={handleLoadMore} hasMore={hasMore} loadingMore={loadingMore} renderMobileCard={(row: Contact) => {
      const name = row.displayName || 'Sem nome';
      const identities = row.identities ?? [];
      const hasWA = identities.some((i) => i.type === 'WHATSAPP');
      const hasIG = identities.some((i) => i.type === 'INSTAGRAM');
      const identifier = identities.length > 0
        ? (identities[0]?.phoneE164 || identities[0]?.igUsername || '—')
        : 'Sem identificador';
      const tags = row.tags ?? [];
      return (<Card className={`p-4 ${row.awaitingHuman ? 'ring-1 ring-red-300 dark:ring-red-800 bg-red-50/40 dark:bg-red-900/10' : ''}`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm shrink-0">
            {getInitials(name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900 dark:text-white truncate">{normalizeDisplayName(name)}</p>
              {row.awaitingHuman && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"/>}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">{identifier}</p>
            {row.awaitingHuman && (<p className="text-[11px] font-medium text-red-600 dark:text-red-400 mt-1">Aguardando atendimento</p>)}
          </div>
          <ActionsDropdown contact={row} onEdit={(c) => setEditingContact(c)} onDelete={(c) => setDeletingContact(c)} onMarkAsRead={handleMarkAsRead}/>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {hasWA && (<div className="p-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" title="WhatsApp">
            <MessageCircle size={14}/>
          </div>)}
          {hasIG && (<div className="p-1.5 rounded-full bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400" title="Instagram">
            <Smartphone size={14}/>
          </div>)}
          {tags.length > 0 && tags.map((t) => (<Badge key={t.tagId} type="tag" text={t.tag.name}/>))}
        </div>

        {row.lastInteractionAt && (<p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    Última interação: {formatRelativeDate(row.lastInteractionAt)}
        </p>)}
      </Card>);
    }}/>)}

    <EditContactModal isOpen={!!editingContact} contact={editingContact} onClose={() => setEditingContact(null)} onSuccess={() => fetchContacts(query, 0, false)}/>

    <DeleteConfirmModal isOpen={!!deletingContact} contactName={deletingContact?.displayName || 'Sem nome'} loading={deletingLoading} onConfirm={handleDeleteContact} onCancel={() => setDeletingContact(null)}/>

    <ImportContactsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={(file) => contactService.importContacts(file)} onSuccess={() => { void fetchContacts(query, 0, false); fetchStats(); }}/>

    <SyncContactsModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} onSuccess={(result) => {
      fetchContacts(query, 0, false);
      fetchStats();
      addToast('success', `Você tem ${result.created} sincronizados via WhatsApp.`);
    }} whatsappChannels={whatsappChannels}/>

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
