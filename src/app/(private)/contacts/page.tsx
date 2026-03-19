/* eslint-disable no-console */
'use client';

import {
  AlertCircle,
  MoreVertical,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';

import { columns } from './components/ContactColumns';
import SyncContactsModal from './components/SyncContactsModal';

import Button from '@/components/Button';
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

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [whatsappChannels, setWhatsappChannels] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
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
      console.error('Erro ao carregar contatos:', err);
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
          renderActions={() => (
            <IconButton icon={<MoreVertical size={16} />} />
          )}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loadingMore={loadingMore}
        />
      )}

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
