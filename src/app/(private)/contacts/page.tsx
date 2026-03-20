'use client';

import {
  AlertCircle,
  Edit2,
  Loader2,
  MessageCircle,
  MoreVertical,
  RefreshCw,
  Smartphone,
  Trash2,
  Users,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState, useRef, useCallback } from 'react';

import { columns } from './components/ContactColumns';
import EditContactModal from './components/EditContactModal';
import SyncContactsModal from './components/SyncContactsModal';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import IconButton from '@/components/IconButton';
import PageLoader from '@/components/PageLoader';
import Table from '@/components/Table';
import { ToastContainer, useToast } from '@/components/Toast';
import { channelsService } from '@/services/channels.service';
import { contactService } from '@/services/contact.service';
import type { WhatsAppInstance } from '@/types/Channel';
import type { Contact } from '@/types/Contact';

const PAGE_SIZE = 50;

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

function formatRelativeDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0)
    return 'Hoje, ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return d.toLocaleDateString('pt-BR');
}

function ActionsDropdown({
  contact,
  onEdit,
  onDelete,
}: {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.right - 176,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
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

  return (
    <div ref={buttonRef}>
      <IconButton
        icon={<MoreVertical size={16} />}
        onClick={() => setOpen((prev) => !prev)}
      />
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit(contact);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <Edit2 size={15} className="text-slate-400" />
            Editar
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete(contact);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={15} />
            Excluir
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

function DeleteConfirmModal({
  isOpen,
  contactName,
  loading,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  contactName: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Excluir contato</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tem certeza que deseja excluir o contato <span className="font-medium text-slate-700 dark:text-slate-300">&quot;{contactName}&quot;</span>? Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {loading ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [whatsappChannels, setWhatsappChannels] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
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
      } else if (!hasLoaded.current) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contatos');
    } finally {
      hasLoaded.current = true;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchContacts('', 0, false),
      channelsService.getWhatsAppInstances().catch(() => [] as WhatsAppInstance[]),
    ]).then(([, waChannels]) => {
      setWhatsappChannels(waChannels);
    });
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        fetchContacts(value, 0, false);
      }, 350);
    },
    [fetchContacts],
  );

  const handleLoadMore = useCallback(() => {
    if (loadingMore || contacts.length >= total) return;
    fetchContacts(query, contacts.length, true);
  }, [loadingMore, contacts.length, total, query, fetchContacts]);

  const handleDeleteContact = async () => {
    if (!deletingContact) return;
    try {
      setDeletingLoading(true);
      await contactService.deleteContact(deletingContact.id);
      addToast('success', `Contato "${deletingContact.displayName || 'Sem nome'}" excluído com sucesso.`);
      setDeletingContact(null);
      await fetchContacts(query, 0, false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir contato';
      addToast('error', msg);
      console.error('Erro ao excluir contato:', err);
    } finally {
      setDeletingLoading(false);
    }
  };

  const hasMore = contacts.length < total;

  if (loading) {
    return <PageLoader message="Carregando contatos..." />;
  }

  if (error && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <Button onClick={() => fetchContacts('', 0, false)} size="sm">Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Contatos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Gerencie sua base de contatos e leads
            {total > 0 && (
              <span className="ml-2 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                {total} no total
              </span>
            )}
          </p>
        </div>

        <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={() => setIsSyncModalOpen(true)}>
          Sincronizar Contatos
        </Button>
      </header>

      {contacts.length === 0 && !query ? (
        <EmptyState
          icon={<Users size={22} />}
          title="Nenhum contato ainda"
          description="Sincronize contatos via WhatsApp ou Instagram, ou aguarde interações chegarem."
          action={{
            label: 'Sincronizar Contatos',
            icon: <RefreshCw size={15} />,
            onClick: () => setIsSyncModalOpen(true),
          }}
        />
      ) : (
        <Table
          columns={columns}
          data={contacts}
          actions={{
            searchBar: {
              placeholder: 'Buscar por nome, telefone ou @usuário...',
              value: query,
              onChange: handleSearchChange,
            },
          }}
          renderActions={(row: Contact) => (
            <ActionsDropdown
              contact={row}
              onEdit={(c) => setEditingContact(c)}
              onDelete={(c) => setDeletingContact(c)}
            />
          )}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loadingMore={loadingMore}
          renderMobileCard={(row: Contact) => {
            const name = row.displayName || 'Sem nome';
            const identities = row.identities ?? [];
            const hasWA = identities.some((i) => i.type === 'WHATSAPP');
            const hasIG = identities.some((i) => i.type === 'INSTAGRAM');
            const identifier = identities.length > 0
              ? (identities[0]?.phoneE164 || identities[0]?.igUsername || '—')
              : 'Sem identificador';
            const tags = row.tags ?? [];

            return (
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm shrink-0">
                    {getInitials(name) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">{identifier}</p>
                  </div>
                  <ActionsDropdown
                    contact={row}
                    onEdit={(c) => setEditingContact(c)}
                    onDelete={(c) => setDeletingContact(c)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {hasWA && (
                    <div className="p-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" title="WhatsApp">
                      <MessageCircle size={14} />
                    </div>
                  )}
                  {hasIG && (
                    <div className="p-1.5 rounded-full bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400" title="Instagram">
                      <Smartphone size={14} />
                    </div>
                  )}
                  {tags.length > 0 && tags.map((t) => (
                    <Badge key={t.tagId} type="tag" text={t.tag.name} />
                  ))}
                </div>

                {row.lastInteractionAt && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    Última interação: {formatRelativeDate(row.lastInteractionAt)}
                  </p>
                )}
              </Card>
            );
          }}
        />
      )}

      <EditContactModal
        isOpen={!!editingContact}
        contact={editingContact}
        onClose={() => setEditingContact(null)}
        onSuccess={() => fetchContacts(query, 0, false)}
      />

      <DeleteConfirmModal
        isOpen={!!deletingContact}
        contactName={deletingContact?.displayName || 'Sem nome'}
        loading={deletingLoading}
        onConfirm={handleDeleteContact}
        onCancel={() => setDeletingContact(null)}
      />

      <SyncContactsModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSuccess={(result) => {
          fetchContacts(query, 0, false);
          addToast('success', `Você tem ${result.created} sincronizados via WhatsApp.`);
        }}
        whatsappChannels={whatsappChannels}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
